import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/drinks";
import { patchSupply, supplyDesk } from "@/lib/casa";

type BookId = "cocina" | "barra";

type Row = {
  id: string;
  name: string;
  category: string;
  pack: string;
  unit: string;
  buy: number | null;
  yield: number | null;
  each: number | null;
  used: number;
};

type Prep = {
  id: string;
  name: string;
  yield: number | null;
  lines: { index: number; name: string; qty: number; each: number }[];
};

function cents(value: number) {
  if (value >= 1) return money(Math.round(value * 100) / 100);
  return `$${value.toFixed(3)}`;
}

export function Insumos({ onChange }: { onChange: () => void }) {
  const [book, setBook] = useState<BookId>("cocina");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [preps, setPreps] = useState<Prep[]>([]);
  const [category, setCategory] = useState<string>("todas");

  async function load(next: BookId = book) {
    const data = await supplyDesk({ data: { book: next } });
    setRows(data.supplies);
    setPreps(data.preps);
    onChange();
  }

  useEffect(() => {
    void load(book).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  const categories = useMemo(() => [...new Set(rows.map((supply) => supply.category))], [rows]);
  const shown = rows.filter((supply) => {
    const hay = supply.name.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (category !== "todas" && supply.category !== category) return false;
    return true;
  });

  return (
    <>
      <h1 className="mt-8 font-display text-5xl">Insumos</h1>
      <p className="mt-4 max-w-xl text-sm text-muted">
        El número azul del costeo: lo que paga por la presentación, y el rendimiento después de limpiar. Al cambiarlo, el costo del plato o del trago se recalcula. No se publica.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["cocina", "barra"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setBook(id);
              setCategory("todas");
              setQuery("");
            }}
            className={book === id ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted"}
          >
            {id === "cocina" ? "Cocina" : "Barra"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            void patchSupply({ data: { book, kind: "reset" } }).then(() => load());
          }}
          className="min-h-11 border border-line px-4 text-sm text-muted"
        >
          Volver al archivo
        </button>
      </div>
      <label className="mt-6 grid gap-2 text-sm text-muted">
        Buscar
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-11 border border-line bg-bg px-3 text-fg"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("todas")}
          className={category === "todas" ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted"}
        >
          Todo
        </button>
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCategory(name)}
            className={category === name ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted"}
          >
            {name}
          </button>
        ))}
      </div>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {shown.map((supply) => {
          const used = supply.used;
          return (
            <li key={supply.id} className="grid gap-3 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-display text-2xl">{supply.name}</p>
                <p className="text-sm text-muted">{used ? `${used} recetas` : "lote"}</p>
              </div>
              <p className="text-sm text-muted">
                {supply.pack}
                {supply.each != null ? ` · ${cents(supply.each)} por ${supply.unit}` : ""}
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="text-sm text-muted">
                  Costo de compra
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={supply.buy ?? ""}
                    aria-label={`Costo de compra, ${supply.name}`}
                    onChange={(e) => {
                      const buy = Number(e.target.value);
                      if (Number.isNaN(buy) || buy < 0) return;
                      void patchSupply({ data: { book, kind: "buy", id: supply.id, value: buy } }).then(() => load());
                    }}
                    className="mt-1 block min-h-11 w-28 border border-line bg-bg px-2 text-fg"
                  />
                </label>
                {book === "cocina" && supply.yield != null ? (
                  <label className="text-sm text-muted">
                    Rendimiento %
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step="1"
                      value={Math.round(supply.yield * 100)}
                      aria-label={`Rendimiento, ${supply.name}`}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        if (Number.isNaN(pct) || pct <= 0) return;
                        void patchSupply({ data: { book, kind: "yield", id: supply.id, value: pct / 100 } }).then(() => load());
                      }}
                      className="mt-1 block min-h-11 w-24 border border-line bg-bg px-2 text-fg"
                    />
                  </label>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <details className="mt-10">
        <summary className="cursor-pointer font-display text-3xl italic">Preparaciones y lotes</summary>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Lo que no se compra ya medido: guacamole, chimichurri, jarabes. El costo por unidad es el del archivo. Si cambia una cantidad, pese la tanda.
        </p>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {preps.map((prep) => (
            <li key={prep.id} className="py-4">
              <p className="font-display text-2xl">{prep.name}</p>
              <p className="text-sm text-muted">Rinde {prep.yield} {book === "cocina" || book === "barra" ? "oz" : ""}</p>
              <ul className="mt-3 grid gap-2">
                {prep.lines.map((line, index) => (
                  <li key={`${prep.id}-${line.index}`} className="grid grid-cols-[1fr_5rem_6rem] items-center gap-2 text-sm">
                    <span>{line.name}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={line.qty}
                      aria-label={`Cantidad, ${prep.name}, ${line.name}`}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        if (Number.isNaN(qty) || qty < 0) return;
                        void patchSupply({ data: { book, kind: "prepQty", id: prep.id, index: line.index, value: qty } }).then(() => load());
                      }}
                      className="min-h-11 border border-line bg-bg px-2 text-fg"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.each}
                      aria-label={`Costo, ${prep.name}, ${line.name}`}
                      onChange={(e) => {
                        const each = Number(e.target.value);
                        if (Number.isNaN(each) || each < 0) return;
                        void patchSupply({ data: { book, kind: "prepEach", id: prep.id, index: line.index, value: each } }).then(() => load());
                      }}
                      className="min-h-11 border border-line bg-bg px-2 text-fg"
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </details>
      <div className="mt-10 flex flex-col gap-2 text-sm">
        <a className="text-brass" href="/casa/costeo-cocina.xlsx">
          Descargar costeo de cocina
        </a>
        <a className="text-brass" href="/casa/costeo-barra.xlsx">
          Descargar costeo de barra
        </a>
      </div>
    </>
  );
}
