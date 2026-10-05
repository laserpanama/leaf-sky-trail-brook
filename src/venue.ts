import built from "@venue";
import type { Venue } from "@/venues/types";

/**
 * Mix-up guard. The deploy writes VENUE=<slug> into each site's env file; if the
 * running server was built for a different venue, every server render fails
 * loudly instead of serving another client's site on this domain.
 *
 * It wraps the exported value (not a top-level statement) so bundlers keep it:
 * the package is `sideEffects: false` and a bare re-export would skip this file.
 */
function checked(v: Venue): Venue {
  if (typeof window === "undefined") {
    // Read at runtime from the server's env (globalThis keeps bundlers from inlining it).
    const runtime = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
    const expected = runtime?.env?.["VENUE"]?.trim();
    if (expected && expected !== v.slug) {
      throw new Error(`VENUE mismatch: this server was built for "${v.slug}" but its env says "${expected}". Rebuild with VENUE=${expected}.`);
    }
  }
  return v;
}

/** The active restaurant (chosen at build time with VENUE=<slug>). */
export const venue: Venue = checked(built);
export type { Venue, Copy } from "@/venues/types";
