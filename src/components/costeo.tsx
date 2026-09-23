import { useEffect, useMemo, useState } from "react";
import { DRINK_SECTIONS, money, sectionLabel, type Drink, type DrinkSection } from "@/lib/drinks";
import {
  panamaMonday,
  pourPct,
  savedWeeks,
  sectionRollup,
  setUnits,
  shiftWeek,
  sumLines,
  topCocktails,
  unitsFor,
  weekLabel,
  weekLines,
} from "@/lib/pour";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function Costeo({ drinks }: { drinks: Drink[] }) {
  const [week, setWeek] = useState(() => panamaMonday());
  const [units, setLocal] = useState<Record<string, number>>(() => unitsFor(panamaMonday()));
  const [section, setSection] = useState<DrinkSection | "cocteles">("cocteles");

  useEffect(() => {
    function sync() {
      setLocal(unitsFor(week));
    }
    window.addEventListener("lqp-pour", sync);
    return () => window.removeEventListener("lqp-pour", sync);
  }, [week]);

  function openWeek(next: string) {
    setWeek(next);
    setLocal(unitsFor(next));
  }

  function edit(id: string, raw: string) {
    const value = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(value) || value < 0) return;
    setUnits(week, id, value);
    setLocal(unitsFor(week));
  }

  const lines = useMemo(() => weekLines(units, drinks), [units, drinks]);
  const total = sumLines(lines);
  const sections = sectionRollup(lines);
  const cocktails = topCocktails(lines);
  const leader = cocktails[0];
  const richest = [...cocktails].sort((a, b) => b.margin - a.margin)[0];
  const over = cocktails.filter((line) => line.pct > 0.2);
  const history = savedWeeks().slice(-8);
  const shown = drinks.filter((drink) =>
    section === "cocteles" ? drink.section === "casa" || drink.section === "clasico" : drink.section === section,
  );

  return (
    <>
      <h1 className="mt-8 font-display text-5xl">Costo semanal</h1>
      <p className="mt-4 max-w-lg text-sm text-muted">
        Anota los tragos vendidos. El costo % es el de la receta sobre el precio sin ITBMS, con el 10% del costeo. No sale de una caja registradora.
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
        <Stat label="Tragos" value={String(total.units)} />
        <Stat label="Venta neta" value={money(round2(total.net))} />
        <Stat label="Costo" value={money(round2(total.cost))} />
        <Stat label="Costo %" value={total.units ? pct(total.pct) : "—"} />
      </div>

      {sections.length > 0 ? (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {sections.map((row) => (
            <li key={row.section} className="flex items-baseline justify-between gap-4 py-3 text-sm">
              <span>{sectionLabel[row.section].es}</span>
              <span className={row.pct > row.target + 0.03 ? "text-brass" : "text-muted"}>
                {pct(row.pct)} · objetivo {pct(row.target)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <h2 className="mt-12 font-display text-3xl italic">Cócteles que más salen</h2>
      {leader ? (
        <p className="mt-3 max-w-lg text-sm text-muted">
          El más pedido fue {leader.drink.es}: {leader.units} {leader.units === 1 ? "trago" : "tragos"}, margen {money(round2(leader.margin))}, costo {pct(leader.pct)}.
          {richest && richest.drink.id !== leader.drink.id
            ? ` El margen más alto en dólares fue ${richest.drink.es} (${money(round2(richest.margin))}).`
            : ""}
          {over.length
            ? ` Por encima del 20%: ${over.map((line) => line.drink.es).join(", ")}.`
            : " Ningún cóctel de esta semana pasa el 20%."}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">Todavía no hay cócteles anotados en esta semana.</p>
      )}
      {cocktails.length > 0 ? (
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {cocktails.slice(0, 8).map((line, index) => (
            <li key={line.drink.id} className="flex items-baseline justify-between gap-4 py-3">
              <span className="font-display text-2xl">
                {index + 1}. {line.drink.es}
              </span>
              <span className="text-sm text-muted">
                {line.units} · {money(round2(line.margin))} · {pct(line.pct)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {history.length > 1 ? (
        <div className="mt-10">
          <h2 className="font-display text-3xl italic">Semanas</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {history.map((key) => {
              const roll = sumLines(weekLines(unitsFor(key), drinks));
              return (
                <li key={key}>
                  <button type="button" className="flex min-h-11 w-full items-center justify-between" onClick={() => openWeek(key)}>
                    <span>{weekLabel(key)}</span>
                    <span className="text-brass">{pct(roll.pct)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <h2 className="mt-12 font-display text-3xl italic">Conteo</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSection("cocteles")}
          className={section === "cocteles" ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted"}
        >
          Cócteles
        </button>
        {DRINK_SECTIONS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={section === key ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted"}
          >
            {sectionLabel[key].es}
          </button>
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {shown.map((drink) => (
          <li key={drink.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
            <div>
              <p className="font-display text-2xl">{drink.es}</p>
              <p className="text-sm text-muted">
                {money(drink.price)} · costo {pct(pourPct(drink.cost, drink.price))}
              </p>
            </div>
            <input
              inputMode="numeric"
              min={0}
              type="number"
              value={units[drink.id] ?? ""}
              placeholder="0"
              aria-label={`Vendidos, ${drink.es}`}
              onChange={(e) => edit(drink.id, e.target.value)}
              className="min-h-11 w-20 border border-line bg-bg px-2 text-fg"
            />
          </li>
        ))}
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

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
