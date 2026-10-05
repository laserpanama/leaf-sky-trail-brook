import { venue } from "@/venue";

export type DrinkSection = "casa" | "clasico" | "cerveza" | "vino" | "destilados" | "cero" | "cafe";

export type DrinkStatus = "OK" | "Reajustar" | "Margen alto";

export type Drink = {
  id: string;
  es: string;
  en: string;
  section: DrinkSection;
  price: number;
  cost: number;
  status: DrinkStatus;
  img: string | null;
  available: boolean;
  /** Optional tasting note under the name (style, ABV, IBU…). */
  note?: { es: string; en: string };
  /** Optional structured beer facts, shown by the "label" layout. */
  style?: { es: string; en: string };
  abv?: number;
  ibu?: number | null;
};

export const DRINK_TARGET: Record<DrinkSection, number> = {
  casa: 0.2,
  clasico: 0.2,
  cerveza: 0.3,
  vino: 0.3,
  destilados: 0.18,
  cero: 0.15,
  cafe: 0.15,
};

export function drinkItbms(section: DrinkSection, id?: string) {
  if (section === "cero") return 0.07;
  if (section === "cafe" && id !== "carajillo") return 0.07;
  return 0.1;
}

export function drinkStatus(section: DrinkSection, cost: number, price: number, id?: string): DrinkStatus {
  const net = price / (1 + drinkItbms(section, id));
  const pct = net > 0 ? cost / net : 0;
  const target = DRINK_TARGET[section];
  if (pct > target + 0.03) return "Reajustar";
  if (pct < target - 0.08) return "Margen alto";
  return "OK";
}

export const DRINK_SECTIONS: DrinkSection[] = venue.menu.drinkSections;

const BASE_LABEL: Record<DrinkSection, { es: string; en: string }> = {
  casa: { es: "De la casa", en: "Signature" },
  clasico: { es: "Clásico", en: "Classic" },
  cerveza: { es: "Cerveza", en: "Beer" },
  vino: { es: "Vino", en: "Wine" },
  destilados: { es: "Destilados", en: "Spirits" },
  cero: { es: "Sin alcohol", en: "Zero-proof" },
  cafe: { es: "Café", en: "Coffee" },
};

export const sectionLabel: Record<DrinkSection, { es: string; en: string }> = { ...BASE_LABEL, ...venue.menu.drinkLabels };

const CATALOG: Omit<Drink, "available">[] = venue.menu.drinks;

type Override = { price?: number; available?: boolean };

let memory: Record<string, Override> = {};

function readOverrides(): Record<string, Override> {
  return memory;
}

export function replaceDrinkOverrides(next: Record<string, Override>) {
  memory = next ?? {};
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-drinks"));
}

export function money(price: number) {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}

export function listDrinks(): Drink[] {
  const overrides = readOverrides();
  return CATALOG.map((drink) => {
    const patch = overrides[drink.id];
    const price = typeof patch?.price === "number" && patch.price >= 0 ? patch.price : drink.price;
    const cost = drink.cost;
    return {
      ...drink,
      price,
      cost,
      status: cost > 0 ? drinkStatus(drink.section, cost, price, drink.id) : drink.status,
      available: patch?.available !== false,
    };
  });
}

function write(overrides: Record<string, Override>) {
  memory = overrides;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-drinks"));
}

export function setDrink(id: string, patch: Override) {
  const overrides = readOverrides();
  const base = CATALOG.find((drink) => drink.id === id);
  const next = { ...overrides[id], ...patch };
  if (base && next.price === base.price) delete next.price;
  if (next.available !== false) delete next.available;
  if (next.price === undefined && next.available === undefined) delete overrides[id];
  else overrides[id] = next;
  write(overrides);
  if (typeof window === "undefined") return;
  void import("@/lib/casa").then(({ saveMenu }) =>
    saveMenu({
      data: {
        kind: "drink",
        id,
        price: next.price ?? null,
        available: next.available !== false,
      },
    }),
  );
}

export function resetDrinks() {
  memory = {};
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-drinks"));
}