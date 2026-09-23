import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/drinks";
import {
  FOOD_TARGET,
  PLATE_SECTIONS,
  foodNet,
  foodPct,
  foodStatus,
  kitchenWeeks,
  plateLabel,
  plateUnits,
  resetPlates,
  setPlate,
  setPlateUnits,
  targetMenu,
  type Plate,
  type PlateSection,
} from "@/lib/plates";
import { panamaMonday, shiftWeek, weekLabel } from "@/lib/pour";
import { kitchenWage, laborCost, plateMinutes, setKitchenWage, setPlateMinutes } from "@/lib/labor";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

type Line = {
  plate: Plate;
  units: number;
  net: number;
  cost: number;
  margin: number;
  pct: number;
};

function linesFor(weekUnits: Record<string, number>, plates: Plate[]): Line[] {
  return plates
    .map((plate) => {
      const units = weekUnits[plate.id] ?? 0;
      const net = units * foodNet(plate.price);
      const cost = units * plate.cost;
      return { plate, units, net, cost, margin: net - cost, pct: foodPct(plate.cost, plate.price) };
    })
    .filter((line) => line.units > 0);
}

function roll(lines: Line[]) {
  const net = lines.reduce((sum, line) => sum + line.net, 0);
  const cost = lines.reduce((sum, line) => sum + line.cost, 0);
  return {
    net,
    cost,
    units: lines.reduce((sum, line) => sum + line.units, 0),
    pct: net > 0 ? cost / net : 0,
  };
}

