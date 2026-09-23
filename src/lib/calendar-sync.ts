import { createServerFn } from "@tanstack/react-start";
import { ConnectorType, GoogleCalendarTools } from "@/lib/app-data";
import { busySlots, dayBounds } from "@/lib/slots";

export type DaySync =
  | { status: "ok"; busy: string[] }
  | { status: "pending"; busy: string[] }
  | { status: "login"; busy: string[]; loginUrl?: string }
  | { status: "off"; busy: string[] };

export const syncDay = createServerFn({ method: "POST" })
  .validator((input: { date: string }) => {
    if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      throw new Error("date");
    }
    return { date: input.date };
  })
  .handler(async ({ data }): Promise<DaySync> => {
    const { callTool } = await import("@/lib/app-data/client.server");
    const range = dayBounds(data.date);
    const result = await callTool(
      GoogleCalendarTools.availability,
      {
        timeMin: range.timeMin,
        timeMax: range.timeMax,
        timeZone: "America/Panama",
        items: [{ id: "primary" }],
      },
      { connectorType: ConnectorType.GoogleCalendar },
    );
    if (result.pending) return { status: "pending", busy: [] };
    if (result.loginRequired) {
      return { status: "login", busy: [], loginUrl: result.loginUrl };
    }
    if (!result.ok) return { status: "off", busy: [] };
    return { status: "ok", busy: busySlots(data.date, result.data) };
  });
