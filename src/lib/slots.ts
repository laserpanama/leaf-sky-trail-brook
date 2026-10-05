import { venue } from "@/venue";

/** Request turns, Panama time (UTC−5, no DST). Not published opening hours. Per venue. */
export const SLOT_TIMES: readonly string[] = venue.booking.slots;

export type SlotTime = string;

/** Weekdays the venue does not take bookings (0 = Sunday). */
export const CLOSED_WEEKDAYS: readonly number[] = venue.booking.closedWeekdays;

export function isClosedDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return CLOSED_WEEKDAYS.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}

const SLOT_MS = 30 * 60 * 1000;

export function slotWindow(date: string, time: string): { start: number; end: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const start = new Date(`${date}T${time}:00-05:00`).getTime();
  if (Number.isNaN(start)) return null;
  return { start, end: start + SLOT_MS };
}

export function dayBounds(date: string): { timeMin: string; timeMax: string } {
  return {
    timeMin: `${date}T${SLOT_TIMES[0] ?? "00:00"}:00-05:00`,
    timeMax: new Date(new Date(`${date}T${SLOT_TIMES[SLOT_TIMES.length - 1] ?? "23:00"}:00-05:00`).getTime() + SLOT_MS).toISOString(),
  };
}

type Span = { start: number; end: number };

function asSpan(value: unknown): Span | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const startRaw = row.start ?? row.startTime ?? row.timeMin;
  const endRaw = row.end ?? row.endTime ?? row.timeMax;
  if (typeof startRaw !== "string" || typeof endRaw !== "string") return null;
  const start = new Date(startRaw).getTime();
  const end = new Date(endRaw).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return { start, end };
}

export function collectBusy(data: unknown): Span[] {
  const found: Span[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const span = asSpan(node);
    if (span) found.push(span);
    for (const value of Object.values(node as Record<string, unknown>)) walk(value);
  };
  walk(data);
  return found;
}

export function busySlots(date: string, data: unknown): string[] {
  const busy = collectBusy(data);
  return SLOT_TIMES.filter((time) => {
    const window = slotWindow(date, time);
    if (!window) return false;
    return busy.some((span) => span.start < window.end && span.end > window.start);
  });
}
