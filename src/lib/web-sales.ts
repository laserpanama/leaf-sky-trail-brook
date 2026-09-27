import type { WebTally, WebWeek } from "@/lib/casa-ops.server";

export type { WebTally, WebWeek };

/** Paid web orders per Panama week, read-only. Loaded from the house; never saved from here. */
let weeks: Record<string, WebWeek> = {};
const loaded = new Set<string>();

function announce() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-web"));
}

export function replaceWebSales(next: Record<string, WebWeek> | null | undefined, covered: string[] = []) {
  weeks = next && typeof next === "object" ? { ...next } : {};
  loaded.clear();
  for (const week of covered) loaded.add(week);
  announce();
}

export function webDrinks(week: string): WebTally {
  return weeks[week]?.drinks ?? {};
}

export function webPlates(week: string): WebTally {
  return weeks[week]?.plates ?? {};
}

export function webWeeks(kind: "drinks" | "plates") {
  return Object.keys(weeks)
    .filter((week) => Object.keys(weeks[week][kind]).length > 0)
    .sort();
}

/** Fetch one week on demand (older weeks outside the first load). */
export async function ensureWebWeek(week: string) {
  if (loaded.has(week) || typeof window === "undefined") return;
  loaded.add(week);
  try {
    const { webSales } = await import("@/lib/casa");
    const next = await webSales({ data: { from: week, to: week } });
    weeks = { ...weeks, ...next };
    announce();
  } catch {
    loaded.delete(week);
  }
}
