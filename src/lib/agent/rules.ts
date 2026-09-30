/**
 * Pure booking rules — no I/O, no path aliases, so `node --test` loads it
 * directly. The server layer (booking.server.ts) feeds it rows and config.
 */

export type Rules = {
  slots: readonly string[];
  coversPerSlot: number;
  autoConfirmMaxParty: number;
  maxParty: number;
  bookAheadDays: number;
  minLeadMinutes: number;
  closedWeekdays: number[];
  utcOffset: string;
};

export type Booked = { slot: string; party: number };

export type SlotAvailability = { time: string; left: number; open: boolean };

export type Refusal =
  | "fecha_invalida"
  | "pasado"
  | "muy_lejos"
  | "cerrado"
  | "hora_invalida"
  | "muy_pronto"
  | "personas_invalidas"
  | "grupo_grande"
  | "lleno";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function slotStartMs(date: string, time: string, utcOffset: string) {
  return new Date(`${date}T${time}:00${utcOffset}`).getTime();
}

/** Local calendar date (YYYY-MM-DD) at `now` in the fixed offset. */
export function localToday(now: number, utcOffset: string) {
  const sign = utcOffset.startsWith("-") ? -1 : 1;
  const [h, m] = utcOffset.slice(1).split(":").map(Number);
  const shifted = new Date(now + sign * (h * 60 + (m || 0)) * 60_000);
  return shifted.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(iso: string) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

/** Why a date can't be booked at all, or null. */
export function dateRefusal(date: string, rules: Rules, now: number): Refusal | null {
  if (!ISO_DATE.test(date) || Number.isNaN(new Date(`${date}T12:00:00Z`).getTime())) return "fecha_invalida";
  const today = localToday(now, rules.utcOffset);
  if (date < today) return "pasado";
  if (date > addDays(today, rules.bookAheadDays)) return "muy_lejos";
  if (rules.closedWeekdays.includes(weekday(date))) return "cerrado";
  return null;
}

/** Remaining covers per slot for a date. `booked` = active (non-cancelled) holds that day. */
export function availability(date: string, booked: Booked[], rules: Rules, now: number): SlotAvailability[] {
  const closed = dateRefusal(date, rules, now) !== null;
  const used = new Map<string, number>();
  for (const b of booked) used.set(b.slot, (used.get(b.slot) ?? 0) + Math.max(0, Number(b.party) || 0));
  return rules.slots.map((time) => {
    const left = Math.max(0, rules.coversPerSlot - (used.get(time) ?? 0));
    const tooSoon = slotStartMs(date, time, rules.utcOffset) - now < rules.minLeadMinutes * 60_000;
    return { time, left, open: !closed && !tooSoon && left > 0 };
  });
}

export type Decision =
  | { ok: true; status: "confirmada" | "pendiente" }
  | { ok: false; reason: Refusal; alternatives: string[] };

/**
 * Decide a booking. Large parties are never refused for size alone — they go
 * to staff as "pendiente" (a group is revenue; a human should say yes or no).
 */
export function decide(
  input: { date: string; time: string; party: number },
  booked: Booked[],
  rules: Rules,
  now: number,
): Decision {
  const dateBad = dateRefusal(input.date, rules, now);
  if (dateBad) return { ok: false, reason: dateBad, alternatives: [] };
  if (!rules.slots.includes(input.time)) return { ok: false, reason: "hora_invalida", alternatives: [] };
  const party = Math.round(Number(input.party));
  if (!Number.isFinite(party) || party < 1) return { ok: false, reason: "personas_invalidas", alternatives: [] };
  if (party > rules.maxParty) return { ok: false, reason: "grupo_grande", alternatives: [] };

  const slots = availability(input.date, booked, rules, now);
  const target = slots.find((s) => s.time === input.time)!;
  const fits = (s: SlotAvailability) => s.open && s.left >= party;
  if (!fits(target)) {
    const idx = rules.slots.indexOf(input.time);
    const alternatives = slots
      .filter(fits)
      .sort((a, b) => Math.abs(rules.slots.indexOf(a.time) - idx) - Math.abs(rules.slots.indexOf(b.time) - idx))
      .slice(0, 3)
      .map((s) => s.time)
      .sort();
    const tooSoon = slotStartMs(input.date, input.time, rules.utcOffset) - now < rules.minLeadMinutes * 60_000;
    return { ok: false, reason: tooSoon ? "muy_pronto" : "lleno", alternatives };
  }
  return { ok: true, status: party <= rules.autoConfirmMaxParty ? "confirmada" : "pendiente" };
}

/** Human-friendly booking code: no 0/O/1/I. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeCode(random: () => number = Math.random) {
  let out = "";
  for (let i = 0; i < 5; i += 1) out += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return out;
}

/** Normalize a phone to digits (keeps a leading +). Panama 8-digit locals get +507. */
export function normalizePhone(raw: string) {
  const digits = String(raw ?? "").replace(/[^\d+]/g, "");
  let phone = digits.startsWith("+") ? `+${digits.slice(1).replace(/\+/g, "")}` : digits.replace(/\+/g, "");
  if (/^[2-9]\d{7}$/.test(phone)) phone = `+507${phone}`;
  if (/^507\d{8}$/.test(phone)) phone = `+${phone}`;
  const bare = phone.replace("+", "");
  return bare.length >= 7 && bare.length <= 15 ? phone : null;
}
