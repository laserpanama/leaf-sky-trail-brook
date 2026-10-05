import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { money } from "@/lib/drinks";
import {
  acceptWeb,
  charge,
  floorMenu,
  sendOrder,
  switchItem,
  tabs as loadTabs,
  ticketStatus,
  tickets as loadTickets,
  voidTicket,
  type Pay,
  type ServiceMenuItem,
  type StationTicket,
  type Tab,
  type TabOrder,
} from "@/lib/service";

/* ───────────── shared bits ───────────── */

const btn = "min-h-11 border border-line px-3 text-sm text-muted hover:text-fg";
const btnOn = "min-h-11 bg-brass px-3 text-sm text-ink";
const PAY_LABEL: Record<Pay, string> = { yappy: "Yappy", tarjeta: "Tarjeta", efectivo: "Efectivo" };

/** Poll while the tab is visible; refresh at once when it comes back. */
function useLive<T>(load: () => Promise<T>, ms: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const ref = useRef(load);
  ref.current = load;
  const refresh = useCallback(() => {
    void ref.current()
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);
  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, ms);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ms, refresh]);
  return { data, error, refresh };
}

function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

function minutesSince(isoDate: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(isoDate).getTime()) / 60_000));
}

function clock(isoDate: string) {
  return new Intl.DateTimeFormat("es-PA", { timeZone: "America/Panama", hour: "2-digit", minute: "2-digit" }).format(new Date(isoDate));
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    navigator.vibrate?.(200);
  } catch {
    /* no audio */
  }
}

function errText(err: unknown) {
  const msg = err instanceof Error ? err.message : "";
  if (msg.startsWith("agotado:")) return `Se agotó: ${msg.slice(8)}. Quítalo del pedido.`;
  if (msg.includes("mesa")) return "Falta la mesa.";
  if (msg.includes("cerrado")) return "Tu llave no permite esta acción.";
  if (msg.includes("anular")) return "Ya se empezó a preparar: pídelo a la barra.";
  return "No se pudo. Revisa la conexión e intenta de nuevo.";
}

/* ───────────── waiter: Mesas ───────────── */

type CartLine = { key: string; kind: "plate" | "drink"; id: string; name: string; price: number; qty: number; note: string };

const QUICK_TABLES = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Mesa 6", "Mesa 7", "Mesa 8", "Barra", "Terraza"];

function readWaiter() {
  try {
    return window.localStorage.getItem("lqp-mesero") ?? "";
  } catch {
    return "";
  }
}

