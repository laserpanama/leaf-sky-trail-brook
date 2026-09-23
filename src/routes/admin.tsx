import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { houseEnter, houseOps, houseStatus, listRequests, markRequest, menuCosts, publicMenu } from "@/lib/casa";
import {
  DRINK_SECTIONS,
  drinkStatus,
  listDrinks,
  money,
  replaceDrinkOverrides,
  resetDrinks,
  sectionLabel,
  setDrink,
  type Drink,
  type DrinkSection,
} from "@/lib/drinks";
import { Costeo } from "@/components/costeo";
import { KitchenWeek, PlateDesk } from "@/components/cocina";
import { Insumos } from "@/components/insumos";
import { listPlates, replaceKitchenWeeks, replacePlateOverrides, type Plate } from "@/lib/plates";
import { replacePour } from "@/lib/pour";
import { replaceLabor } from "@/lib/labor";
import type { HoldStatus } from "@/lib/holds";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: Admin,
});

const labels: Record<HoldStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  no: "No",
};

function Admin() {
  const [tab, setTab] = useState<"reservas" | "barra" | "cocina" | "insumos" | "costo">("reservas");
  const [open, setOpen] = useState<boolean | null>(null);
  const [key, setKey] = useState("");
  const [denied, setDenied] = useState(false);
  const [holds, setHolds] = useState<Array<{ id: string; date: string; time: string; party: number; status: HoldStatus; notes: string }>>([]);
  const [filter, setFilter] = useState<HoldStatus | "todas">("pendiente");
  const [drinks, setDrinksState] = useState<Drink[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [section, setSection] = useState<DrinkSection | "todas">("casa");
  const [book, setBook] = useState<"barra" | "cocina">("cocina");

  async function loadCasa() {
    const menu = await publicMenu();
    replacePlateOverrides(menu.plates);
    replaceDrinkOverrides(menu.drinks);
    let nextPlates = listPlates();
    let nextDrinks = listDrinks();
    try {
      const costs = await menuCosts();
      nextPlates = nextPlates.map((plate) =>
        costs.plates[plate.id] != null ? { ...plate, cost: costs.plates[plate.id] } : plate,
      );
      nextDrinks = nextDrinks.map((drink) => {
        const cost = costs.drinks[drink.id];
        if (cost == null) return drink;
        return { ...drink, cost, status: drinkStatus(drink.section, cost, drink.price, drink.id) };
      });
    } catch {
      /* costs stay on the server until the house key is open */
    }
    try {
      const ops = await houseOps();
      replaceLabor(ops.labor);
      replacePour(ops.pour);
      replaceKitchenWeeks(ops.kitchen);
    } catch {
      /* weekly counts stay empty until the house key is open */
    }
    setPlates(nextPlates);
    setDrinksState(nextDrinks);
    try {
      setHolds(await listRequests());
    } catch {
      setHolds([]);
    }
  }

  useEffect(() => {
    void houseStatus()
      .then((status) => {
        setOpen(status.open);
        if (status.open) return loadCasa();
      })
      .catch(() => setOpen(false));
  }, []);

  const shown = holds.filter((hold) => filter === "todas" || hold.status === filter);
  const shownDrinks = drinks.filter((drink) => section === "todas" || drink.section === section);

  function mark(id: string, status: HoldStatus) {
    void markRequest({ data: { id, status } }).then(() => loadCasa());
  }

  function refreshDrinks() {
    setDrinksState((current) => {
      const costs = new Map(current.map((drink) => [drink.id, drink.cost]));
      return listDrinks().map((drink) => {
        const cost = costs.get(drink.id);
        if (cost == null || cost <= 0) return drink;
        return { ...drink, cost, status: drinkStatus(drink.section, cost, drink.price, drink.id) };
      });
    });
  }

  return (
    <main className="min-h-screen bg-bg px-5 py-10 text-fg">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs tracking-[0.28em] text-brass uppercase">Casa</p>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Reservas, precios y costos de la casa. La carta pública no muestra lo que cuesta.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["reservas", "Reservas"],
              ["cocina", "Platos"],
              ["barra", "Tragos"],
              ["insumos", "Insumos"],
              ["costo", "Semana"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={tab === id ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted"}
            >
              {label}
            </button>
          ))}
        </div>
        {open === false ? (
          <form
            className="mt-10 grid max-w-sm gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void houseEnter({ data: { password: key } }).then((result) => {
                setDenied(!result.open);
                setOpen(result.open);
                if (result.open) void loadCasa();
              });
            }}
          >
            <h1 className="font-display text-5xl">Casa</h1>
            <p className="text-sm text-muted">La llave no es una cuenta de cliente. Quien no la tiene, no ve costos ni reservas.</p>
            <label className="grid gap-2 text-sm text-muted">
              Llave
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="min-h-11 border border-line bg-bg px-3 text-fg"
              />
            </label>
            {denied ? <p className="text-sm text-brass">Esa llave no abre.</p> : null}
            <button type="submit" className="min-h-11 bg-brass text-ink">
              Entrar
            </button>
          </form>
        ) : open === null ? (
          <p className="mt-10 text-sm text-muted">Abriendo la casa…</p>
        ) : tab === "reservas" ? (
          <>
            <h1 className="mt-8 font-display text-5xl">Reservas</h1>
            <p className="mt-4 max-w-lg text-sm text-muted">
              Solicitudes de fecha, hora y personas. El nombre y la nota van solo por WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {(["pendiente", "confirmada", "no", "todas"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={
                    filter === key
                      ? "min-h-11 bg-brass px-4 text-ink"
                      : "min-h-11 border border-line px-4 text-muted"
                  }
                >
                  {key === "todas" ? "Todas" : labels[key]}
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <p className="mt-12 font-display text-3xl text-muted">Nada en esta lista.</p>
            ) : (
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {shown.map((hold) => (
                  <li key={hold.id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div>
                      <p className="font-display text-3xl">
                        {hold.date} · {hold.time}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {hold.party} {Number(hold.party) === 1 ? "persona" : "personas"} · {labels[hold.status]}
                      </p>
                      {hold.notes ? <p className="mt-3 max-w-md text-fg">{hold.notes}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["pendiente", "confirmada", "no"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => mark(hold.id, status)}
                          className={
                            hold.status === status
                              ? "min-h-11 bg-brass px-3 text-sm text-ink"
                              : "min-h-11 border border-line px-3 text-sm text-muted"
                          }
                        >
                          {labels[status]}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : tab === "insumos" ? (
          <Insumos onChange={() => void loadCasa()} />
        ) : tab === "cocina" ? (
          <PlateDesk plates={plates} onChange={() => setPlates((current) => {
            const costs = new Map(current.map((plate) => [plate.id, plate.cost]));
            return listPlates().map((plate) => ({ ...plate, cost: costs.get(plate.id) ?? plate.cost }));
          })} />
        ) : tab === "barra" ? (
          <>
            <h1 className="mt-8 font-display text-5xl">Barra</h1>
            <p className="mt-4 max-w-lg text-sm text-muted">
              Precio y si está en servicio. El costo no sale en la carta. Un cambio de precio sí.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {DRINK_SECTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSection(key)}
                  className={
                    section === key
                      ? "min-h-11 bg-brass px-3 text-sm text-ink"
                      : "min-h-11 border border-line px-3 text-sm text-muted"
                  }
                >
                  {sectionLabel[key].es}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  resetDrinks();
                  refreshDrinks();
                }}
                className="min-h-11 border border-line px-3 text-sm text-muted"
              >
                Restaurar precios
              </button>
            </div>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {shownDrinks.map((drink) => (
                <li key={drink.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-display text-2xl">{drink.es}</p>
                    <p className="text-sm text-muted">
                      Costo {money(drink.cost)} · {drink.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted">
                      $
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={drink.price}
                        onChange={(e) => {
                          const price = Number(e.target.value);
                          if (Number.isNaN(price)) return;
                          setDrink(drink.id, { price });
                          refreshDrinks();
                        }}
                        className="ml-2 min-h-11 w-24 border border-line bg-bg px-2 text-fg"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setDrink(drink.id, { available: !drink.available });
                        refreshDrinks();
                      }}
                      className={
                        drink.available
                          ? "min-h-11 bg-brass px-3 text-sm text-ink"
                          : "min-h-11 border border-line px-3 text-sm text-muted"
                      }
                    >
                      {drink.available ? "En servicio" : "Fuera"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="mt-8 flex gap-2">
              <button
                type="button"
                onClick={() => setBook("cocina")}
                className={book === "cocina" ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted"}
              >
                Cocina
              </button>
              <button
                type="button"
                onClick={() => setBook("barra")}
                className={book === "barra" ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted"}
              >
                Barra
              </button>
            </div>
            {book === "cocina" ? <KitchenWeek plates={plates} /> : <Costeo drinks={drinks} />}
          </>
        )}

        <Link to="/" className="mt-10 inline-flex min-h-11 items-center text-brass">
          Volver a la casa
        </Link>
      </div>
    </main>
  );
}
