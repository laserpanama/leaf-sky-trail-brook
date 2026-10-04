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

export const DRINK_SECTIONS: DrinkSection[] = [
  "casa",
  "clasico",
  "cerveza",
  "vino",
  "destilados",
  "cero",
  "cafe",
];

export const sectionLabel: Record<DrinkSection, { es: string; en: string }> = {
  casa: { es: "De la casa", en: "Signature" },
  clasico: { es: "Clásico", en: "Classic" },
  cerveza: { es: "Cerveza", en: "Beer" },
  vino: { es: "Vino", en: "Wine" },
  destilados: { es: "Destilados", en: "Spirits" },
  cero: { es: "Sin alcohol", en: "Zero-proof" },
  cafe: { es: "Café", en: "Coffee" },
};

const CATALOG: Omit<Drink, "available">[] = [
  { id: "canal-mule", es: "Canal Mule", en: "Canal Mule", section: "casa", price: 7, cost: 0, status: "OK", img: "/img/cocteles/canal-mule.svg" },
  { id: "oaxaca-paloma", es: "Oaxaca Paloma", en: "Oaxaca Paloma", section: "casa", price: 8, cost: 0, status: "OK", img: "/img/cocteles/oaxaca-paloma.svg" },
  { id: "havana-maracuya", es: "Havana Maracuyá", en: "Havana Maracuyá", section: "casa", price: 8, cost: 0, status: "OK", img: "/img/cocteles/havana-maracuya.svg" },
  { id: "lima-chilcano", es: "Lima Chilcano", en: "Lima Chilcano", section: "casa", price: 8, cost: 0, status: "OK", img: "/img/cocteles/lima-chilcano.svg" },
  { id: "lisboa-spritz", es: "Lisboa Spritz", en: "Lisboa Spritz", section: "casa", price: 8, cost: 0, status: "OK", img: "/img/cocteles/lisboa-spritz.svg" },
  { id: "bangkok-smash", es: "Bangkok Smash", en: "Bangkok Smash", section: "casa", price: 8, cost: 0, status: "OK", img: "/img/cocteles/bangkok-smash.svg" },
  { id: "kyoto-highball", es: "Kyoto Highball", en: "Kyoto Highball", section: "casa", price: 9, cost: 0, status: "OK", img: "/img/cocteles/kyoto-highball.svg" },
  { id: "milano-sbagliato", es: "Milano Sbagliato", en: "Milano Sbagliato", section: "casa", price: 9, cost: 0, status: "OK", img: "/img/cocteles/milano-sbagliato.svg" },
  { id: "margarita-limon", es: "Margarita de limón", en: "Lime margarita", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/margarita-de-limon.svg" },
  { id: "margarita-maracuya", es: "Margarita de maracuyá", en: "Passion fruit margarita", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/margarita-de-maracuya.svg" },
  { id: "margarita-jamaica", es: "Margarita de flor de Jamaica", en: "Hibiscus margarita", section: "clasico", price: 9, cost: 0, status: "OK", img: "/img/cocteles/margarita-de-flor-de-jamaica.svg" },
  { id: "mojito-limon", es: "Mojito de limón", en: "Lime mojito", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/mojito-de-limon.svg" },
  { id: "mojito-maracuya", es: "Mojito de maracuyá", en: "Passion fruit mojito", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/mojito-de-maracuya.svg" },
  { id: "whisky-sour", es: "Whisky Sour", en: "Whisky Sour", section: "clasico", price: 9, cost: 0, status: "OK", img: "/img/cocteles/whisky-sour.svg" },
  { id: "sour-apple", es: "Sour Apple Martini", en: "Sour Apple Martini", section: "clasico", price: 8, cost: 0, status: "OK", img: "/img/cocteles/sour-apple-martini.svg" },
  { id: "cosmopolitan", es: "Cosmopolitan", en: "Cosmopolitan", section: "clasico", price: 8, cost: 0, status: "OK", img: "/img/cocteles/cosmopolitan.svg" },
  { id: "caipirinha", es: "Caipirinha", en: "Caipirinha", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/caipirinha.svg" },
  { id: "caipiroska", es: "Caipiroska", en: "Caipiroska", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/caipiroska.svg" },
  { id: "daiquiri", es: "Daiquirí", en: "Daiquiri", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/daiquiri.svg" },
  { id: "aperol", es: "Aperol Spritz", en: "Aperol Spritz", section: "clasico", price: 8, cost: 0, status: "OK", img: "/img/cocteles/aperol-spritz.svg" },
  { id: "cuba-libre", es: "Cuba Libre", en: "Cuba Libre", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/cuba-libre.svg" },
  { id: "old-fashioned", es: "Old Fashioned", en: "Old Fashioned", section: "clasico", price: 9, cost: 0, status: "OK", img: "/img/cocteles/old-fashioned.svg" },
  { id: "gin-tonic", es: "Gin Tonic", en: "Gin & Tonic", section: "clasico", price: 7, cost: 0, status: "OK", img: "/img/cocteles/gin-tonic.svg" },
  { id: "michelada", es: "Michelada", en: "Michelada", section: "clasico", price: 6, cost: 0, status: "OK", img: "/img/cocteles/michelada.svg" },
  { id: "cerveza-nacional", es: "Cerveza nacional", en: "Local lager", section: "cerveza", price: 3, cost: 0, status: "OK", img: null },
  { id: "cerveza-importada", es: "Cerveza importada", en: "Imported lager", section: "cerveza", price: 4.5, cost: 0, status: "OK", img: null },
  { id: "artesanal", es: "Artesanal panameña, rotativa", en: "Panamanian craft, rotating", section: "cerveza", price: 6, cost: 0, status: "OK", img: null },
  { id: "cubeta", es: "Cubeta · 5 nacionales", en: "Bucket · 5 local lagers", section: "cerveza", price: 13, cost: 0, status: "OK", img: null },
  { id: "michelada-extra", es: "Michelada (extra +2)", en: "Michelada upgrade (+2)", section: "cerveza", price: 2, cost: 0, status: "OK", img: null },
  { id: "malbec-copa", es: "Malbec (copa)", en: "Malbec (glass)", section: "vino", price: 7, cost: 0, status: "OK", img: null },
  { id: "malbec-botella", es: "Malbec (botella)", en: "Malbec (bottle)", section: "vino", price: 28, cost: 0, status: "OK", img: null },
  { id: "tempranillo-copa", es: "Tempranillo (copa)", en: "Tempranillo (glass)", section: "vino", price: 7, cost: 0, status: "OK", img: null },
  { id: "tempranillo-botella", es: "Tempranillo (botella)", en: "Tempranillo (bottle)", section: "vino", price: 28, cost: 0, status: "OK", img: null },
  { id: "sauvignon-copa", es: "Sauvignon Blanc (copa)", en: "Sauvignon Blanc (glass)", section: "vino", price: 6, cost: 0, status: "OK", img: null },
  { id: "sauvignon-botella", es: "Sauvignon Blanc (botella)", en: "Sauvignon Blanc (bottle)", section: "vino", price: 26, cost: 0, status: "OK", img: null },
  { id: "rosado-copa", es: "Rosado (copa)", en: "Rosé (glass)", section: "vino", price: 7, cost: 0, status: "OK", img: null },
  { id: "rosado-botella", es: "Rosado (botella)", en: "Rosé (bottle)", section: "vino", price: 28, cost: 0, status: "OK", img: null },
  { id: "prosecco-copa", es: "Prosecco (copa)", en: "Prosecco (glass)", section: "vino", price: 7, cost: 0, status: "OK", img: null },
  { id: "prosecco-botella", es: "Prosecco (botella)", en: "Prosecco (bottle)", section: "vino", price: 30, cost: 0, status: "OK", img: null },
  { id: "sangria", es: "Sangría tinta (copa)", en: "Red sangría (glass)", section: "vino", price: 7, cost: 0, status: "OK", img: null },
  { id: "ron-anejo", es: "Ron añejo panameño", en: "Panamanian aged rum", section: "destilados", price: 6, cost: 0, status: "OK", img: null },
  { id: "seco", es: "Seco Herrerano", en: "Seco Herrerano", section: "destilados", price: 4, cost: 0, status: "OK", img: null },
  { id: "vodka", es: "Vodka", en: "Vodka", section: "destilados", price: 5, cost: 0, status: "OK", img: null },
  { id: "ginebra", es: "Ginebra", en: "Gin", section: "destilados", price: 6, cost: 0, status: "OK", img: null },
  { id: "tequila", es: "Tequila blanco", en: "Tequila blanco", section: "destilados", price: 6, cost: 0, status: "OK", img: null },
  { id: "pisco", es: "Pisco", en: "Pisco", section: "destilados", price: 6, cost: 0, status: "OK", img: null },
  { id: "whisky", es: "Whisky", en: "Whisky", section: "destilados", price: 7, cost: 0, status: "OK", img: null },
  { id: "mezcal", es: "Mezcal", en: "Mezcal", section: "destilados", price: 8, cost: 0, status: "OK", img: null },
  { id: "saril", es: "Saril Cooler", en: "Saril Cooler", section: "cero", price: 4, cost: 0, status: "OK", img: "/img/cocteles/saril-cooler.svg" },
  { id: "tonica-maracuya", es: "Tónica de Maracuyá", en: "Maracuyá Tonic", section: "cero", price: 4, cost: 0, status: "OK", img: "/img/cocteles/tonica-de-maracuya.svg" },
  { id: "limonada", es: "Limonada de Hierba de Limón", en: "Lemongrass Lemonade", section: "cero", price: 4, cost: 0, status: "OK", img: "/img/cocteles/limonada-de-hierba-de-limon.svg" },
  { id: "chicha", es: "Chicha de piña (vaso)", en: "Pineapple chicha (glass)", section: "cero", price: 3, cost: 0, status: "OK", img: null },
  { id: "sodas", es: "Sodas y agua con gas", en: "Sodas & sparkling water", section: "cero", price: 2.5, cost: 0, status: "OK", img: null },
  { id: "espresso", es: "Espresso de Boquete", en: "Boquete espresso", section: "cafe", price: 2.5, cost: 0, status: "OK", img: null },
  { id: "carajillo", es: "Carajillo", en: "Carajillo", section: "cafe", price: 7, cost: 0, status: "OK", img: null },
];

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