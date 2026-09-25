import { useEffect, useMemo, useRef, useState } from "react";
import { placeOrder } from "@/lib/casa";
import { clearCart, setCartQty, type CartLine } from "@/lib/cart";
import { copy, WA_NUMBER, type Lang } from "@/lib/copy";
import { drinkItbms, money, type Drink } from "@/lib/drinks";
import { FOOD_ITBMS, type Plate } from "@/lib/plates";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function CartDrawer({
  open,
  lang,
  plates,
  drinks,
  lines,
  onClose,
}: {
  open: boolean;
  lang: Lang;
  plates: Plate[];
  drinks: Drink[];
  lines: CartLine[];
  onClose: () => void;
}) {
  const t = copy[lang];
  const [service, setService] = useState<"mesa" | "llevar">("mesa");
  const [pay, setPay] = useState<"yappy" | "tarjeta" | "efectivo" | null>(null);
  const [yappyPhone, setYappyPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [phoneBad, setPhoneBad] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<"yappy" | "tarjeta" | "efectivo" | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  function close() {
    setSent(null);
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSent(null);
        closeRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const resolved = useMemo(() => {
    return lines.map((line) => {
      if (line.kind === "plate") {
        const plate = plates.find((item) => item.id === line.id);
        return {
          ...line,
          name: plate ? (lang === "es" ? plate.es : plate.en) : line.id,
          price: plate?.price ?? 0,
          rate: FOOD_ITBMS,
          available: Boolean(plate?.available),
        };
      }
      const drink = drinks.find((item) => item.id === line.id);
      return {
        ...line,
        name: drink ? (lang === "es" ? drink.es : drink.en) : line.id,
        price: drink?.price ?? 0,
        rate: drink ? drinkItbms(drink.section, drink.id) : 0.1,
        available: Boolean(drink?.available),
      };
    });
  }, [lines, plates, drinks, lang]);

  const live = resolved.filter((line) => line.available);
  const total = live.reduce((sum, line) => sum + line.qty * line.price, 0);
  const tax = live.reduce((sum, line) => {
    const gross = line.qty * line.price;
    return sum + (gross - gross / (1 + line.rate));
  }, 0);

  if (!open) return null;

  function yappyDigits(value: string) {
    return value.replace(/\D/g, "");
  }

  function send() {
    if (!live.length || !pay) return;
    const phone = yappyDigits(yappyPhone);
    if (pay === "yappy" && phone && phone.length !== 8 && !(phone.length === 11 && phone.startsWith("507"))) {
      setPhoneBad(true);
      return;
    }
    setPhoneBad(false);
    const head = lang === "es" ? "Hola, quiero pedir en La Quinta Pata." : "Hi, I'd like to order at La Quinta Pata.";
    const where = service === "mesa" ? t.cartMesa : t.cartGo;
    const payLine =
      pay === "yappy"
        ? lang === "es"
          ? `Pago: Yappy al 6755-5768. Monto ${money(round2(total))}.${phone ? ` Mi Yappy: ${phone}.` : ""}`
          : `Payment: Yappy to 6755-5768. Amount ${money(round2(total))}.${phone ? ` My Yappy: ${phone}.` : ""}`
        : pay === "tarjeta"
          ? lang === "es"
            ? "Pago: Visa o Mastercard en el datáfono."
            : "Payment: Visa or Mastercard on the terminal."
          : lang === "es"
            ? "Pago: efectivo."
            : "Payment: cash.";
    const body = live
      .map((line) => `${line.qty} × ${line.name} — ${money(round2(line.qty * line.price))}`)
      .join("\n");
    const bits = [head, where, payLine, body, `${t.cartTotal}: ${money(round2(total))} (${t.cartTax})`, note.trim()].filter(Boolean);
    const text = bits.join("\n");
    void placeOrder({
      data: {
        service,
        pay,
        lines: live.map((line) => ({ kind: line.kind, id: line.id, qty: line.qty })),
      },
    }).catch(() => undefined);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    clearCart();
    setNote("");
    setYappyPhone("");
    setSent(pay);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label={lang === "es" ? "Cerrar pedido" : "Close order"} className="absolute inset-0 bg-bg/70" onClick={close} />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-bg">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-display text-4xl italic">{t.cartTitle}</h2>
          <button type="button" onClick={close} className="min-h-11 border border-line px-4 text-sm text-muted">
            {lang === "es" ? "Cerrar" : "Close"}
          </button>
        </div>
        {sent ? (
          <div className="px-5 py-10">
            <p className="font-display text-4xl italic">{t.cartSent}</p>
            <p className="mt-4 text-sm text-muted">
              {sent === "yappy" ? t.sentYappy : sent === "tarjeta" ? t.sentCard : t.sentCash}
            </p>
            <p className="mt-3 text-sm text-muted">{t.cartSentBody}</p>
          </div>
        ) : lines.length === 0 ? (
          <div className="px-5 py-10">
            <p className="font-display text-3xl text-muted">{t.cartEmpty}</p>
            <a href="#carta" onClick={close} className="mt-8 inline-flex min-h-11 items-center bg-brass px-5 text-ink">
              {t.menu}
            </a>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <p className="px-5 pt-4 text-sm text-muted">{t.cartLead}</p>
            <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto px-5">
              {resolved.map((line) => (
                <li key={`${line.kind}:${line.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 py-4">
                  <div>
                    <p className="font-display text-2xl">{line.name}</p>
                    <p className="text-sm text-muted">
                      {line.available ? money(line.price) : t.cartGone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={lang === "es" ? "Quitar uno" : "Remove one"}
                      onClick={() => setCartQty(line.kind, line.id, line.qty - 1)}
                      className="min-h-11 min-w-11 border border-line text-fg"
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{line.qty}</span>
                    <button
                      type="button"
                      aria-label={lang === "es" ? "Sumar uno" : "Add one"}
                      onClick={() => setCartQty(line.kind, line.id, line.qty + 1)}
                      className="min-h-11 min-w-11 border border-line text-fg"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="max-h-[58%] overflow-y-auto border-t border-line px-5 py-5">
              <div className="flex gap-2">
                {(["mesa", "llevar"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setService(mode)}
                    className={
                      service === mode
                        ? "min-h-11 flex-1 bg-brass text-ink"
                        : "min-h-11 flex-1 border border-line text-muted"
                    }
                  >
                    {mode === "mesa" ? t.cartMesa : t.cartGo}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs tracking-[0.28em] text-brass uppercase">{t.payHow}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    ["yappy", t.payYappy],
                    ["tarjeta", t.payCard],
                    ["efectivo", t.payCash],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPay(mode)}
                    className={
                      pay === mode ? "min-h-11 bg-brass text-sm text-ink" : "min-h-11 border border-line text-sm text-muted"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              {pay === "yappy" ? (
                <div className="mt-3 border border-line p-3">
                  <p className="text-sm text-muted">{t.yappyLead}</p>
                  <p className="mt-2 font-display text-3xl text-brass">{money(round2(total))}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText("67555768").then(() => {
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1600);
                      });
                    }}
                    className="mt-3 min-h-11 border border-brass px-3 text-sm text-brass"
                  >
                    {copied ? t.yappyCopied : t.yappyCopy}
                  </button>
                  <label className="mt-3 grid gap-2 text-sm text-muted">
                    {t.yappyPhone}
                    <input
                      inputMode="tel"
                      autoComplete="tel"
                      value={yappyPhone}
                      placeholder={t.yappyPhonePh}
                      onChange={(event) => {
                        setYappyPhone(event.target.value);
                        setPhoneBad(false);
                      }}
                      className="min-h-11 border border-line bg-bg px-3 text-fg"
                    />
                    <span>{t.yappyPhoneHint}</span>
                    {phoneBad ? <span className="text-brass">{t.yappyPhoneBad}</span> : null}
                  </label>
                </div>
              ) : null}
              {pay === "tarjeta" ? <p className="mt-3 text-sm text-muted">{t.cardLead}</p> : null}
              {pay === "efectivo" ? <p className="mt-3 text-sm text-muted">{t.cashLead}</p> : null}
              <label className="mt-4 grid gap-2 text-sm text-muted">
                {t.cartNote}
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t.cartNotePh}
                  rows={2}
                  className="min-h-11 border border-line bg-bg px-3 py-2 text-fg"
                />
              </label>
              <div className="mt-4 flex items-baseline justify-between text-sm text-muted">
                <span>{t.cartTax}</span>
                <span>{money(round2(tax))}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-3xl">{t.cartTotal}</span>
                <span className="font-display text-3xl text-brass">{money(round2(total))}</span>
              </div>
              {!pay ? <p className="mt-3 text-sm text-brass">{t.payNeed}</p> : null}
              <button
                type="button"
                disabled={!live.length || !pay}
                onClick={send}
                className="mt-5 flex min-h-11 w-full items-center justify-center bg-brass text-ink disabled:opacity-40"
              >
                {pay === "yappy"
                  ? lang === "es"
                    ? "Avisar el Yappy"
                    : "Send the Yappy"
                  : pay === "tarjeta"
                    ? lang === "es"
                      ? "Pagar con tarjeta"
                      : "Pay by card"
                    : pay === "efectivo"
                      ? lang === "es"
                        ? "Pagar en efectivo"
                        : "Pay cash"
                      : t.cartSend}
                {pay ? ` · ${money(round2(total))}` : ""}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
