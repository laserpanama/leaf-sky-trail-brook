import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale/es";
import { drinkItbms, listDrinks, type Drink, type DrinkSection } from "@/lib/drinks";

/** Alcohol 10%. Zero-proof and coffee 7%, except the carajillo. Confirm with the accountant. */
export const ITBMS = 0.1;

export const TARGET: Record<DrinkSection, number> = {
  casa: 0.2,
  clasico: 0.2,
  cerveza: 0.3,
  vino: 0.3,
  destilados: 0.18,
  cero: 0.15,
  cafe: 0.15,
};

export function netOf(price: number, section: DrinkSection = "casa", id?: string) {
  return price / (1 + drinkItbms(section, id));
}

export function pourPct(cost: number, price: number, section: DrinkSection = "casa", id?: string) {
  const net = netOf(price, section, id);
  return net > 0 ? cost / net : 0;
}

export function panamaMonday(from = new Date()) {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(from);
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dow = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  return date.toISOString().slice(0, 10);
}

export function shiftWeek(monday: string, weeks: number) {
  return addDays(parseISO(monday), weeks * 7).toISOString().slice(0, 10);
}

export function weekLabel(monday: string) {
  const start = parseISO(monday);
  const end = addDays(start, 6);
  return `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`;
}

type Book = Record<string, Record<string, number>>;

let book: Book = {};

function readBook(): Book {
  return book;
}

export function replacePour(next: Book | null | undefined) {
  book = next && typeof next === "object" ? { ...next } : {};
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-pour"));
}

export function unitsFor(week: string) {
  return readBook()[week] ?? {};
}

export function setUnits(week: string, id: string, units: number) {
  const next = readBook();
  const row = { ...(next[week] ?? {}) };
  if (units > 0) row[id] = Math.round(units);
  else delete row[id];
  if (Object.keys(row).length === 0) delete next[week];
  else next[week] = row;
  book = next;
  if (typeof window === "undefined") return;
  void import("@/lib/casa").then(({ saveOps }) =>
    saveOps({ data: { key: "pour", doc: book } }).catch(() => undefined),
  );
}

export function savedWeeks() {
  return Object.keys(readBook()).sort();
}

export type PourLine = {
  drink: Drink;
  units: number;
  net: number;
  cost: number;
  margin: number;
  pct: number;
};

export function weekLines(units: Record<string, number>, drinks = listDrinks()): PourLine[] {
  return drinks
    .map((drink) => {
      const count = units[drink.id] ?? 0;
      const net = count * netOf(drink.price, drink.section, drink.id);
      const cost = count * drink.cost;
      return {
        drink,
        units: count,
        net,
        cost,
        margin: net - cost,
        pct: pourPct(drink.cost, drink.price, drink.section, drink.id),
      };
    })
    .filter((line) => line.units > 0);
}

export function sumLines(lines: PourLine[]) {
  const net = lines.reduce((sum, line) => sum + line.net, 0);
  const cost = lines.reduce((sum, line) => sum + line.cost, 0);
  return { net, cost, margin: net - cost, pct: net > 0 ? cost / net : 0, units: lines.reduce((s, l) => s + l.units, 0) };
}

export function sectionRollup(lines: PourLine[]) {
  const groups = new Map<DrinkSection, PourLine[]>();
  for (const line of lines) {
    const list = groups.get(line.drink.section) ?? [];
    list.push(line);
    groups.set(line.drink.section, list);
  }
  return [...groups.entries()].map(([section, group]) => ({
    section,
    ...sumLines(group),
    target: TARGET[section],
  }));
}

export function topCocktails(lines: PourLine[]) {
  return lines
    .filter((line) => line.drink.section === "casa" || line.drink.section === "clasico")
    .sort((a, b) => b.units - a.units || b.margin - a.margin);
}
