import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { SLOT_TIMES } from "@/lib/slots";
import type { Store } from "@/lib/books/engine";

const COOKIE = "lqp_casa";
const PASS = "brasas5768";

function seal(value: string) {
  return createHash("sha256").update(`lqp-casa:${value}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function houseOpen() {
  const cookie = getCookie(COOKIE);
  return Boolean(cookie && safeEqual(cookie, seal(PASS)));
}

export function enterHouse(password: string) {
  if (!safeEqual(seal(password), seal(PASS))) return false;
  setCookie(COOKIE, seal(PASS), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

function assertHouse() {
  if (!houseOpen()) throw new Error("cerrado");
}

type Override = { price?: number; available?: boolean };

function num(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

export async function readMenu() {
  const sql = await getSql();
  const rows = await sql<{ kind: string; item_id: string; price: unknown; available: boolean | null }>`
    select kind, item_id, price, available from menu_overrides
  `;
  const plates: Record<string, Override> = {};
  const drinks: Record<string, Override> = {};
  for (const row of rows) {
    const patch: Override = {};
    const price = num(row.price);
    if (price !== undefined) patch.price = price;
    if (row.available === false) patch.available = false;
    if (row.kind === "plate") plates[row.item_id] = patch;
    if (row.kind === "drink") drinks[row.item_id] = patch;
  }
  return { plates, drinks };
}

export async function writeMenu(kind: "plate" | "drink", id: string, price: number | null, available: boolean) {
  assertHouse();
  const sql = await getSql();
  if (price == null && available) {
    await sql`delete from menu_overrides where kind = ${kind} and item_id = ${id}`;
    return;
  }
  await sql`
    insert into menu_overrides (kind, item_id, price, available)
    values (${kind}, ${id}, ${price}, ${available})
    on conflict (kind, item_id) do update set price = excluded.price, available = excluded.available
  `;
}

export async function placeHold(input: { date: string; time: string; party: number }) {
  if (!SLOT_TIMES.includes(input.time as (typeof SLOT_TIMES)[number])) throw new Error("hora");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("fecha");
  const party = Math.round(input.party);
  if (party < 1 || party > 20) throw new Error("personas");
  const id = randomUUID();
  const sql = await getSql();
  await sql`
    insert into holds (id, day, slot, party, status)
    values (${id}, ${input.date}, ${input.time}, ${party}, 'pendiente')
  `;
  return { id };
}

export async function listHolds() {
  assertHouse();
  const sql = await getSql();
  const rows = await sql<{ id: string; day: string; slot: string; party: number; status: string }>`
    select id, day, slot, party, status from holds order by day, slot, created_at
  `;
  return rows.map((row) => ({
    id: row.id,
    date: String(row.day).slice(0, 10),
    time: row.slot,
    party: Number(row.party),
    status: (row.status === "confirmada" || row.status === "no" ? row.status : "pendiente") as
      | "pendiente"
      | "confirmada"
      | "no",
    notes: "",
  }));
}

export async function markHold(id: string, status: "pendiente" | "confirmada" | "no") {
  assertHouse();
  const sql = await getSql();
  await sql`update holds set status = ${status} where id = ${id}`;
}

async function loadStore() {
  const sql = await getSql();
  const rows = await sql<{ doc: Store | string }>`select doc from casa_json where key = 'supplies'`;
  const doc = rows[0]?.doc;
  if (!doc) return null;
  if (typeof doc === "string") return JSON.parse(doc) as Store;
  return doc;
}

async function saveStore(store: Store) {
  const sql = await getSql();
  const doc = JSON.stringify(store);
  await sql.query(
    `insert into casa_json (key, doc) values ($1, $2::jsonb)
     on conflict (key) do update set doc = excluded.doc`,
    ["supplies", doc],
  );
}

async function desk(store: Store | null, book: "cocina" | "barra") {
  const { runWithStore, listSupplies, listPreps, usesOf } = await import("@/lib/books/engine");
  return runWithStore(store, () => {
    const supplies = listSupplies(book)
      .filter((supply) => supply.kind === "buy")
      .map((supply) => {
        const units = supply.units || 1;
        const yieldPct = supply.yield == null || supply.yield === 0 ? 1 : supply.yield;
        return {
          id: supply.id,
          name: supply.name,
          category: supply.category,
          pack: supply.pack,
          unit: supply.unit,
          buy: supply.buy,
          yield: supply.yield,
          each: supply.buy == null ? null : supply.buy / (units * yieldPct),
          used: usesOf(book, supply.name).length,
        };
      });
    const preps = listPreps(book).map((prep) => ({
      id: prep.id,
      name: prep.name,
      yield: prep.yield,
      lines: prep.lines.map((line, index) => ({
        index,
        name: line.name,
        qty: line.qty,
        each: line.each,
      })),
    }));
    return { supplies, preps };
  }).result;
}

export async function supplyDesk(book: "cocina" | "barra") {
  assertHouse();
  return desk(await loadStore(), book);
}

export async function patchSupply(input: {
  book: "cocina" | "barra";
  kind: "buy" | "yield" | "prepQty" | "prepEach" | "reset";
  id?: string;
  index?: number;
  value?: number;
}) {
  assertHouse();
  const engine = await import("@/lib/books/engine");
  if (input.kind === "reset") {
    await saveStore(engine.runWithStore(null, () => undefined).store);
    return desk(null, input.book);
  }
  const { store } = engine.runWithStore(await loadStore(), () => {
    if (input.kind === "buy" && input.id != null && input.value != null) {
      engine.setSupplyBuy(input.book, input.id, input.value);
    }
    if (input.kind === "yield" && input.id != null && input.value != null) {
      engine.setSupplyYield(input.book, input.id, input.value);
    }
    if (input.kind === "prepQty" && input.id != null && input.index != null && input.value != null) {
      engine.setPrepQty(input.book, input.id, input.index, input.value);
    }
    if (input.kind === "prepEach" && input.id != null && input.index != null && input.value != null) {
      engine.setPrepEach(input.book, input.id, input.index, input.value);
    }
  });
  await saveStore(store);
  return desk(store, input.book);
}

export async function menuCosts() {
  assertHouse();
  const { foodCost, barCost } = await import("@/lib/books/engine");
  const { listPlates } = await import("@/lib/plates");
  const { listDrinks, DRINK_TARGET } = await import("@/lib/drinks");
  const plates: Record<string, number> = {};
  for (const plate of listPlates()) {
    const cost = foodCost(plate.es);
    if (cost != null) plates[plate.id] = cost;
  }
  const drinks: Record<string, number> = {};
  for (const drink of listDrinks()) {
    const cost = barCost(drink.es);
    if (cost != null) drinks[drink.id] = cost;
  }
  return { plates, drinks, targets: DRINK_TARGET };
}

type WeekBook = Record<string, Record<string, number>>;
type LaborDoc = { wage: number; minutes: Record<string, number> };

function finite(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function weekBook(value: unknown): WeekBook {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: WeekBook = {};
  for (const [week, row] of Object.entries(value as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || !row || typeof row !== "object" || Array.isArray(row)) continue;
    const counts: Record<string, number> = {};
    for (const [id, raw] of Object.entries(row as Record<string, unknown>)) {
      if (!/^[a-z0-9-]{1,48}$/.test(id)) continue;
      const n = finite(raw);
      if (n == null || n <= 0 || n >= 100000) continue;
      counts[id] = Math.round(n);
    }
    if (Object.keys(counts).length) out[week] = counts;
  }
  return out;
}

function laborDoc(value: unknown): LaborDoc {
  const src = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const wage = finite(src.wage);
  const minutes: Record<string, number> = {};
  const raw = src.minutes;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [id, n] of Object.entries(raw as Record<string, unknown>)) {
      if (!/^[a-z0-9-]{1,48}$/.test(id)) continue;
      const minutesValue = finite(n);
      if (minutesValue == null || minutesValue <= 0 || minutesValue > 24 * 60) continue;
      minutes[id] = Math.round(minutesValue);
    }
  }
  return { wage: wage != null && wage > 0 && wage < 10000 ? wage : 0, minutes };
}

async function readJson(key: string) {
  const sql = await getSql();
  const rows = await sql<{ doc: unknown }>`select doc from casa_json where key = ${key}`;
  const doc = rows[0]?.doc;
  if (!doc) return null;
  if (typeof doc === "string") {
    try {
      return JSON.parse(doc) as unknown;
    } catch {
      return null;
    }
  }
  return doc;
}

async function writeJson(key: string, doc: unknown) {
  const sql = await getSql();
  await sql.query(
    `insert into casa_json (key, doc) values ($1, $2::jsonb)
     on conflict (key) do update set doc = excluded.doc`,
    [key, JSON.stringify(doc)],
  );
}

export async function readOps() {
  assertHouse();
  const [labor, pour, kitchen] = await Promise.all([readJson("labor"), readJson("pour"), readJson("kitchen")]);
  return { labor: laborDoc(labor), pour: weekBook(pour), kitchen: weekBook(kitchen) };
}

export async function writeOps(key: "labor" | "pour" | "kitchen", doc: unknown) {
  assertHouse();
  const clean = key === "labor" ? laborDoc(doc) : weekBook(doc);
  await writeJson(key, clean);
  return clean;
}
