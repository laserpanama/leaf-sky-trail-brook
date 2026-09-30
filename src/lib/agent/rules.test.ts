import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { availability, decide, localToday, makeCode, normalizePhone, type Rules } from "./rules.ts";

const rules: Rules = {
  slots: ["18:00", "18:30", "19:00", "19:30", "20:00"],
  coversPerSlot: 10,
  autoConfirmMaxParty: 6,
  maxParty: 20,
  bookAheadDays: 30,
  minLeadMinutes: 60,
  closedWeekdays: [1], // Mondays
  utcOffset: "-05:00",
};

// Wed 2026-09-30 10:00 Panama
const NOW = new Date("2026-09-30T10:00:00-05:00").getTime();

describe("agent rules", () => {
  it("computes Panama local date across UTC midnight", () => {
    assert.equal(localToday(new Date("2026-10-01T03:00:00Z").getTime(), "-05:00"), "2026-09-30");
  });

  it("confirms small parties with room", () => {
    assert.deepEqual(decide({ date: "2026-10-02", time: "19:00", party: 4 }, [], rules, NOW), {
      ok: true,
      status: "confirmada",
    });
  });

  it("sends large parties to staff instead of refusing", () => {
    assert.deepEqual(decide({ date: "2026-10-02", time: "19:00", party: 8 }, [], rules, NOW), {
      ok: true,
      status: "pendiente",
    });
  });

  it("refuses when the slot is full and suggests the nearest open slots", () => {
    const booked = [
      { slot: "19:00", party: 8 },
      { slot: "18:30", party: 9 },
    ];
    const d = decide({ date: "2026-10-02", time: "19:00", party: 4 }, booked, rules, NOW);
    assert.equal(d.ok, false);
    if (!d.ok) {
      assert.equal(d.reason, "lleno");
      assert.deepEqual(d.alternatives, ["18:00", "19:30", "20:00"]);
    }
  });

  it("blocks closed days, past dates, too-far dates and too-short lead time", () => {
    const r = (date: string, time = "19:00") => {
      const d = decide({ date, time, party: 2 }, [], rules, NOW);
      return d.ok ? "ok" : d.reason;
    };
    assert.equal(r("2026-10-05"), "cerrado");
    assert.equal(r("2026-09-29"), "pasado");
    assert.equal(r("2026-12-31"), "muy_lejos");
    const late = new Date("2026-09-30T18:30:00-05:00").getTime();
    const d = decide({ date: "2026-09-30", time: "19:00", party: 2 }, [], rules, late);
    assert.equal(d.ok ? "ok" : d.reason, "muy_pronto");
    assert.equal(r("2026-10-02", "17:00"), "hora_invalida");
  });

  it("reports remaining covers per slot", () => {
    const slots = availability("2026-10-02", [{ slot: "20:00", party: 10 }], rules, NOW);
    assert.deepEqual(slots.at(-1), { time: "20:00", left: 0, open: false });
    assert.equal(slots[0].left, 10);
  });

  it("normalizes Panama phones", () => {
    assert.equal(normalizePhone("6123-4567"), "+50761234567");
    assert.equal(normalizePhone("507 6123 4567"), "+50761234567");
    assert.equal(normalizePhone("+1 (305) 555-0100"), "+13055550100");
    assert.equal(normalizePhone("123"), null);
  });

  it("makes unambiguous 5-char codes", () => {
    const code = makeCode();
    assert.match(code, /^[A-HJ-NP-Z2-9]{5}$/);
  });
});
