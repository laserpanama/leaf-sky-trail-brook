type LaborBook = { wage: number; minutes: Record<string, number> };

const empty: LaborBook = { wage: 0, minutes: {} };
let book: LaborBook = empty;

function read(): LaborBook {
  return book;
}

function write(next: LaborBook) {
  book = next;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("lqp-labor"));
  void import("@/lib/casa").then(({ saveOps }) =>
    saveOps({ data: { key: "labor", doc: book } }).catch(() => undefined),
  );
}

export function replaceLabor(next: LaborBook | null | undefined) {
  const wage = next && typeof next.wage === "number" && next.wage > 0 ? next.wage : 0;
  const minutes = next?.minutes && typeof next.minutes === "object" ? { ...next.minutes } : {};
  book = { wage, minutes };
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-labor"));
}

export function kitchenWage() {
  return read().wage;
}

export function plateMinutes(id: string) {
  const minutes = read().minutes[id];
  return typeof minutes === "number" && minutes > 0 ? minutes : 0;
}

export function setKitchenWage(wage: number) {
  const book = read();
  book.wage = wage > 0 ? wage : 0;
  write(book);
}

export function setPlateMinutes(id: string, minutes: number) {
  const book = read();
  if (minutes > 0) book.minutes[id] = Math.round(minutes);
  else delete book.minutes[id];
  write(book);
}

/** Direct kitchen time only. The food sheet does not include this. */
export function laborCost(minutes: number, wage: number) {
  if (minutes <= 0 || wage <= 0) return 0;
  return (minutes / 60) * wage;
}
