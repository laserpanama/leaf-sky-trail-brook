import { book as barra } from "./barra";
import { book as cocina } from "./cocina";

export type Supply = {
  id: string;
  name: string;
  en: string;
  category: string;
  pack: string;
  units: number | null;
  unit: string;
  buy: number | null;
  yield: number | null;
  kind: "buy" | "prep" | "side";
};

export type PrepLine = { name: string; qty: number; unit: string; each: number };

export type Prep = { id: string; name: string; yield: number | null; lines: PrepLine[] };

export type SpecLine = { item: string; supply: string; qty: number };

export type Book = {
  supplies: Supply[];
  preps: Prep[];
  specs: SpecLine[];
  sides: string[];
};

export type BookId = "cocina" | "barra";

const BOOKS: Record<BookId, Book> = { cocina, barra };

const KEY = "lqp-supplies";

export type Store = {
  buy: Record<string, number>;
  yield: Record<string, number>;
  units: Record<string, number>;
  each: Record<string, number>;
  prepQty: Record<string, number>;
  specQty: Record<string, number>;
};

const empty: Store = { buy: {}, yield: {}, units: {}, each: {}, prepQty: {}, specQty: {} };

let bound: Store | null = null;

/** Run costing reads and edits against a server copy. Nothing here touches the browser. */
export function runWithStore<T>(store: Store | null, run: () => T): { result: T; store: Store } {
  bound = { ...empty, ...(store ?? {}) };
  try {
    const result = run();
    return { result, store: bound };
  } finally {
    bound = null;
  }
}

function read(): Store {
  if (bound) return bound;
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Store;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

function write(store: Store) {
  if (bound) {
    bound = store;
    return;
  }
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("lqp-supplies"));
}

function patch(group: keyof Store, key: string, value: number | null) {
  const store = read();
  const next = { ...store[group] };
  if (value === null) delete next[key];
  else next[key] = value;
  write({ ...store, [group]: next });
}

export function books() {
  return BOOKS;
}

export function supplyKey(book: BookId, id: string) {
  return `${book}:${id}`;
}

export function listSupplies(book: BookId): Supply[] {
  const store = read();
  return BOOKS[book].supplies.map((supply) => {
    const key = supplyKey(book, supply.id);
    return {
      ...supply,
      buy: store.buy[key] ?? supply.buy,
      yield: store.yield[key] ?? supply.yield,
      units: store.units[key] ?? supply.units,
    };
  });
}

export function setSupplyBuy(book: BookId, id: string, buy: number) {
  const base = BOOKS[book].supplies.find((supply) => supply.id === id);
  patch("buy", supplyKey(book, id), base && buy === base.buy ? null : buy);
}

export function setSupplyYield(book: BookId, id: string, yieldPct: number) {
  const base = BOOKS[book].supplies.find((supply) => supply.id === id);
  patch("yield", supplyKey(book, id), base && yieldPct === base.yield ? null : yieldPct);
}

export function resetSupplies() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("lqp-supplies"));
}

function prepLines(book: BookId, prep: Prep) {
  const store = read();
  return prep.lines.map((line, index) => {
    const key = `${book}:${prep.id}:${index}`;
    return {
      ...line,
      qty: store.prepQty[key] ?? line.qty,
      each: store.each[key] ?? line.each,
      key,
    };
  });
}

export function listPreps(book: BookId) {
  return BOOKS[book].preps.map((prep) => ({ ...prep, lines: prepLines(book, prep) }));
}

export function setPrepEach(book: BookId, prepId: string, index: number, each: number) {
  const prep = BOOKS[book].preps.find((item) => item.id === prepId);
  const base = prep?.lines[index]?.each;
  patch("each", `${book}:${prepId}:${index}`, base === each ? null : each);
}

export function setPrepQty(book: BookId, prepId: string, index: number, qty: number) {
  const prep = BOOKS[book].preps.find((item) => item.id === prepId);
  const base = prep?.lines[index]?.qty;
  patch("prepQty", `${book}:${prepId}:${index}`, base === qty ? null : qty);
}

function unitCost(book: BookId): Record<string, number> {
  const supplies = listSupplies(book);
  const costs: Record<string, number> = {};
  for (const supply of supplies) {
    if (supply.kind !== "buy" || supply.buy == null) continue;
    const units = supply.units || 1;
    const yieldPct = supply.yield == null || supply.yield === 0 ? 1 : supply.yield;
    costs[supply.name] = supply.buy / (units * yieldPct);
  }
  for (const prep of listPreps(book)) {
    const batch = prep.lines.reduce((sum, line) => sum + line.qty * line.each, 0);
    costs[prep.name] = prep.yield ? batch / prep.yield : 0;
  }
  return costs;
}

const FOOD_ALIAS: Record<string, string> = {
  "Mini hamburguesa Quinta Pata": "Mini hamburguesa Quinta Pata (kids)",
  "Boneless de pollo, kids": "Boneless de pollo (kids)",
  "Pasta marinera o al olio": "Pasta marinera o al olio (kids)",
};

export function itemCost(book: BookId, item: string) {
  const name = book === "cocina" ? FOOD_ALIAS[item] ?? item : item;
  const costs = unitCost(book);
  const store = read();
  const lines = BOOKS[book].specs
    .map((line, index) => ({
      ...line,
      qty: store.specQty[`${book}:${index}`] ?? line.qty,
    }))
    .filter((line) => line.item === name);
  if (!lines.length) return null;
  let total = 0;
  let sideQty = 0;
  for (const line of lines) {
    if (line.supply === "Acompañamiento incluido (promedio)") {
      sideQty += line.qty;
      continue;
    }
    total += line.qty * (costs[line.supply] ?? 0);
  }
  if (sideQty > 0) total += sideQty * sideAverage(costs);
  return total;
}

function sideAverage(costs: Record<string, number>) {
  const sides = BOOKS.cocina.sides
    .map((name) => {
      const lines = BOOKS.cocina.specs.filter((line) => line.item === name);
      return lines.reduce((sum, line) => sum + line.qty * (costs[line.supply] ?? 0), 0);
    })
    .filter((cost) => cost > 0);
  if (!sides.length) return 0;
  return sides.reduce((sum, cost) => sum + cost, 0) / sides.length;
}

export function foodCost(name: string) {
  return itemCost("cocina", name);
}

export function barCost(name: string) {
  return itemCost("barra", name);
}

export function usesOf(book: BookId, supplyName: string) {
  const names = new Set<string>();
  for (const line of BOOKS[book].specs) {
    if (line.supply === supplyName) names.add(line.item);
  }
  for (const prep of BOOKS[book].preps) {
    if (prep.lines.some((line) => line.name === supplyName) || prep.name === supplyName) {
      for (const line of BOOKS[book].specs) {
        if (line.supply === prep.name) names.add(line.item);
      }
    }
  }
  return [...names];
}