export function MesasDesk() {
  const menu = useLive(() => floorMenu(), 60_000);
  const open = useLive(() => loadTabs(), 10_000);
  const [waiter, setWaiter] = useState("");
  const [table, setTable] = useState("");
  const [service, setService] = useState<"mesa" | "llevar">("mesa");
  const [kind, setKind] = useState<"plate" | "drink">("drink");
  const [section, setSection] = useState("");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState("");
  const now = useNow();

  useEffect(() => setWaiter(readWaiter()), []);

  const items = useMemo(() => menu.data ?? [], [menu.data]);
  const sections = useMemo(() => [...new Set(items.filter((i) => i.kind === kind).map((i) => i.section))], [items, kind]);
  const shown = items.filter(
    (i) =>
      i.kind === kind &&
      (query ? i.name.toLowerCase().includes(query.toLowerCase()) : !section || i.section === section),
  );
  const total = cart.reduce((sum, l) => sum + l.qty * l.price, 0);

  function add(item: ServiceMenuItem) {
    if (!item.available) return;
    setState("idle");
    setCart((current) => {
      const found = current.find((l) => l.kind === item.kind && l.id === item.id && !l.note);
      if (found) return current.map((l) => (l === found ? { ...l, qty: l.qty + 1 } : l));
      return [...current, { key: `${item.kind}:${item.id}:${Date.now()}`, kind: item.kind, id: item.id, name: item.name, price: item.price, qty: 1, note: "" }];
    });
  }

  function bump(key: string, delta: number) {
    setCart((current) => current.flatMap((l) => (l.key !== key ? [l] : l.qty + delta < 1 ? [] : [{ ...l, qty: l.qty + delta }])));
  }

  function send() {
    const label = service === "llevar" ? table || "Para llevar" : table;
    if (!label.trim()) {
      setMessage("Elige la mesa.");
      return;
    }
    setState("sending");
    setMessage("");
    try {
      window.localStorage.setItem("lqp-mesero", waiter);
    } catch {
      /* storage blocked */
    }
    void sendOrder({
      data: { table: label, waiter, service, note, lines: cart.map((l) => ({ kind: l.kind, id: l.id, qty: l.qty, note: l.note })) },
    })
      .then((res) => {
        setCart([]);
        setNote("");
        setState("sent");
        setMessage(`Comanda enviada a ${label} · ${money(res.total)}`);
        open.refresh();
      })
      .catch((err) => {
        setState("idle");
        setMessage(errText(err));
        menu.refresh();
      });
  }

  return (
    <div className="mt-8 grid gap-10">
      <section>
        <h1 className="font-display text-5xl">Tomar pedido</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr]">
          <label className="grid gap-2 text-sm text-muted">
            Mesero
            <input
              value={waiter}
              onChange={(e) => setWaiter(e.target.value)}
              placeholder="Tu nombre"
              maxLength={40}
              className="min-h-11 border border-line bg-bg px-3 text-fg"
            />
          </label>
          <div className="grid gap-2 text-sm text-muted">
            Servicio
            <div className="flex gap-2">
              <button type="button" className={service === "mesa" ? btnOn : btn} onClick={() => setService("mesa")}>
                En el local
              </button>
              <button type="button" className={service === "llevar" ? btnOn : btn} onClick={() => setService("llevar")}>
                Para llevar
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-muted">
          {service === "llevar" ? "Nombre del pedido" : "Mesa"}
          <div className="flex flex-wrap gap-2">
            {service === "mesa"
              ? QUICK_TABLES.map((t) => (
                  <button key={t} type="button" className={table === t ? btnOn : btn} onClick={() => setTable(t)}>
                    {t}
                  </button>
                ))
              : null}
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder={service === "llevar" ? "Ej. Carlos" : "Otra: Mesa 12, Barra 3…"}
              maxLength={24}
              className="min-h-11 min-w-40 flex-1 border border-line bg-bg px-3 text-fg"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div id="carta-mesero" className="scroll-mt-4">
          <p className="mb-3 text-sm text-muted">
            Toca un producto para sumarlo a la comanda. Cada toque agrega uno.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={kind === "drink" ? btnOn : btn} onClick={() => { setKind("drink"); setSection(""); }}>
              Tragos
            </button>
            <button type="button" className={kind === "plate" ? btnOn : btn} onClick={() => { setKind("plate"); setSection(""); }}>
              Platos
            </button>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="min-h-11 min-w-32 flex-1 border border-line bg-bg px-3 text-sm text-fg"
              aria-label="Buscar en la carta"
            />
          </div>
          {!query ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={!section ? btnOn : btn} onClick={() => setSection("")}>
                Todo
              </button>
              {sections.map((s) => (
                <button key={s} type="button" className={section === s ? btnOn : btn} onClick={() => setSection(s)}>
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          {menu.data === null ? (
            menu.error ? (
              <div className="mt-6 grid gap-2 text-sm">
                <p className="text-brass">No se pudo cargar la carta. Revisa la conexión.</p>
                <button type="button" className={btn} onClick={menu.refresh}>
                  Reintentar
                </button>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">Cargando carta…</p>
            )
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {shown.map((item) => {
                const inCart = cart.filter((l) => l.kind === item.kind && l.id === item.id).reduce((s, l) => s + l.qty, 0);
                return (
                  <li key={`${item.kind}:${item.id}`}>
                    <button
                      type="button"
                      disabled={!item.available}
                      onClick={() => add(item)}
                      className={`flex min-h-14 w-full items-center justify-between gap-3 border px-3 py-2 text-left ${
                        inCart ? "border-brass" : "border-line"
                      } ${item.available ? "text-fg" : "text-muted line-through opacity-60"}`}
                    >
                      <span className="text-sm">{item.name}</span>
                      <span className="shrink-0 text-sm text-muted">
                        {item.available ? money(item.price) : "Agotado"}
                        {inCart ? <span className="ml-2 bg-brass px-2 py-0.5 text-ink">{inCart}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside id="comanda" className="h-fit scroll-mt-4 border border-line p-4 lg:sticky lg:top-6">
          <h2 className="font-display text-3xl">Comanda</h2>
          <p className="mt-1 text-sm text-muted">{(service === "llevar" ? table || "Para llevar" : table) || "Sin mesa"}</p>
          {cart.length === 0 ? (
            <div className="mt-4 grid gap-3 text-sm text-muted">
              <ol className="grid gap-1">
                <li className={(service === "llevar" || table) ? "text-fg" : ""}>1. Elige la mesa {table || service === "llevar" ? "✓" : ""}</li>
                <li>2. Toca los platos o tragos de la carta</li>
                <li>3. Envía a cocina y barra</li>
              </ol>
              <a href="#carta-mesero" className={`${btn} inline-flex items-center justify-center lg:hidden`}>
                ↑ Ir a la carta
              </a>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {cart.map((line) => (
                <li key={line.key} className="grid gap-2 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">{line.name}</span>
                    <span className="text-sm text-muted">{money(line.qty * line.price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className={btn} onClick={() => bump(line.key, -1)} aria-label={`Quitar uno de ${line.name}`}>
                      −
                    </button>
                    <span className="w-6 text-center">{line.qty}</span>
                    <button type="button" className={btn} onClick={() => bump(line.key, 1)} aria-label={`Agregar uno de ${line.name}`}>
                      +
                    </button>
                    <input
                      value={line.note}
                      onChange={(e) => setCart((c) => c.map((l) => (l.key === line.key ? { ...l, note: e.target.value } : l)))}
                      placeholder="Nota: sin hielo, término…"
                      maxLength={140}
                      className="min-h-11 min-w-0 flex-1 border border-line bg-bg px-2 text-xs text-fg"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota para toda la comanda"
            maxLength={200}
            className="mt-3 min-h-11 w-full border border-line bg-bg px-3 text-sm text-fg"
          />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted">Total (ITBMS incl.)</span>
            <span className="font-display text-2xl">{money(total)}</span>
          </div>
          <button type="button" disabled={!cart.length || state === "sending"} onClick={send} className="mt-3 min-h-12 w-full bg-brass text-ink disabled:opacity-50">
            {state === "sending"
              ? "Enviando…"
              : !table.trim() && service === "mesa"
                ? "Elige la mesa"
                : !cart.length
                  ? "Agrega productos"
                  : "Enviar a cocina y barra"}
          </button>
          {message ? <p className={`mt-2 text-sm ${state === "sent" ? "text-fg" : "text-brass"}`}>{message}</p> : null}
        </aside>
      </section>

      {cart.length ? (
        // Phone: the order summary sits below a long menu, so keep a shortcut pinned to the bottom.
        <a
          href="#comanda"
          className="fixed inset-x-0 bottom-0 z-40 flex min-h-14 items-center justify-between bg-brass px-5 text-ink lg:hidden"
        >
          <span>
            Ver comanda · {cart.reduce((s, l) => s + l.qty, 0)} {cart.reduce((s, l) => s + l.qty, 0) === 1 ? "ítem" : "ítems"}
          </span>
          <span className="font-display text-2xl">{money(total)}</span>
        </a>
      ) : null}

      <section className="pb-16 lg:pb-0">
        <h2 className="font-display text-3xl">Mesas abiertas</h2>
        {open.data === null ? (
          <p className="mt-4 text-sm text-muted">Cargando…</p>
        ) : open.data.tabs.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No hay mesas abiertas.</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {open.data.tabs.map((tab) => (
              <li key={tab.table} className="border border-line p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-2xl">{tab.table}</span>
                  <span className="text-sm text-muted">
                    {money(tab.total)} · {minutesSince(tab.openedAt, now)} min
                  </span>
                </div>
                <ul className="mt-2 grid gap-2">
                  {tab.orders.map((order) => (
                    <li key={order.id} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted">{clock(order.createdAt)}</span>
                        <StationBadge label="Cocina" status={order.kitchen} />
                        <StationBadge label="Barra" status={order.bar} />
                        {order.kitchen !== "listo" && order.bar !== "listo" ? (
                          <button
                            type="button"
                            className="text-xs text-muted underline"
                            onClick={() => {
                              if (window.confirm("¿Anular esta comanda?")) {
                                void voidTicket({ data: { id: order.id } }).then(open.refresh).catch((e) => window.alert(errText(e)));
                              }
                            }}
                          >
                            Anular
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-1 text-fg/90">{order.lines.map((l) => `${l.qty}× ${l.name}`).join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StationBadge({ label, status }: { label: string; status: "pendiente" | "listo" | "na" }) {
  if (status === "na") return null;
  return (
    <span className={`px-2 py-0.5 text-[11px] uppercase ${status === "listo" ? "bg-brass text-ink" : "border border-line text-muted"}`}>
      {label} {status === "listo" ? "lista" : "en proceso"}
    </span>
  );
}

/* ───────────── kitchen / bar ticket screen ───────────── */

export function StationDesk({ station, canSwitch }: { station: "cocina" | "barra"; canSwitch: boolean }) {
  const live = useLive(() => loadTickets({ data: { station } }), 6_000);
  const now = useNow(15_000);
  const [sound, setSound] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const title = station === "cocina" ? "Cocina" : "Barra";

  const pending = (live.data ?? []).filter((t) => t.status === "pendiente");
  const ready = (live.data ?? []).filter((t) => t.status === "listo").reverse();

  useEffect(() => {
    if (!live.data) return;
    const ids = new Set(live.data.filter((t) => t.status === "pendiente").map((t) => t.id));
    if (seen.current && sound && [...ids].some((id) => !seen.current!.has(id))) beep();
    seen.current = ids;
  }, [live.data, sound]);

  function mark(ticket: StationTicket, status: "pendiente" | "listo") {
    void ticketStatus({ data: { id: ticket.id, station, status } }).then(live.refresh).catch((e) => window.alert(errText(e)));
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-5xl">{title}</h1>
        <span className="font-display text-3xl text-brass">{pending.length}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            className={sound ? btnOn : btn}
            onClick={() => {
              if (!sound) beep();
              setSound(!sound);
            }}
          >
            {sound ? "🔔 Sonido activo" : "🔕 Activar sonido"}
          </button>
          {canSwitch ? (
            <button type="button" className={showMenu ? btnOn : btn} onClick={() => setShowMenu(!showMenu)}>
              Agotados
            </button>
          ) : null}
        </div>
      </div>
      {live.error ? <p className="mt-3 text-sm text-brass">Sin conexión. Reintentando…</p> : null}
      {showMenu ? <AvailabilityPanel kind={station === "cocina" ? "plate" : "drink"} /> : null}

      {live.data === null ? (
        <p className="mt-8 text-sm text-muted">Cargando comandas…</p>
      ) : pending.length === 0 ? (
        <p className="mt-10 font-display text-4xl text-muted">Nada pendiente.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pending.map((ticket) => {
            const mins = minutesSince(ticket.createdAt, now);
            const late = mins >= 15;
            return (
              <li key={ticket.id} className={`flex flex-col border-2 bg-bg p-4 ${late ? "border-brass" : "border-line"}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-3xl">{ticket.table}</span>
                  <span className={`text-sm ${late ? "text-brass" : "text-muted"}`}>
                    {clock(ticket.createdAt)} · {mins} min
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {ticket.service === "llevar" ? "PARA LLEVAR" : "EN EL LOCAL"}
                  {ticket.waiter ? ` · ${ticket.waiter}` : ""}
                  {ticket.source === "web" ? " · PEDIDO WEB" : ""}
                </p>
                <ul className="mt-3 grid gap-2">
                  {ticket.lines.map((line, i) => (
                    <li key={i}>
                      <span className="text-xl">
                        <span className="font-semibold text-brass">{line.qty}×</span> {line.name}
                      </span>
                      {line.note ? <p className="text-sm text-brass">↳ {line.note}</p> : null}
                    </li>
                  ))}
                </ul>
                {ticket.note ? <p className="mt-2 border-l-2 border-brass pl-2 text-sm">{ticket.note}</p> : null}
                <button type="button" onClick={() => mark(ticket, "listo")} className="mt-4 min-h-14 bg-brass text-lg text-ink">
                  Listo
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {ready.length ? (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm text-muted">Listas en los últimos 45 min ({ready.length})</summary>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {ready.map((ticket) => (
              <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  {ticket.table} · {ticket.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </span>
                <button type="button" className={btn} onClick={() => mark(ticket, "pendiente")}>
                  Deshacer
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function AvailabilityPanel({ kind }: { kind: "plate" | "drink" }) {
  const menu = useLive(() => floorMenu(), 60_000);
  const [query, setQuery] = useState("");
  const items = (menu.data ?? []).filter((i) => i.kind === kind && i.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="mt-4 border border-line p-4">
      <p className="text-sm text-muted">Lo que apagues desaparece de la carta web y no se puede pedir hasta que lo vuelvas a encender.</p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar…"
        className="mt-3 min-h-11 w-full border border-line bg-bg px-3 text-sm text-fg"
      />
      <ul className="mt-3 grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() =>
                void switchItem({ data: { kind, id: item.id, available: !item.available } })
                  .then(menu.refresh)
                  .catch((e) => window.alert(errText(e)))
              }
              className={`flex min-h-11 w-full items-center justify-between border px-3 text-left text-sm ${item.available ? "border-line" : "border-brass"}`}
            >
              <span className={item.available ? "" : "text-muted line-through"}>{item.name}</span>
              <span className={item.available ? "text-muted" : "text-brass"}>{item.available ? "Disponible" : "Agotado"}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────── till (lives at the bar) ───────────── */

export function CajaDesk() {
  const live = useLive(() => loadTabs(), 8_000);
  const now = useNow();
  const [pay, setPay] = useState<Record<string, Pay>>({});
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  function chargeOrders(key: string, orders: TabOrder[], method: Pay, label: string) {
    const amount = orders.reduce((s, o) => s + o.total, 0);
    if (!window.confirm(`¿Cobrar ${money(amount)} de ${label} con ${PAY_LABEL[method]}?`)) return;
    setBusy(key);
    void charge({ data: { orderIds: orders.map((o) => o.id), pay: method } })
      .then((res) => {
        setNote(`${label}: cobrado ${money(res.total)} con ${PAY_LABEL[method]}.`);
        live.refresh();
      })
      .catch((e) => setNote(errText(e)))
      .finally(() => setBusy(""));
  }

  const web = live.data?.web ?? [];
  const tabList: Tab[] = live.data?.tabs ?? [];

  return (
    <div className="mt-8 grid gap-10">
      <div>
        <h1 className="font-display text-5xl">Caja</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">Cuentas abiertas por mesa y pedidos web por cobrar. Cobrar cierra la cuenta.</p>
        {note ? <p className="mt-3 text-sm text-brass">{note}</p> : null}
      </div>

      {web.length ? (
        <section>
          <h2 className="font-display text-3xl">Pedidos web</h2>
          <p className="mt-1 text-sm text-muted">Confirma por WhatsApp antes de aceptar: al aceptarlo pasa a cocina y barra.</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {web.map((order) => (
              <li key={order.id} className="border border-line p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-2xl">{order.service === "llevar" ? "Para llevar" : "En el local"}</span>
                  <span className="text-sm text-muted">
                    {clock(order.createdAt)} · {money(order.total)}
                  </span>
                </div>
                <p className="mt-2 text-sm">{order.lines.map((l) => `${l.qty}× ${l.name}`).join(" · ")}</p>
                <p className="mt-1 text-xs text-muted">Paga con {PAY_LABEL[order.pay]}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!order.accepted ? (
                    <button type="button" className={btnOn} onClick={() => void acceptWeb({ data: { id: order.id } }).then(live.refresh)}>
                      Aceptar y preparar
                    </button>
                  ) : (
                    <>
                      <StationBadge label="Cocina" status={order.kitchen} />
                      <StationBadge label="Barra" status={order.bar} />
                    </>
                  )}
                  <button
                    type="button"
                    className={btn}
                    disabled={busy === order.id}
                    onClick={() => chargeOrders(order.id, [order], order.pay, "Pedido web")}
                  >
                    Cobrar ({PAY_LABEL[order.pay]})
                  </button>
                  <button
                    type="button"
                    className={btn}
                    onClick={() => {
                      if (window.confirm("¿Anular este pedido web?")) void voidTicket({ data: { id: order.id } }).then(live.refresh);
                    }}
                  >
                    Anular
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-3xl">Mesas</h2>
        {live.data === null ? (
          <p className="mt-4 text-sm text-muted">{live.error ? "Sin conexión." : "Cargando…"}</p>
        ) : tabList.length === 0 ? (
          <p className="mt-4 font-display text-3xl text-muted">No hay cuentas abiertas.</p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {tabList.map((tab) => {
              const method = pay[tab.table] ?? "efectivo";
              const grouped = new Map<string, { name: string; qty: number; amount: number }>();
              for (const order of tab.orders) {
                for (const line of order.lines) {
                  const g = grouped.get(line.name) ?? { name: line.name, qty: 0, amount: 0 };
                  g.qty += line.qty;
                  g.amount += line.qty * line.price;
                  grouped.set(line.name, g);
                }
              }
              return (
                <li key={tab.table} className="border border-line p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-3xl">{tab.table}</span>
                    <span className="text-sm text-muted">
                      {minutesSince(tab.openedAt, now)} min{tab.waiters.length ? ` · ${tab.waiters.join(", ")}` : ""}
                    </span>
                  </div>
                  <ul className="mt-3 grid gap-1 text-sm">
                    {[...grouped.values()].map((g) => (
                      <li key={g.name} className="flex justify-between gap-2">
                        <span>
                          {g.qty}× {g.name}
                        </span>
                        <span className="text-muted">{money(g.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                    <span className="text-sm text-muted">{tab.pending ? "Hay comandas en preparación" : "Todo servido"}</span>
                    <span className="font-display text-3xl">{money(tab.total)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["efectivo", "tarjeta", "yappy"] as const).map((m) => (
                      <button key={m} type="button" className={method === m ? btnOn : btn} onClick={() => setPay({ ...pay, [tab.table]: m })}>
                        {PAY_LABEL[m]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={busy === tab.table}
                    onClick={() => chargeOrders(tab.table, tab.orders, method, tab.table)}
                    className="mt-3 min-h-12 w-full bg-brass text-ink disabled:opacity-50"
                  >
                    Cobrar {money(tab.total)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
