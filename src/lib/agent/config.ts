import { SLOT_TIMES } from "@/lib/slots";
import { venue } from "@/venue";

/**
 * Reservation agent config — the ONE file to regenerate per restaurant when
 * this module is reused from the template. Everything the agent knows about the
 * house, and every booking rule, lives here. Numeric rules can be overridden on
 * the server with env vars (see `agentConfig()`), so the bar can tune capacity
 * without a redeploy of code.
 */
export type AgentConfig = {
  restaurant: {
    name: string;
    kind: string;
    address: string;
    whatsapp: string;
    instagram: string;
    payments: string;
    amenities: string;
    /** Short, true facts the agent may state. Nothing outside this list. */
    facts: string[];
  };
  /** IANA zone + fixed offset (Panama has no DST). */
  timezone: string;
  utcOffset: string;
  /** Start times guests can book. */
  slots: readonly string[];
  slotMinutes: number;
  /** Max guests who can START in one slot (covers per slot). */
  coversPerSlot: number;
  /** Parties up to this size auto-confirm when there is room; larger go to staff. */
  autoConfirmMaxParty: number;
  maxParty: number;
  bookAheadDays: number;
  /** Minimum minutes between "now" and the slot start. */
  minLeadMinutes: number;
  /** 0 = Sunday … 6 = Saturday. */
  closedWeekdays: number[];
  defaultLang: "es" | "en";
};

export const BASE_CONFIG: AgentConfig = {
  restaurant: {
    name: venue.name,
    kind: venue.agent.kind,
    address: venue.contact.address,
    whatsapp: `+${venue.contact.whatsapp.slice(0, 3)} ${venue.contact.whatsappDisplay}`,
    instagram: `@${venue.contact.instagram}`,
    payments: venue.agent.payments,
    amenities: venue.agent.amenities,
    facts: venue.agent.facts,
  },
  timezone: "America/Panama",
  utcOffset: "-05:00",
  slots: SLOT_TIMES,
  slotMinutes: 30,
  coversPerSlot: venue.booking.coversPerSlot,
  autoConfirmMaxParty: venue.booking.autoConfirmMaxParty,
  maxParty: venue.booking.maxParty,
  bookAheadDays: venue.booking.bookAheadDays,
  minLeadMinutes: venue.booking.minLeadMinutes,
  closedWeekdays: venue.booking.closedWeekdays,
  defaultLang: "es",
};

function intEnv(key: string, fallback: number, min: number, max: number) {
  const raw = typeof process !== "undefined" ? process.env[key]?.trim() : undefined;
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

/** Server-side config with env overrides applied. */
export function agentConfig(): AgentConfig {
  const closedRaw = typeof process !== "undefined" ? process.env.AGENT_CLOSED_WEEKDAYS?.trim() : undefined;
  const closed = closedRaw
    ? closedRaw
        .split(",")
        .map((d) => Number(d.trim()))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : BASE_CONFIG.closedWeekdays;
  const maxParty = intEnv("AGENT_MAX_PARTY", BASE_CONFIG.maxParty, 1, 200);
  return {
    ...BASE_CONFIG,
    coversPerSlot: intEnv("AGENT_COVERS_PER_SLOT", BASE_CONFIG.coversPerSlot, 1, 1000),
    autoConfirmMaxParty: Math.min(intEnv("AGENT_AUTO_MAX_PARTY", BASE_CONFIG.autoConfirmMaxParty, 0, 200), maxParty),
    maxParty,
    minLeadMinutes: intEnv("AGENT_MIN_LEAD_MIN", BASE_CONFIG.minLeadMinutes, 0, 24 * 60),
    closedWeekdays: closed,
  };
}
