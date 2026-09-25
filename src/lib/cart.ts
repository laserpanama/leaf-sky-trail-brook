export type CartKind = "plate" | "drink";

export type CartLine = {
  kind: CartKind;
  id: string;
  qty: number;
};

const KEY = "lqp-cart";
let lines: CartLine[] = [];

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("lqp-cart"));
}

function save() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  emit();
}

export function cartLines(): CartLine[] {
  return lines.map((line) => ({ ...line }));
}

export function cartCount() {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Load after mount so the first paint matches the server. */
export function hydrateCart() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    lines = Array.isArray(parsed)
      ? parsed.filter(
          (line) =>
            !!line &&
            (line.kind === "plate" || line.kind === "drink") &&
            typeof line.id === "string" &&
            line.id.length > 0 &&
            line.id.length <= 40 &&
            Number.isInteger(line.qty) &&
            line.qty > 0 &&
            line.qty <= 20,
        )
      : [];
  } catch {
    lines = [];
  }
  emit();
}

export function addToCart(kind: CartKind, id: string) {
  const found = lines.find((line) => line.kind === kind && line.id === id);
  if (found) {
    lines = lines.map((line) =>
      line.kind === kind && line.id === id ? { ...line, qty: Math.min(20, line.qty + 1) } : line,
    );
  } else {
    lines = [...lines, { kind, id, qty: 1 }];
  }
  save();
}

export function setCartQty(kind: CartKind, id: string, qty: number) {
  const next = Math.round(qty);
  if (next <= 0) lines = lines.filter((line) => !(line.kind === kind && line.id === id));
  else {
    lines = lines.map((line) =>
      line.kind === kind && line.id === id ? { ...line, qty: Math.min(20, next) } : line,
    );
  }
  save();
}

export function clearCart() {
  lines = [];
  save();
}
