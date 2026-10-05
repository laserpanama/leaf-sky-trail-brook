import { venue } from "@/venue";

export type PlateSection =
  | "tapitas"
  | "entradas"
  | "mains"
  | "kids"
  | "sides"
  | "empacados";

export type Plate = {
  id: string;
  es: string;
  en: string;
  section: PlateSection;
  price: number;
  cost: number;
  portionEs: string;
  portionEn: string;
  img: string | null;
  available: boolean;
};

export const PLATE_SECTIONS: PlateSection[] = venue.menu.plateSections;

const BASE_LABEL: Record<PlateSection, { es: string; en: string }> = {
  tapitas: { es: "Tapitas", en: "Tapas" },
  entradas: { es: "Entradas", en: "Starters" },
  mains: { es: "Carnes, aves y pescados", en: "Mains" },
  kids: { es: "Menú kids", en: "Kids" },
  sides: { es: "Acompañamientos", en: "Sides" },
  empacados: { es: "Empacados al vacío (para llevar)", en: "Vacuum-packed to go" },
};

export const plateLabel: Record<PlateSection, { es: string; en: string }> = { ...BASE_LABEL, ...venue.menu.plateLabels };

/** Workbook assumption for restaurant food. Confirm with the accountant. */
export const FOOD_ITBMS = 0.07;

export const FOOD_TARGET: Record<PlateSection, number> = {
  tapitas: 0.28,
  entradas: 0.28,
  mains: 0.35,
  kids: 0.35,
  sides: 0.25,
  empacados: 0.25,
};

const CATALOG: Omit<Plate, "available">[] = venue.menu.plates;

type Override = { price?: number; available?: boolean };

let memory: Record<string, Override> = {};

function readOverrides(): Record<string, Override> {
  return memory;
}

export function replacePlateOverrides(next: Record<string, Override>) {
  memory = next ?? {};
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-plates"));
}

export function listPlates(): Plate[] {
  const overrides = readOverrides();
  return CATALOG.map((plate) => {
    const patch = overrides[plate.id];
    return {
      ...plate,
      price: typeof patch?.price === "number" && patch.price >= 0 ? patch.price : plate.price,
      available: patch?.available !== false,
    };
  });
}

function writeOverrides(overrides: Record<string, Override>) {
  memory = overrides;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-plates"));
}

export function setPlate(id: string, patch: Override) {
  const overrides = readOverrides();
  const base = CATALOG.find((plate) => plate.id === id);
  const next = { ...overrides[id], ...patch };
  if (base && next.price === base.price) delete next.price;
  if (next.available !== false) delete next.available;
  if (next.price === undefined && next.available === undefined) delete overrides[id];
  else overrides[id] = next;
  writeOverrides(overrides);
  if (typeof window === "undefined") return;
  void import("@/lib/casa").then(({ saveMenu }) =>
    saveMenu({
      data: {
        kind: "plate",
        id,
        price: next.price ?? null,
        available: next.available !== false,
      },
    }),
  );
}

export function resetPlates() {
  memory = {};
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-plates"));
}

export function foodNet(price: number) {
  return price / (1 + FOOD_ITBMS);
}

export function foodPct(cost: number, price: number) {
  const net = foodNet(price);
  return net > 0 ? cost / net : 0;
}

export function foodStatus(pct: number, target: number) {
  if (pct > target + 0.03) return "Reajustar";
  if (pct < target - 0.08) return "Margen alto";
  return "OK";
}

export function targetMenu(cost: number, target: number) {
  const raw = (cost / target) * (1 + FOOD_ITBMS);
  return Math.ceil(raw * 2 - 1e-9) / 2;
}

type Book = Record<string, Record<string, number>>;
let weeks: Book = {};

function readBook(): Book {
  return weeks;
}

export function replaceKitchenWeeks(next: Book | null | undefined) {
  weeks = next && typeof next === "object" ? { ...next } : {};
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-kitchen"));
}

export function plateUnits(week: string) {
  return readBook()[week] ?? {};
}

export function setPlateUnits(week: string, id: string, units: number) {
  const next = readBook();
  const row = { ...(next[week] ?? {}) };
  if (units > 0) row[id] = Math.round(units);
  else delete row[id];
  if (Object.keys(row).length === 0) delete next[week];
  else next[week] = row;
  weeks = next;
  if (typeof window === "undefined") return;
  void import("@/lib/casa").then(({ saveOps }) =>
    saveOps({ data: { key: "kitchen", doc: weeks } }).catch(() => undefined),
  );
}

export function kitchenWeeks() {
  return Object.keys(readBook()).sort();
}