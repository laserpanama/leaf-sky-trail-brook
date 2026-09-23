export type HoldStatus = "pendiente" | "confirmada" | "no";

export type Hold = {
  id: string;
  date: string;
  time: string;
  party: string;
  notes: string;
  status: HoldStatus;
  createdAt: string;
};

const KEY = "lqp-holds";

export function readHolds(): Hold[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Hold[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(holds: Hold[]) {
  window.localStorage.setItem(KEY, JSON.stringify(holds));
}

export function addHold(input: Omit<Hold, "id" | "status" | "createdAt">): Hold {
  const hold: Hold = {
    ...input,
    id: crypto.randomUUID(),
    status: "pendiente",
    createdAt: new Date().toISOString(),
  };
  write([hold, ...readHolds()]);
  return hold;
}

export function setHoldStatus(id: string, status: HoldStatus) {
  write(readHolds().map((hold) => (hold.id === id ? { ...hold, status } : hold)));
}
