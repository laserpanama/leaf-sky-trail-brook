import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, getRequestIP, setCookie } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { SLOT_TIMES } from "@/lib/slots";
import type { Store } from "@/lib/books/engine";

/**
 * House (admin) access.
 * - CASA_PASSWORD: the key staff type in /admin. Never commit it.
 * - CASA_SECRET:   32+ random chars used to sign sessions. Rotate it to log everyone out.
 * Missing or weak config => the house stays closed (fail closed).
 */
export const COOKIE = "lqp_casa";
const SESSION_SECONDS = 60 * 60 * 24 * 14;
const LOGIN_WINDOW_MIN = 15;
const LOGIN_MAX_PER_IP = 5;
const LOGIN_MAX_GLOBAL = 40;

function houseConfig() {
  const pass = env("CASA_PASSWORD");
  const secret = env("CASA_SECRET");
  if (!pass || pass.length < 10 || !secret || secret.length < 32) return null;
  return { pass, secret };
}

export function houseConfigured() {
  return houseConfig() !== null;
}

function hmac(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Session = "<expiresAt>.<hmac(expiresAt|passwordFingerprint)>". Changing the password or the secret revokes all sessions. */
function signSession(expires: number) {
  const cfg = houseConfig();
  if (!cfg) return null;
  const fingerprint = createHash("sha256").update(cfg.pass).digest("hex");
  return `${expires}.${hmac(cfg.secret, `${expires}|${fingerprint}`)}`;
}

export function verifySession(token: string | undefined | null) {
  if (!token) return false;
  const [raw, mac] = token.split(".");
  const expires = Number(raw);
  if (!mac || !Number.isFinite(expires) || expires * 1000 < Date.now()) return false;
  const expected = signSession(expires);
  return Boolean(expected && safeEqual(token, expected));
}

export function readCookieHeader(header: string | null, name: string) {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function houseOpen() {
  return verifySession(getCookie(COOKIE));
}

export function ipKey() {
  let ip = "unknown";
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  } catch {
    /* no request context */
  }
  const salt = env("CASA_SECRET") ?? "lqp";
  // Use the LAST X-Forwarded-For hop: it is the one added by our own proxy (Vercel / Nginx).
  // The first hop is client-controlled and would let a bot rotate "IPs" to dodge limits.
  const hop = ip.split(",").map((part) => part.trim()).filter(Boolean).pop() ?? "unknown";
  return createHash("sha256").update(`${salt}|${hop}`).digest("hex").slice(0, 32);
}

export type EnterResult = { open: boolean; reason?: "config" | "wait" | "key" };

export async function enterHouse(password: string): Promise<EnterResult> {
  const cfg = houseConfig();
  if (!cfg) return { open: false, reason: "config" };
  const sql = await getSql();
  const ip = ipKey();
  const [mine] = await sql<{ n: number }>`
    select count(*)::int as n from casa_attempts
    where ip_hash = ${ip} and at > now() - make_interval(mins => ${LOGIN_WINDOW_MIN})
  `;
  const [all] = await sql<{ n: number }>`
    select count(*)::int as n from casa_attempts
    where at > now() - make_interval(mins => ${LOGIN_WINDOW_MIN})
  `;
  if (Number(mine?.n) >= LOGIN_MAX_PER_IP || Number(all?.n) >= LOGIN_MAX_GLOBAL) {
    return { open: false, reason: "wait" };
  }
  // Compare fixed-length MACs so length never leaks.
  if (!safeEqual(hmac(cfg.secret, password), hmac(cfg.secret, cfg.pass))) {
    await sql`insert into casa_attempts (ip_hash) values (${ip})`;
    await sql`delete from casa_attempts where at < now() - interval '1 day'`;
    return { open: false, reason: "key" };
  }
  await sql`delete from casa_attempts where ip_hash = ${ip}`;
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  setCookie(COOKIE, signSession(expires)!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return { open: true };
}

export function leaveHouse() {
  deleteCookie(COOKIE, { path: "/" });
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

export type HoldInput = {
  date: string;
  time: string;
  party: number;
  name: string;
  phone: string;
  notes?: string;
  website?: string;
};

const HOLDS_PER_IP_10MIN = 3;
const HOLDS_PER_IP_DAY = 8;
const HOLDS_GLOBAL_DAY = 200;
const BOOK_AHEAD_DAYS = 90;

function panamaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama" }).format(new Date());
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function cleanHold(input: HoldInput) {
  if (!SLOT_TIMES.includes(input.time as (typeof SLOT_TIMES)[number])) throw new Error("hora");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("fecha");
  const today = panamaToday();
  if (input.date < today || input.date > addDaysIso(today, BOOK_AHEAD_DAYS)) throw new Error("fecha");
  const party = Math.round(Number(input.party));
  if (!Number.isFinite(party) || party < 1 || party > 20) throw new Error("personas");
  const name = String(input.name ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (name.length < 2) throw new Error("nombre");
  const digits = String(input.phone ?? "").replace(/[^\d+]/g, "");
  const phone = digits.startsWith("+") ? `+${digits.slice(1).replace(/\+/g, "")}` : digits.replace(/\+/g, "");
  const bare = phone.replace("+", "");
  if (bare.length < 7 || bare.length > 15) throw new Error("telefono");
  const notes = String(input.notes ?? "").trim().slice(0, 300);
  return { date: input.date, time: input.time, party, name, phone, notes };
}

export async function placeHold(input: HoldInput) {
  // Honeypot: real people never fill the hidden "website" field. Pretend success, store nothing.
  if (input.website && input.website.trim()) return { id: randomUUID() };
  const hold = cleanHold(input);
  const sql = await getSql();
  const ip = ipKey();
  const [recent] = await sql<{ short: number; day: number; global: number }>`
    select
      count(*) filter (where ip_hash = ${ip} and created_at > now() - interval '10 minutes')::int as short,
      count(*) filter (where ip_hash = ${ip} and created_at > now() - interval '1 day')::int as day,
      count(*) filter (where created_at > now() - interval '1 day')::int as global
    from holds
  `;
  if (
    Number(recent?.short) >= HOLDS_PER_IP_10MIN ||
    Number(recent?.day) >= HOLDS_PER_IP_DAY ||
    Number(recent?.global) >= HOLDS_GLOBAL_DAY
  ) {
    throw new Error("espera");
  }
  const [dupe] = await sql<{ id: string }>`
    select id from holds where day = ${hold.date} and slot = ${hold.time} and phone = ${hold.phone} limit 1
  `;
  if (dupe) return { id: dupe.id };
  const id = randomUUID();
  await sql`
    insert into holds (id, day, slot, party, status, name, phone, notes, ip_hash)
    values (${id}, ${hold.date}, ${hold.time}, ${hold.party}, 'pendiente', ${hold.name}, ${hold.phone}, ${hold.notes}, ${ip})
  `;
  return { id };
}

export async function listHolds() {
  assertHouse();
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    day: string;
    slot: string;
    party: number;
    status: string;
    name: string | null;
    phone: string | null;
    notes: string | null;
  }>`
    select id, day, slot, party, status, name, phone, notes from holds
    where day >= to_char(now() - interval '7 days', 'YYYY-MM-DD')
    order by day, slot, created_at
    limit 500
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
    name: row.name ?? "",
    phone: row.phone ?? "",
    notes: row.notes ?? "",
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
