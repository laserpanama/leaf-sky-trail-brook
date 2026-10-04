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

export const PLATE_SECTIONS: PlateSection[] = [
  "tapitas",
  "entradas",
  "mains",
  "kids",
  "sides",
  "empacados",
];

export const plateLabel: Record<PlateSection, { es: string; en: string }> = {
  tapitas: { es: "Tapitas", en: "Tapas" },
  entradas: { es: "Entradas", en: "Starters" },
  mains: { es: "Carnes, aves y pescados", en: "Mains" },
  kids: { es: "Menú kids", en: "Kids" },
  sides: { es: "Acompañamientos", en: "Sides" },
  empacados: { es: "Empacados al vacío (para llevar)", en: "Vacuum-packed to go" },
};

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

const CATALOG: Omit<Plate, "available">[] = [
  // ── Tapitas ─────────────────────────────────────────────────
  { id: "spicy-pork-belly-bites", es: "Spicy pork belly bites", en: "Spicy pork belly bites", section: "tapitas", price: 6, cost: 0, portionEs: "Daditos de panza de cerdo ahumados, servidos con salsa picante de BBQ y ajonjolí.", portionEn: "Smoked pork belly bites, served with spicy BBQ sauce and sesame.", img: null },

  // ── Entradas ────────────────────────────────────────────────
  { id: "chicharrones", es: "Chicharroncitos del Burro", en: "Burro pork cracklings", section: "entradas", price: 14, cost: 0, portionEs: "Panza de puerco sazonada con toque especial de la casa.", portionEn: "Pork belly seasoned with the house special touch.", img: "/media/belly.webp" },
  { id: "sliders", es: "Mini Sliders Angus Burgers", en: "Angus burger sliders", section: "entradas", price: 12, cost: 0, portionEs: "3 unid. Carne Angus, cebolla caramelizada, pepinillos y salsa de la casa en pan brioche.", portionEn: "3 pc. Angus beef, caramelized onion, pickles and house sauce on brioche.", img: "/media/sliders.webp" },
  { id: "nachos-carne", es: "Nachos de carne o pollo", en: "Beef or chicken nachos", section: "entradas", price: 15, cost: 0, portionEs: "Totopos, pico de gallo, guacamole, quesos y crema.", portionEn: "Tortilla chips, pico de gallo, guacamole, cheeses and cream.", img: "/media/nachos-carne.webp" },
  { id: "chorizo-parrillero", es: "Chorizo parrillero", en: "Grilling chorizo", section: "entradas", price: 10, cost: 0, portionEs: "Servido con cebolla caramelizada y chimichurri.", portionEn: "Served with caramelized onion and chimichurri.", img: null },
  { id: "aranitas", es: "Arañitas", en: "Plantain arañitas", section: "entradas", price: 11, cost: 0, portionEs: "Apanadas, con tártara casera.", portionEn: "Breaded, with house tartar.", img: "/media/aranitas.webp" },
  { id: "poppers", es: "Jalapeño Poppers", en: "Jalapeño poppers", section: "entradas", price: 8, cost: 0, portionEs: "Jalapeño y queso apanados.", portionEn: "Breaded jalapeño and cheese.", img: "/media/poppers.webp" },
  { id: "empanadas", es: "Empanadas de maíz", en: "Corn empanadas", section: "entradas", price: 7.5, cost: 0, portionEs: "Rellenas de carne mechada. Incluye 4 unid.", portionEn: "Stuffed with shredded beef. Includes 4 pc.", img: "/media/empanadas.webp" },
  { id: "wings", es: "Buffalo Wings", en: "Buffalo wings", section: "entradas", price: 9.5, cost: 0, portionEs: "Alitas apanadas con salsa búfalo aparte.", portionEn: "Breaded wings with buffalo sauce on the side.", img: "/media/wings.webp" },
  { id: "alitas-jerk", es: "Alitas estilo jerk jamaiquino", en: "Jamaican jerk wings", section: "entradas", price: 10.5, cost: 0, portionEs: "Alitas ahumadas, bien especiadas, con un toque picante.", portionEn: "Smoked, well-spiced wings with a spicy kick.", img: null },
  { id: "coctel-camarones", es: "Cóctel de camarones", en: "Shrimp cocktail", section: "entradas", price: 8.5, cost: 0, portionEs: "Salsa de chili coreano y katsuobushi (bonito ahumado y curado).", portionEn: "Korean chili sauce and katsuobushi (smoked cured bonito).", img: null },
  { id: "ceviche", es: "Ceviche de langostino", en: "Prawn ceviche", section: "entradas", price: 10, cost: 0, portionEs: "Un clásico panameño, con chips de plátano.", portionEn: "A Panamanian classic, with plantain chips.", img: "/media/ceviche.webp" },
  { id: "boneless", es: "Boneless de pollo", en: "Chicken boneless", section: "entradas", price: 11, cost: 0, portionEs: "Apanados, con salsa BBQ.", portionEn: "Breaded, with BBQ sauce.", img: "/media/boneless.webp" },

  // ── Carnes / Aves / Pescados ────────────────────────────────
  { id: "pollo", es: "Pollo al carbón", en: "Charcoal chicken", section: "mains", price: 13, cost: 0, portionEs: "Media porción de pollo, más 1 acompañamiento.", portionEn: "Half chicken, plus 1 side.", img: "/media/pollo.webp" },
  { id: "burger", es: "Hamburguesa clásica steakhouse", en: "Classic steakhouse burger", section: "mains", price: 15, cost: 0, portionEs: "Carne Angus, cebolla caramelizada, bacon, lechuga, tomate, salsa steakhouse y pan brioche.", portionEn: "Angus beef, caramelized onion, bacon, lettuce, tomato, steakhouse sauce and brioche.", img: "/media/burger.webp" },
  { id: "picada", es: "Picada argentina", en: "Argentine grill platter", section: "mains", price: 35, cost: 0, portionEs: "N.Y., chorizo, pollo a la brasa y 1 acompañamiento (2 a 3 personas).", portionEn: "N.Y., chorizo, charcoal chicken and 1 side (serves 2–3).", img: "/media/parrillada.webp" },
  { id: "ribeye", es: "Rib-eye al carbón (nacional, libre de hormonas)", en: "Charcoal rib eye (hormone-free, national)", section: "mains", price: 25, cost: 0, portionEs: "Incluye 1 acompañamiento y chimichurri.", portionEn: "Includes 1 side and chimichurri.", img: "/media/ribeye.webp" },
  { id: "ribeye-angus", es: "Rib-eye al carbón (Angus importado)", en: "Charcoal rib eye (imported Angus)", section: "mains", price: 35, cost: 0, portionEs: "Incluye 1 acompañamiento y chimichurri.", portionEn: "Includes 1 side and chimichurri.", img: null },
  { id: "filete-albahaca", es: "Filete en salsa de albahaca y hongos (8 oz)", en: "Filet in herb mushroom sauce (8 oz)", section: "mains", price: 15, cost: 0, portionEs: "Cremosa salsa de hongos con albahaca y vino tinto. Incluye 1 acompañamiento.", portionEn: "Creamy mushroom sauce with basil and red wine. Includes 1 side.", img: null },
  { id: "ny-strip", es: "N.Y. strip al carbón (USDA Choice importado)", en: "Charcoal N.Y. strip (imported USDA Choice)", section: "mains", price: 28, cost: 0, portionEs: "Incluye 1 acompañamiento y chimichurri.", portionEn: "Includes 1 side and chimichurri.", img: null },
  { id: "pulpo-caribe", es: "Pulpo caribe", en: "Caribbean octopus", section: "mains", price: 18, cost: 0, portionEs: "En leche de coco y curry, con patacones.", portionEn: "In coconut milk and curry, with patacones.", img: null },
  { id: "salmon", es: "Salmón a la parrilla", en: "Grilled salmon", section: "mains", price: 17, cost: 0, portionEs: "Incluye 1 acompañamiento.", portionEn: "Includes 1 side.", img: "/media/salmon.webp" },

  // ── Menú kids ───────────────────────────────────────────────
  { id: "kids-burger", es: "Mini hamburguesa Quinta Pata", en: "Quinta Pata mini burger", section: "kids", price: 6, cost: 0, portionEs: "1 unid. Incluye 1 acompañamiento.", portionEn: "1 pc. Includes 1 side.", img: "/media/kids-burger.webp" },
  { id: "kids-boneless", es: "Boneless de pollo (kids)", en: "Kids boneless", section: "kids", price: 6, cost: 0, portionEs: "Incluye 1 acompañamiento.", portionEn: "Includes 1 side.", img: "/media/kids-boneless.webp" },

  // ── Acompañamientos ─────────────────────────────────────────
  { id: "papas", es: "Papitas fritas", en: "French fries", section: "sides", price: 3.5, cost: 0, portionEs: "6 oz.", portionEn: "6 oz.", img: "/media/papas.webp" },
  { id: "patacon", es: "Patacón pisao", en: "Patacones", section: "sides", price: 3.5, cost: 0, portionEs: "Plátano y medio, cerca de seis patacones.", portionEn: "One and a half plantains, about six pieces.", img: "/media/patacon.webp" },
  { id: "yuca", es: "Yuca frita", en: "Fried cassava", section: "sides", price: 3.5, cost: 0, portionEs: "6 oz servidos.", portionEn: "6 oz served.", img: "/media/yuca.webp" },
  { id: "guacamole", es: "Guacamole", en: "Guacamole", section: "sides", price: 3.5, cost: 0, portionEs: "6 oz.", portionEn: "6 oz.", img: null },
  { id: "vegetales", es: "Vegetales al grill en mantequilla negra", en: "Grilled vegetables in black butter", section: "sides", price: 4.5, cost: 0, portionEs: "6 oz.", portionEn: "6 oz.", img: "/media/vegetales.webp" },
  { id: "totopos", es: "Totopos", en: "Tortilla chips", section: "sides", price: 3.5, cost: 0, portionEs: "Cinco tortillas.", portionEn: "Five tortillas.", img: "/media/totopos.webp" },

  // ── Empacados al vacío (para llevar) ─────────────────────────
  { id: "costillas-bbq-kc", es: "Costillas BBQ estilo Kansas City", en: "Kansas City BBQ ribs", section: "empacados", price: 8, cost: 0, portionEs: "15 horas de cocción, ahumadas en nance.", portionEn: "15-hour cook, smoked over nance wood.", img: null },
  { id: "alitas-jerk-vacio", es: "Alitas estilo jerk jamaiquino", en: "Jamaican jerk wings", section: "empacados", price: 10.5, cost: 0, portionEs: "Alitas ahumadas, bien especiadas, con un toque picante.", portionEn: "Smoked, well-spiced wings with a spicy kick.", img: null },
  { id: "pulpo-caribe-vacio", es: "Pulpo caribe", en: "Caribbean octopus", section: "empacados", price: 17, cost: 0, portionEs: "En leche de coco y curry.", portionEn: "In coconut milk and curry.", img: null },
  { id: "filete-albahaca-vacio", es: "Filete en salsa de albahaca y hongos (8 oz)", en: "Filet in herb mushroom sauce (8 oz)", section: "empacados", price: 14, cost: 0, portionEs: "Cremosa salsa de hongos con albahaca y vino tinto.", portionEn: "Creamy mushroom sauce with basil and red wine.", img: null },
  { id: "vegetales-grill-vacio", es: "Vegetales al grill en mantequilla negra", en: "Grilled vegetables in black butter", section: "empacados", price: 4.5, cost: 0, portionEs: "6 oz.", portionEn: "6 oz.", img: "/media/vegetales.webp" },
];

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