export function KitchenWeek({ plates }: { plates: Plate[] }) {
  const [week, setWeek] = useState(() => panamaMonday());
  const [units, setLocal] = useState<Record<string, number>>(() => plateUnits(panamaMonday()));
  const [section, setSection] = useState<PlateSection | "todas">("todas");

  useEffect(() => {
    function sync() {
      setLocal(plateUnits(week));
    }
    window.addEventListener("lqp-kitchen", sync);
    return () => window.removeEventListener("lqp-kitchen", sync);
  }, [week]);

  function openWeek(next: string) {
    setWeek(next);
    setLocal(plateUnits(next));
  }

  function edit(id: string, raw: string) {
    const value = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(value) || value < 0) return;
    setPlateUnits(week, id, value);
    setLocal(plateUnits(week));
  }

  const lines = useMemo(() => linesFor(units, plates), [units, plates]);
  const total = roll(lines);
  const labor = lines.reduce((sum, line) => sum + line.units * laborCost(plateMinutes(line.plate.id), kitchenWage()), 0);
  const bySection = PLATE_SECTIONS.map((key) => ({
    section: key,
    ...roll(lines.filter((line) => line.plate.section === key)),
    target: FOOD_TARGET[key],
  })).filter((row) => row.units > 0);
  const ranked = [...lines].sort((a, b) => b.units - a.units || b.margin - a.margin);
  const leader = ranked[0];
  const richest = [...ranked].sort((a, b) => b.margin - a.margin)[0];
  const over = ranked.filter((line) => line.pct > FOOD_TARGET[line.plate.section] + 0.03);
  const history = kitchenWeeks().slice(-8);
  const shown = plates.filter((plate) => section === "todas" || plate.section === section);

  return (
    <>
      <h1 className="mt-8 font-display text-5xl">Costo de cocina</h1>
      <p className="mt-4 max-w-lg text-sm text-muted">
        Anota los platos de la semana. El costo % es solo alimento, sin mano de obra ni gas, sobre el precio sin ITBMS. El costeo usa 7%. Confirme la tasa.
      </p>
      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" className="min-h-11 border border-line px-4" onClick={() => openWeek(shiftWeek(week, -1))}>
          Semana anterior
        </button>
        <p className="text-center font-display text-2xl">{weekLabel(week)}</p>
        <button type="button" className="min-h-11 border border-line px-4" onClick={() => openWeek(shiftWeek(week, 1))}>
          Siguiente
        </button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Platos" value={String(total.units)} />
        <Stat label="Venta neta" value={money(round2(total.net))} />
        <Stat label="Costo" value={money(round2(total.cost))} />
        <Stat label="Costo %" value={total.units ? pct(total.pct) : "—"} />
        <Stat label="Mano de obra" value={labor > 0 ? money(round2(labor)) : "—"} />
      </div>
      {bySection.length > 0 ? (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {bySection.map((row) => (
            <li key={row.section} className="flex items-baseline justify-between gap-4 py-3 text-sm">
              <span>{plateLabel[row.section].es}</span>
              <span className={row.pct > row.target + 0.03 ? "text-brass" : "text-muted"}>
                {pct(row.pct)} · objetivo {pct(row.target)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <h2 className="mt-12 font-display text-3xl italic">Lo que más sale</h2>
      {leader ? (
        <p className="mt-3 max-w-lg text-sm text-muted">
          El más pedido fue {leader.plate.es}: {leader.units} {leader.units === 1 ? "plato" : "platos"}, margen {money(round2(leader.margin))}, costo {pct(leader.pct)}.
          {richest && richest.plate.id !== leader.plate.id
            ? ` El margen más alto en dólares fue ${richest.plate.es} (${money(round2(richest.margin))}).`
            : ""}
          {over.length
            ? ` Por encima del objetivo: ${over.map((line) => line.plate.es).join(", ")}.`
            : " Ningún plato de esta semana pasa su objetivo por más de 3 puntos."}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">Todavía no hay platos anotados en esta semana.</p>
      )}
      {ranked.length > 0 ? (
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {ranked.slice(0, 8).map((line, index) => (
            <li key={line.plate.id} className="flex items-baseline justify-between gap-4 py-3">
              <span className="font-display text-2xl">
                {index + 1}. {line.plate.es}
              </span>
              <span className="text-sm text-muted">
                {line.units} · {money(round2(line.margin))} · {pct(line.pct)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      {history.length > 1 ? (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {history.map((key) => {
            const summary = roll(linesFor(plateUnits(key), plates));
            return (
              <li key={key}>
                <button type="button" className="flex min-h-11 w-full items-center justify-between" onClick={() => openWeek(key)}>
                  <span>{weekLabel(key)}</span>
                  <span className="text-brass">{pct(summary.pct)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <h2 className="mt-12 font-display text-3xl italic">Conteo</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSection("todas")}
          className={section === "todas" ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted"}
        >
          Toda la carta
        </button>
        {PLATE_SECTIONS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={section === key ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted"}
          >
            {plateLabel[key].es}
          </button>
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {shown.map((plate) => (
          <li key={plate.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
            <div>
              <p className="font-display text-2xl">{plate.es}</p>
              <p className="text-sm text-muted">
                {money(plate.price)} · costo {pct(foodPct(plate.cost, plate.price))}
              </p>
            </div>
            <input
              inputMode="numeric"
              min={0}
              type="number"
              value={units[plate.id] ?? ""}
              placeholder="0"
              aria-label={`Vendidos, ${plate.es}`}
              onChange={(e) => edit(plate.id, e.target.value)}
              className="min-h-11 w-20 border border-line bg-bg px-2 text-fg"
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function PlateDesk({ plates, onChange }: { plates: Plate[]; onChange: () => void }) {
  const [section, setSection] = useState<PlateSection | "todas">("entradas");
  const [wage, setWage] = useState(() => kitchenWage());
  const [minutes, setMinutes] = useState<Record<string, number>>({});
  const shown = plates.filter((plate) => section === "todas" || plate.section === section);

  useEffect(() => {
    function sync() {
      const next: Record<string, number> = {};
      for (const plate of plates) {
        const value = plateMinutes(plate.id);
        if (value) next[plate.id] = value;
      }
      setMinutes(next);
      setWage(kitchenWage());
    }
    sync();
    window.addEventListener("lqp-labor", sync);
    return () => window.removeEventListener("lqp-labor", sync);
  }, [plates]);

  return (
    <>
      <h1 className="mt-8 font-display text-5xl">Cocina</h1>
      <p className="mt-4 max-w-lg text-sm text-muted">
        El costeo de alimentos no trae mano de obra. La mano de obra de un plato es minutos ÷ 60 × el pago por hora. No se publica.
      </p>
      <label className="mt-6 flex items-center gap-3 text-sm text-muted">
        Pago por hora
        <input
          type="number"
          min={0}
          step="0.25"
          value={wage || ""}
          placeholder="0"
          aria-label="Pago por hora de cocina"
          onChange={(e) => {
            const value = e.target.value === "" ? 0 : Number(e.target.value);
            if (Number.isNaN(value) || value < 0) return;
            setKitchenWage(value);
            setWage(value);
          }}
          className="min-h-11 w-28 border border-line bg-bg px-2 text-fg"
        />
      </label>
      <div className="mt-8 flex flex-wrap gap-2">
        {PLATE_SECTIONS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={section === key ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted"}
          >
            {plateLabel[key].es}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            resetPlates();
            onChange();
          }}
          className="min-h-11 border border-line px-3 text-sm text-muted"
        >
          Restaurar precios
        </button>
      </div>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {shown.map((plate) => {
          const ratio = foodPct(plate.cost, plate.price);
          const status = foodStatus(ratio, FOOD_TARGET[plate.section]);
          return (
            <li key={plate.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-display text-2xl">{plate.es}</p>
                <p className="text-sm text-muted">
                  Alimento {money(round2(plate.cost))} · {pct(ratio)} · {status} · objetivo {money(targetMenu(plate.cost, FOOD_TARGET[plate.section]))}
                  {wage > 0 && minutes[plate.id]
                    ? ` · mano de obra ${money(round2(laborCost(minutes[plate.id], wage)))}`
                    : ""}
                </p>
                {plate.id === "aranitas" ? (
                  <p className="mt-1 text-sm text-brass">El costeo pide confirmar la receta.</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted">
                  Min
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={minutes[plate.id] ?? ""}
                    placeholder="0"
                    aria-label={`Minutos, ${plate.es}`}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : Number(e.target.value);
                      if (Number.isNaN(value) || value < 0) return;
                      setPlateMinutes(plate.id, value);
                      setMinutes((current) => {
                        const next = { ...current };
                        if (value > 0) next[plate.id] = Math.round(value);
                        else delete next[plate.id];
                        return next;
                      });
                    }}
                    className="ml-2 min-h-11 w-20 border border-line bg-bg px-2 text-fg"
                  />
                </label>
                <label className="text-sm text-muted">
                  $
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={plate.price}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      if (Number.isNaN(price)) return;
                      setPlate(plate.id, { price });
                      onChange();
                    }}
                    className="ml-2 min-h-11 w-24 border border-line bg-bg px-2 text-fg"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPlate(plate.id, { available: !plate.available });
                    onChange();
                  }}
                  className={plate.available ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted"}
                >
                  {plate.available ? "En servicio" : "Fuera"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-3 py-4">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
