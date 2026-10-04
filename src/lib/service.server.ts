import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { assertRole, readMenu } from "@/lib/casa-ops.server";
import type { Pay, ServiceMenuItem, StationStatus, StationTicket, Tab, TabOrder } from "@/lib/service";

/**
 * Floor service (template-reusable module).
 *
 *  mesero ── takeOrder(table, lines) ──► orders (source 'mesero')
 *                                          │  plates → kitchen_status 'pendiente'
 *                                          │  drinks → bar_status 'pendiente'
 *  cocina ── stationTickets('cocina') / markStation ──┤
 *  barra  ── stationTickets('barra')  / markStation ──┤  both ready → orders.status 'listo'
 *  barra  ── openTabs() / chargeTab(orderIds, pay) ───┘  the till lives at the bar
 *
 * Web orders (from the public cart) start with both stations at 'na' and only reach the
 * kitchen/bar once the bar accepts them, so a prank order never fires a ticket.
 * Prices always come from the server-side menu, never from the client.
 */

const UUID = /^[0-9a-f-]{36}$/i;
const MAX_LINES = 40;

function clean(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function iso(value: unknown) {
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function menuItems() {
  const menu = await readMenu();
  const { replacePlateOverrides, listPlates, plateLabel } = await import("@/lib/plates");
  const { replaceDrinkOverrides, listDrinks, sectionLabel } = await import("@/lib/drinks");
  replacePlateOverrides(menu.plates);
  replaceDrinkOverrides(menu.drinks);
  const items: ServiceMenuItem[] = [
    ...listPlates().map((p) => ({
      kind: "plate" as const,
      id: p.id,
      name: p.es,
      section: plateLabel[p.section].es,
      price: p.price,
      available: p.available,
    })),
    ...listDrinks().map((d) => ({
      kind: "drink" as const,
      id: d.id,
      name: d.es,
      section: sectionLabel[d.section].es,
      price: d.price,
      available: d.available,
    })),
  ];
  return items;
}

/* ───────────── menu for the floor ───────────── */

export async function serviceMenu() {
  assertRole("mesero", "cocina", "barra");
  return menuItems();
}

/** 86 an item. Kitchen switches dishes, bar switches drinks, gerencia both. Price untouched. */
export async function setAvailability(kind: "plate" | "drink", id: string, available: boolean) {
  const role = assertRole("cocina", "barra");
  if (role === "cocina" && kind !== "plate") throw new Error("cerrado");
  if (role === "barra" && kind !== "drink") throw new Error("cerrado");
  const items = await menuItems();
  if (!items.some((item) => item.kind === kind && item.id === id)) throw new Error("carta");
  const sql = await getSql();
  const [row] = await sql<{ price: unknown }>`select price from menu_overrides where kind = ${kind} and item_id = ${id}`;
  const price = row?.price == null ? null : Number(row.price);
  if (price == null && available) {
    await sql`delete from menu_overrides where kind = ${kind} and item_id = ${id}`;
    return;
  }
  await sql`
    insert into menu_overrides (kind, item_id, price, available)
    values (${kind}, ${id}, ${price}, ${available})
    on conflict (kind, item_id) do update set available = excluded.available
  `;
}

/* ───────────── waiter: take an order ───────────── */

export type TakeOrderInput = {
  table: string;
  waiter: string;
  service: "mesa" | "llevar";
  note?: string;
  lines: { kind: "plate" | "drink"; id: string; qty: number; note?: string }[];
};

export async function takeOrder(input: TakeOrderInput) {
  assertRole("mesero", "barra");
  const service = input.service === "llevar" ? "llevar" : "mesa";
  const table = clean(input.table, 24) || (service === "llevar" ? "Para llevar" : "");
  if (!table) throw new Error("mesa");
  const waiter = clean(input.waiter, 40);
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > MAX_LINES) throw new Error("pedido");
  const items = await menuItems();
  const priced = input.lines.map((line) => {
    const qty = Math.round(Number(line.qty));
    if (!Number.isInteger(qty) || qty < 1 || qty > 30) throw new Error("cantidad");
    const item = items.find((i) => i.kind === line.kind && i.id === line.id);
    if (!item) throw new Error("carta");
    if (!item.available) throw new Error(`agotado:${item.name}`);
    return { kind: item.kind, id: item.id, qty, price: item.price, note: clean(line.note, 140) };
  });
  const total = priced.reduce((sum, l) => sum + l.qty * l.price, 0);
  const kitchen: StationStatus = priced.some((l) => l.kind === "plate") ? "pendiente" : "na";
  const bar: StationStatus = priced.some((l) => l.kind === "drink") ? "pendiente" : "na";
  const id = randomUUID();
  const sql = await getSql();
  await sql`
    insert into orders (id, service, status, total, pay, pay_status, source, table_label, waiter, note, kitchen_status, bar_status)
    values (${id}, ${service}, 'pendiente', ${total}, 'efectivo', 'pendiente', 'mesero', ${table}, ${waiter},
            ${clean(input.note, 200)}, ${kitchen}, ${bar})
  `;
  for (const line of priced) {
    await sql`
      insert into order_lines (order_id, kind, item_id, qty, price, note)
      values (${id}, ${line.kind}, ${line.id}, ${line.qty}, ${line.price}, ${line.note})
    `;
  }
  return { id, total };
}

/* ───────────── stations: kitchen and bar ───────────── */

type OrderRow = {
  id: string;
  service: string;
  status: string;
  source: string;
  table_label: string;
  waiter: string;
  note: string;
  total: unknown;
  pay: string;
  pay_status: string;
  kitchen_status: string;
  bar_status: string;
  kitchen_ready_at: unknown;
  bar_ready_at: unknown;
  created_at: unknown;
};

type LineRow = { order_id: string; kind: string; item_id: string; qty: number; price: unknown; note: string };

async function linesFor(orderIds: string[]) {
  if (!orderIds.length) return [] as LineRow[];
  const sql = await getSql();
  return sql.query<LineRow>(
    "select order_id, kind, item_id, qty, price, note from order_lines where order_id = any($1::text[])",
    [orderIds],
  );
}

function station(value: string): StationStatus {
  return value === "pendiente" || value === "listo" ? value : "na";
}

function label(row: OrderRow) {
  if (row.table_label) return row.table_label;
  return row.service === "llevar" ? "Para llevar (web)" : "Web";
}

export async function stationTickets(which: "cocina" | "barra"): Promise<StationTicket[]> {
  assertRole(which, "mesero");
  const sql = await getSql();
  const rows =
    which === "cocina"
      ? await sql<OrderRow>`
          select * from orders where status <> 'no' and (
            kitchen_status = 'pendiente' or (kitchen_status = 'listo' and kitchen_ready_at > now() - interval '45 minutes'))
          order by created_at asc limit 80`
      : await sql<OrderRow>`
          select * from orders where status <> 'no' and (
            bar_status = 'pendiente' or (bar_status = 'listo' and bar_ready_at > now() - interval '45 minutes'))
          order by created_at asc limit 80`;
  const kind = which === "cocina" ? "plate" : "drink";
  const lines = await linesFor(rows.map((r) => r.id));
  const names = new Map((await menuItems()).map((i) => [`${i.kind}:${i.id}`, i.name]));
  return rows.map((row) => ({
    id: row.id,
    table: label(row),
    waiter: row.waiter,
    service: row.service === "llevar" ? "llevar" : "mesa",
    source: row.source === "mesero" ? "mesero" : "web",
    note: row.note,
    status: station(which === "cocina" ? row.kitchen_status : row.bar_status),
    readyAt: (() => {
      const at = which === "cocina" ? row.kitchen_ready_at : row.bar_ready_at;
      return at ? iso(at) : null;
    })(),
    createdAt: iso(row.created_at),
    lines: lines
      .filter((l) => l.order_id === row.id && l.kind === kind)
      .map((l) => ({ name: names.get(`${l.kind}:${l.item_id}`) ?? l.item_id, qty: Number(l.qty), note: l.note ?? "" })),
  }));
}

export async function markStation(orderId: string, which: "cocina" | "barra", status: "pendiente" | "listo") {
  assertRole(which);
  if (!UUID.test(orderId)) throw new Error("pedido");
  const sql = await getSql();
  if (which === "cocina") {
    await sql`
      update orders set kitchen_status = ${status}, kitchen_ready_at = case when ${status} = 'listo' then now() else null end
      where id = ${orderId} and kitchen_status <> 'na'
    `;
  } else {
    await sql`
      update orders set bar_status = ${status}, bar_ready_at = case when ${status} = 'listo' then now() else null end
      where id = ${orderId} and bar_status <> 'na'
    `;
  }
  // The order is ready when no station still owes it anything.
  await sql`
    update orders set status = case
      when kitchen_status <> 'pendiente' and bar_status <> 'pendiente' and (kitchen_status = 'listo' or bar_status = 'listo') then 'listo'
      else 'pendiente' end
    where id = ${orderId} and status <> 'no'
  `;
}

/* ───────────── till: open tabs, charge, accept web orders ───────────── */

export async function openTabs(): Promise<{ tabs: Tab[]; web: TabOrder[] }> {
  assertRole("barra", "mesero");
  const sql = await getSql();
  const rows = await sql<OrderRow>`
    select * from orders
    where status <> 'no' and pay_status = 'pendiente' and created_at > now() - interval '36 hours'
    order by created_at asc limit 200
  `;
  const lines = await linesFor(rows.map((r) => r.id));
  const names = new Map((await menuItems()).map((i) => [`${i.kind}:${i.id}`, i.name]));
  const toOrder = (row: OrderRow): TabOrder => ({
    id: row.id,
    source: row.source === "mesero" ? "mesero" : "web",
    service: row.service === "llevar" ? "llevar" : "mesa",
    table: label(row),
    waiter: row.waiter,
    note: row.note,
    pay: (row.pay === "yappy" || row.pay === "tarjeta" ? row.pay : "efectivo") as Pay,
    kitchen: station(row.kitchen_status),
    bar: station(row.bar_status),
    accepted: row.source === "mesero" || row.kitchen_status !== "na" || row.bar_status !== "na",
    total: Number(row.total),
    createdAt: iso(row.created_at),
    lines: lines
      .filter((l) => l.order_id === row.id)
      .map((l) => ({
        kind: (l.kind === "drink" ? "drink" : "plate") as "plate" | "drink",
        name: names.get(`${l.kind}:${l.item_id}`) ?? l.item_id,
        qty: Number(l.qty),
        price: Number(l.price),
        note: l.note ?? "",
      })),
  });
  const byTable = new Map<string, TabOrder[]>();
  const web: TabOrder[] = [];
  for (const row of rows) {
    const order = toOrder(row);
    if (order.source === "web") {
      web.push(order);
      continue;
    }
    const key = order.table.toLowerCase();
    byTable.set(key, [...(byTable.get(key) ?? []), order]);
  }
  const tabs: Tab[] = [...byTable.values()].map((orders) => ({
    table: orders[0].table,
    waiters: [...new Set(orders.map((o) => o.waiter).filter(Boolean))],
    orders,
    total: orders.reduce((sum, o) => sum + o.total, 0),
    openedAt: orders[0].createdAt,
    pending: orders.some((o) => o.kitchen === "pendiente" || o.bar === "pendiente"),
  }));
  tabs.sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  return { tabs, web };
}

export async function chargeTab(orderIds: string[], pay: Pay) {
  assertRole("barra");
  if (!Array.isArray(orderIds) || !orderIds.length || orderIds.length > 60 || !orderIds.every((id) => UUID.test(id))) {
    throw new Error("cuenta");
  }
  if (pay !== "yappy" && pay !== "tarjeta" && pay !== "efectivo") throw new Error("pago");
  const sql = await getSql();
  const rows = await sql.query<{ total: unknown }>(
    `update orders set pay = $1, pay_status = 'cobrado', paid_at = now()
     where id = any($2::text[]) and pay_status = 'pendiente' and status <> 'no'
     returning total`,
    [pay, orderIds],
  );
  return { charged: rows.length, total: rows.reduce((sum, r) => sum + Number(r.total), 0) };
}

/** Bar confirms a web order (after checking WhatsApp): its tickets fire to kitchen and bar. */
export async function acceptWebOrder(orderId: string) {
  assertRole("barra");
  if (!UUID.test(orderId)) throw new Error("pedido");
  const sql = await getSql();
  const lines = await linesFor([orderId]);
  if (!lines.length) throw new Error("pedido");
  const kitchen: StationStatus = lines.some((l) => l.kind === "plate") ? "pendiente" : "na";
  const bar: StationStatus = lines.some((l) => l.kind === "drink") ? "pendiente" : "na";
  await sql`
    update orders set kitchen_status = ${kitchen}, bar_status = ${bar}
    where id = ${orderId} and source = 'web' and kitchen_status = 'na' and bar_status = 'na' and status <> 'no'
  `;
}

/** Void an order. Waiters can only void what no station has started marking ready. */
export async function voidOrder(orderId: string) {
  const role = assertRole("mesero", "barra");
  if (!UUID.test(orderId)) throw new Error("pedido");
  const sql = await getSql();
  const rows =
    role === "mesero"
      ? await sql<{ id: string }>`
          update orders set status = 'no', kitchen_status = 'na', bar_status = 'na'
          where id = ${orderId} and pay_status = 'pendiente' and kitchen_status <> 'listo' and bar_status <> 'listo'
          returning id`
      : await sql<{ id: string }>`
          update orders set status = 'no', kitchen_status = 'na', bar_status = 'na'
          where id = ${orderId} and pay_status = 'pendiente'
          returning id`;
  if (!rows.length) throw new Error("anular");
}
