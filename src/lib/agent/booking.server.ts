import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { agentConfig, type AgentConfig } from "@/lib/agent/config";
import {
  availability,
  dateRefusal,
  decide,
  makeCode,
  normalizePhone,
  type Booked,
  type Refusal,
  type Rules,
} from "@/lib/agent/rules";

/**
 * Booking service shared by every channel (web chat, Telegram, later WhatsApp).
 * The LLM never touches SQL — it only calls these functions through tools, so
 * capacity rules protect chat bookings exactly like any other booking.
 */

function rules(cfg: AgentConfig = agentConfig()): Rules {
  return {
    slots: cfg.slots,
    coversPerSlot: cfg.coversPerSlot,
    autoConfirmMaxParty: cfg.autoConfirmMaxParty,
    maxParty: cfg.maxParty,
    bookAheadDays: cfg.bookAheadDays,
    minLeadMinutes: cfg.minLeadMinutes,
    closedWeekdays: cfg.closedWeekdays,
    utcOffset: cfg.utcOffset,
  };
}

/** Holds that consume capacity: everything not declined/cancelled. */
async function bookedOn(date: string): Promise<Booked[]> {
  const sql = await getSql();
  const rows = await sql<{ slot: string; party: number }>`
    select slot, party from holds where day = ${date} and status <> 'no'
  `;
  return rows.map((r) => ({ slot: r.slot, party: Number(r.party) }));
}

/**
 * Serialize booking writes per date inside this process. The app runs as one
 * PM2 process, so this closes the check-then-insert race; the conditional
 * insert below is a second guard if it is ever scaled out.
 */
const locks = new Map<string, Promise<unknown>>();
async function withDateLock<T>(date: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(date) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  locks.set(date, next);
  try {
    return await next;
  } finally {
    if (locks.get(date) === next) locks.delete(date);
  }
}

export async function checkAvailability(input: { date: string; party?: number }) {
  const cfg = agentConfig();
  const r = rules(cfg);
  const now = Date.now();
  const refusal = dateRefusal(input.date, r, now);
  if (refusal) return { ok: false as const, reason: refusal };
  const party = Math.max(1, Math.round(Number(input.party) || 1));
  const slots = availability(input.date, await bookedOn(input.date), r, now);
  return {
    ok: true as const,
    date: input.date,
    party,
    open: slots.filter((s) => s.open && s.left >= party).map((s) => s.time),
    full: slots.filter((s) => !s.open || s.left < party).map((s) => s.time),
    needsStaff: party > cfg.autoConfirmMaxParty,
  };
}

export type BookInput = {
  date: string;
  time: string;
  party: number;
  name: string;
  phone: string;
  notes?: string;
  source: "web-chat" | "telegram" | "whatsapp";
  threadId: string;
};

export type BookResult =
  | { ok: true; id: string; code: string; status: "confirmada" | "pendiente"; date: string; time: string; party: number; name: string }
  | { ok: false; reason: Refusal | "nombre_invalido" | "telefono_invalido" | "duplicada"; alternatives?: string[]; code?: string };

export async function createReservation(input: BookInput): Promise<BookResult> {
  const name = String(input.name ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (name.length < 2) return { ok: false, reason: "nombre_invalido" };
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, reason: "telefono_invalido" };
  const notes = String(input.notes ?? "").trim().slice(0, 300);
  const party = Math.round(Number(input.party));

  return withDateLock(input.date, async () => {
    const sql = await getSql();
    const [dupe] = await sql<{ code: string | null }>`
      select code from holds
      where day = ${input.date} and slot = ${input.time} and phone = ${phone} and status <> 'no'
      limit 1
    `;
    if (dupe) return { ok: false, reason: "duplicada", code: dupe.code ?? undefined };

    const r = rules();
    const verdict = decide({ date: input.date, time: input.time, party }, await bookedOn(input.date), r, Date.now());
    if (!verdict.ok) return { ok: false, reason: verdict.reason, alternatives: verdict.alternatives };

    const id = randomUUID();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = makeCode();
      try {
        // Conditional insert: only lands if the slot still has room.
        const inserted = await sql<{ id: string }>`
          insert into holds (id, day, slot, party, status, name, phone, notes, code, source, thread_id)
          select ${id}, ${input.date}, ${input.time}, ${party}, ${verdict.status}, ${name}, ${phone}, ${notes},
                 ${code}, ${input.source}, ${input.threadId}
          where (
            select coalesce(sum(party), 0) from holds
            where day = ${input.date} and slot = ${input.time} and status <> 'no'
          ) + ${party} <= ${r.coversPerSlot}
          returning id
        `;
        if (!inserted.length) return { ok: false, reason: "lleno", alternatives: [] };
        return { ok: true, id, code, status: verdict.status, date: input.date, time: input.time, party, name };
      } catch (err) {
        if (String((err as Error)?.message ?? "").includes("holds_code_idx")) continue; // code collision
        throw err;
      }
    }
    throw new Error("code");
  });
}

/** Last 8 digits: matches "+50761234567", "61234567" and "6123-4567" alike. */
function phoneTail(raw: string) {
  return String(raw ?? "").replace(/\D/g, "").slice(-8);
}

export type Found = { code: string | null; date: string; time: string; party: number; status: string; name: string };

export async function findReservations(input: { phone: string; code?: string }): Promise<Found[]> {
  const tail = phoneTail(input.phone);
  if (tail.length < 7) return [];
  const sql = await getSql();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: agentConfig().timezone }).format(new Date());
  const rows = await sql<{ code: string | null; day: string; slot: string; party: number; status: string; name: string }>`
    select code, day, slot, party, status, name from holds
    where right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 8) = ${tail}
      and day >= ${today}
      and (${input.code ?? null}::text is null or code = upper(${input.code ?? ""}))
    order by day, slot
    limit 10
  `;
  return rows.map((r) => ({ code: r.code, date: r.day, time: r.slot, party: Number(r.party), status: r.status, name: r.name }));
}

export async function cancelReservation(input: { code: string; phone: string }) {
  const tail = phoneTail(input.phone);
  const code = String(input.code ?? "").trim().toUpperCase();
  if (!code || tail.length < 7) return { ok: false as const, reason: "no_encontrada" };
  const sql = await getSql();
  const rows = await sql<{ id: string; day: string; slot: string; party: number; name: string }>`
    update holds set status = 'no'
    where code = ${code}
      and right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 8) = ${tail}
      and status <> 'no'
    returning id, day, slot, party, name
  `;
  const row = rows[0];
  if (!row) return { ok: false as const, reason: "no_encontrada" };
  return { ok: true as const, id: row.id, code, date: row.day, time: row.slot, party: Number(row.party), name: row.name };
}

/** Staff action from Telegram buttons. */
export async function setStatusById(id: string, status: "confirmada" | "no") {
  const sql = await getSql();
  const rows = await sql<{ id: string; day: string; slot: string; party: number; name: string; phone: string; code: string | null; thread_id: string | null; status: string }>`
    update holds set status = ${status} where id = ${id}
    returning id, day, slot, party, name, phone, code, thread_id, status
  `;
  return rows[0] ?? null;
}
