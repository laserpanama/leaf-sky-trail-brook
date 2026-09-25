import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale/es";
import { enUS } from "date-fns/locale/en-US";
import { format, parseISO, startOfToday } from "date-fns";
import "react-day-picker/style.css";
import { WA_BASE, WA_NUMBER, copy, type Lang } from "@/lib/copy";
import { placeHold, publicMenu } from "@/lib/casa";
import { addToCart, cartLines, hydrateCart, type CartLine } from "@/lib/cart";
import { CartDrawer } from "@/components/cart-drawer";
import { SLOT_TIMES } from "@/lib/slots";
import { listDrinks, DRINK_SECTIONS, replaceDrinkOverrides, sectionLabel, money, type Drink } from "@/lib/drinks";
import { listPlates, PLATE_SECTIONS, plateLabel, replacePlateOverrides, type Plate } from "@/lib/plates";

const MAP =
  "https://www.openstreetmap.org/export/embed.html?bbox=-79.508%2C8.987%2C-79.496%2C8.995&layer=mapnik&marker=8.9912661%2C-79.5020383";

function waLink(extra?: string) {
  const text = extra ? `${WA_BASE} ${extra}` : WA_BASE;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function Site() {
  const [lang, setLang] = useState<Lang>("es");
  const t = copy[lang];
  const [held, setHeld] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "sending" | "saved" | "error" | "wait" | "bad">("idle");
  const [form, setForm] = useState({ date: "", time: "", party: "2", name: "", phone: "", notes: "", website: "" });

  useEffect(() => {
    const saved = window.localStorage.getItem("lqp-lang");
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);

  function choose(code: Lang) {
    setLang(code);
    document.documentElement.lang = code;
    window.localStorage.setItem("lqp-lang", code);
  }

  const [drinks, setDrinks] = useState<Drink[]>(() => listDrinks());
  const [plates, setPlates] = useState<Plate[]>(() => listPlates());
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    hydrateCart();
    setCart(cartLines());
    function sync() {
      setCart(cartLines());
    }
    window.addEventListener("lqp-cart", sync);
    return () => window.removeEventListener("lqp-cart", sync);
  }, []);

  useEffect(() => {
    let alive = true;
    void publicMenu()
      .then((menu) => {
        if (!alive) return;
        replacePlateOverrides(menu.plates);
        replaceDrinkOverrides(menu.drinks);
        setDrinks(listDrinks());
        setPlates(listPlates());
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const message = useMemo(() => {
    const bits = [
      form.name.trim() && `${lang === "es" ? "Nombre" : "Name"}: ${form.name.trim()}`,
      form.date && `${lang === "es" ? "Fecha" : "Date"}: ${form.date}`,
      form.time && `${lang === "es" ? "Hora" : "Time"}: ${form.time}`,
      form.party && `${lang === "es" ? "Personas" : "Party"}: ${form.party}`,
      form.notes && form.notes.trim(),
    ].filter(Boolean);
    return bits.join(". ");
  }, [form, lang]);

  const count = cart.reduce((sum, line) => sum + line.qty, 0);

  function qtyOf(kind: "plate" | "drink", id: string) {
    return cart.find((line) => line.kind === kind && line.id === id)?.qty ?? 0;
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: "La Quinta Pata",
            servesCuisine: "Gastrobar",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Av. 5ta Sur",
              addressLocality: "San Francisco",
              addressRegion: "Panamá",
              addressCountry: "PA",
            },
            telephone: "+50767555768",
            sameAs: "https://www.instagram.com/laquintapata_pty/",
            currenciesAccepted: "USD",
            paymentAccepted: "Cash, Visa, Mastercard, Yappy",
          }),
        }}
      />
      <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-8 px-5">
          <a href="#inicio" className="font-display text-base tracking-[0.14em] text-fg uppercase sm:text-xl sm:tracking-[0.22em]">
            La Quinta Pata
          </a>
          <nav className="hidden flex-1 items-center gap-6 md:flex">
            {t.nav.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="text-sm text-muted hover:text-fg">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="min-h-11 border border-line px-3 text-sm text-fg"
            >
              {t.cart}
              {count > 0 ? ` · ${count}` : ""}
            </button>
            <div className="flex border border-line text-xs tracking-widest">
              {(["es", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => choose(code)}
                  className={
                    lang === code
                      ? "min-h-11 bg-brass px-3 text-ink"
                      : "min-h-11 px-3 text-muted"
                  }
                  aria-pressed={lang === code}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <a
              href="#reservar"
              className="hidden min-h-11 items-center bg-brass px-4 text-sm text-ink md:inline-flex"
            >
              {t.reserve}
            </a>
          </div>
        </div>
      </header>

      <main className="pb-24 md:pb-0">
        <section id="inicio" className="relative min-h-screen overflow-hidden">
          <img
            src="/media/hero.webp"
            alt="Brasa en la parrilla de La Quinta Pata"
            width={1400}
            height={933}
            fetchPriority="high"
            decoding="async"
            className="hero-still absolute inset-0 h-full w-full object-cover"
          />
          <div className="vignette absolute inset-0" />
          <div className="grain absolute inset-0" />
          <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-5 pt-32 pb-36 md:pb-24">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-bg via-bg/80 to-transparent" />
            <div className="relative">
            <p className="text-xs tracking-[0.32em] text-brass uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:tracking-[0.42em]">{t.kicker}</p>
            <h1 className="mt-6 max-w-5xl font-display text-7xl leading-[0.88] font-medium text-fg italic drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)] md:text-8xl">
              {t.heroLine}
            </h1>
            <p className="mt-8 max-w-sm text-lg text-fg/90">{t.heroSub}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#reservar" className="inline-flex min-h-11 items-center bg-brass px-5 text-ink">
                {t.reserve}
              </a>
              <a
                href="#carta"
                className="inline-flex min-h-11 items-center border border-fg/40 px-5 text-fg"
              >
                {t.menu}
              </a>
            </div>
            </div>
          </div>
        </section>

        <section id="carta" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs tracking-[0.42em] text-brass uppercase">{t.cartaEyebrow}</p>
            <h2 className="mt-4 max-w-3xl font-display text-6xl leading-[0.92] italic md:text-7xl">{t.cartaTitle}</h2>
            <p className="mt-6 max-w-md text-sm text-muted">{t.cartaNote}</p>
          </div>
          {PLATE_SECTIONS.map((section) => {
            const items = plates.filter((plate) => plate.section === section && plate.available && plate.img);
            if (!items.length) return null;
            return (
              <div key={section} className="mx-auto mt-20 max-w-6xl px-5">
                <h3 className="font-display text-4xl italic md:text-5xl">{plateLabel[section][lang]}</h3>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {items.map((plate, index) => (
                    <PlateStill
                      key={plate.id}
                      plate={plate}
                      lang={lang}
                      lead={index === 0}
                      qty={qtyOf("plate", plate.id)}
                      addLabel={t.cartAdd}
                      onAdd={() => addToCart("plate", plate.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section id="barra" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl items-stretch md:grid-cols-2">
            <figure className="frame min-h-96">
              <img src="/media/bar.webp" alt="La barra, de noche" width={1100} height={733} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </figure>
            <div className="flex flex-col justify-center px-5 py-20 md:px-14">
              <p className="text-xs tracking-[0.42em] text-brass uppercase">{t.barEyebrow}</p>
              <h2 className="mt-4 font-display text-6xl leading-[0.92] italic">{t.barTitle}</h2>
              <p className="mt-5 text-muted">{t.barLead}</p>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-5 pb-16">
            {DRINK_SECTIONS.map((section) => {
              const items = drinks.filter((drink) => drink.section === section && drink.available);
              if (!items.length) return null;
              return (
                <div key={section} className="mt-10">
                  <h3 className="font-display text-3xl italic">{sectionLabel[section][lang]}</h3>
                  <ul className="mt-6 columns-1 gap-x-16 md:columns-2">
                    {items.map((drink) => (
                      <li key={drink.id} className="flex items-center gap-3 py-2 break-inside-avoid">
                        <span className="font-display text-2xl">{lang === "es" ? drink.es : drink.en}</span>
                        <span className="leader mb-1 min-w-6 flex-1" />
                        <span className="text-brass">{money(drink.price)}</span>
                        <button
                          type="button"
                          aria-label={`${t.cartAdd} ${lang === "es" ? drink.es : drink.en}`}
                          onClick={() => addToCart("drink", drink.id)}
                          className="min-h-11 min-w-11 border border-line text-brass"
                        >
                          {qtyOf("drink", drink.id) || "+"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section id="noches" className="relative scroll-mt-20 min-h-[88vh]">
          <img src="/media/match.webp" alt="El salón con el partido en las pantallas" width={1100} height={733} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          <div className="vignette absolute inset-0" />
          <div className="grain absolute inset-0" />
          <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 py-20">
            <p className="text-xs tracking-[0.42em] text-brass uppercase">{t.nightsEyebrow}</p>
            <h2 className="mt-4 max-w-xl font-display text-6xl leading-[0.92] italic">{t.nightsTitle}</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
              <figure className="frame hidden md:block">
                <img src="/media/stage.webp" alt="Tarima para música en vivo" width={1100} height={400} loading="lazy" decoding="async" className="h-56 w-full object-cover" />
              </figure>
              <ul className="grid gap-6">
                {t.nights.map((n) => (
                  <li key={n.title}>
                    <p className="font-display text-3xl">{n.title}</p>
                    <p className="mt-1 max-w-md text-sm text-fg/80">{n.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="reservar" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
            <div>
              <p className="text-xs tracking-[0.28em] text-brass uppercase">{t.reserveEyebrow}</p>
              <h2 className="mt-3 font-display text-5xl leading-tight italic">{t.reserveTitle}</h2>
              <p className="mt-5 text-muted">{t.reserveLead}</p>
              <a
                href={waLink(message)}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex min-h-11 items-center bg-brass px-5 text-ink"
              >
                {t.wa} · 6755-5768
              </a>
            </div>
            {held ? (
              <div className="border border-line bg-bg p-8">
                <p className="font-display text-4xl leading-tight">{t.holdTitle}</p>
                <p className="mt-4 text-muted">{t.holdBody}</p>
                {saveState === "sending" ? <p className="mt-4 text-sm text-muted">{t.sending}</p> : null}
                {saveState === "error" || saveState === "wait" || saveState === "bad" ? (
                  <p role="alert" className="mt-4 text-sm text-brass">
                    {saveState === "wait" ? t.saveWait : saveState === "bad" ? t.saveBad : t.saveError}
                  </p>
                ) : null}
                {saveState === "bad" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHeld(false);
                      setSaveState("idle");
                    }}
                    className="mt-4 block text-sm text-brass underline"
                  >
                    {lang === "es" ? "Corregir datos" : "Fix details"}
                  </button>
                ) : null}
                <a
                  href={waLink(message)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex min-h-11 items-center border border-brass px-5 text-brass"
                >
                  {t.wa}
                </a>
              </div>
            ) : (
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.date || !form.time || saveState === "sending") return;
                  // Open WhatsApp synchronously (inside the click) so mobile browsers don't block it.
                  window.open(waLink(message), "_blank", "noopener,noreferrer");
                  setHeld(true);
                  setSaveState("sending");
                  placeHold({
                    data: {
                      date: form.date,
                      time: form.time,
                      party: Number(form.party),
                      name: form.name,
                      phone: form.phone,
                      notes: form.notes,
                      website: form.website,
                    },
                  })
                    .then(() => setSaveState("saved"))
                    .catch((err: unknown) => {
                      const msg = err instanceof Error ? err.message : "";
                      setSaveState(
                        msg.includes("espera")
                          ? "wait"
                          : /nombre|telefono|fecha|hora|personas/.test(msg)
                            ? "bad"
                            : "error",
                      );
                    });
                }}
              >
                <label className="grid gap-2 text-sm text-muted">
                  {t.date}
                  <ReserveCalendar
                    lang={lang}
                    value={form.date}
                    onChange={(date) => setForm({ ...form, date, time: "" })}
                  />
                </label>
                <div className="grid gap-4">
                  <SlotPicker
                    lang={lang}
                    date={form.date}
                    time={form.time}
                    label={t.time}
                    onChange={(time) => setForm({ ...form, time })}
                  />
                  <label className="grid gap-2 text-sm text-muted">
                    {t.party}
                    <input
                      required
                      min={1}
                      max={20}
                      type="number"
                      value={form.party}
                      onChange={(e) => setForm({ ...form, party: e.target.value })}
                      className="min-h-11 border border-line bg-bg px-3 text-fg"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-muted">
                    {t.guestName}
                    <input
                      required
                      minLength={2}
                      maxLength={60}
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="min-h-11 border border-line bg-bg px-3 text-fg"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-muted">
                    {t.guestPhone}
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      pattern="[+0-9 ()-]{7,20}"
                      placeholder={t.phonePh}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="min-h-11 border border-line bg-bg px-3 text-fg"
                    />
                  </label>
                </div>
                {/* Honeypot: hidden from people and screen readers; bots fill it. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label>
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm text-muted">
                  {t.notes}
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={form.notes}
                    placeholder={t.notesPh}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="border border-line bg-bg px-3 py-3 text-fg"
                  />
                </label>
                <button type="submit" className="min-h-11 bg-brass text-ink">
                  {t.send}
                </button>
              </form>
            )}
          </div>
        </section>

        <section id="nosotros" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-28">
          <p className="text-xs tracking-[0.42em] text-brass uppercase">{t.aboutEyebrow}</p>
          {t.about.map((p) => (
            <p key={p} className="mt-8 font-display text-4xl leading-snug text-fg italic">
              {p}
            </p>
          ))}
        </section>

        <section id="visita" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-2">
            <div>
              <p className="text-xs tracking-[0.28em] text-brass uppercase">{t.visitEyebrow}</p>
              <h2 className="mt-3 font-display text-5xl leading-tight">{t.visitTitle}</h2>
              <p className="mt-5 text-fg">{t.address}</p>
              <p className="mt-2 text-sm text-muted">{t.mapNote}</p>
              <p className="mt-6 text-sm">{t.pay}</p>
              <p className="mt-1 text-sm text-muted">{t.amenities}</p>
              <a
                className="mt-6 inline-flex text-brass"
                href="https://www.instagram.com/laquintapata_pty/"
                target="_blank"
                rel="noreferrer"
              >
                {t.ig}
              </a>
            </div>
            <iframe
              title="Av. 5ta Sur, San Francisco, Panamá"
              src={MAP}
              className="h-80 w-full border border-line grayscale"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-muted">
          <p className="text-fg">Av. 5ta Sur, San Francisco · 6755-5768 · @laquintapata_pty · Yappy</p>
          <p>{t.legal}</p>
          <p>{t.legal2}</p>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-bg md:hidden">
        <a href="#reservar" className="flex min-h-14 items-center justify-center text-fg">
          {t.reserve}
        </a>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex min-h-14 items-center justify-center bg-brass text-ink"
        >
          {t.cart}
          {count > 0 ? ` · ${count}` : ""}
        </button>
      </div>
      <CartDrawer
        open={cartOpen}
        lang={lang}
        plates={plates}
        drinks={drinks}
        lines={cart}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
}

function PlateStill({
  plate,
  lang,
  lead,
  qty,
  addLabel,
  onAdd,
}: {
  plate: Plate;
  lang: Lang;
  lead?: boolean;
  qty: number;
  addLabel: string;
  onAdd: () => void;
}) {
  const name = lang === "es" ? plate.es : plate.en;
  const portion = lang === "es" ? plate.portionEs : plate.portionEn;
  return (
    <article className={lead ? "md:col-span-2" : ""}>
      <figure className={`frame relative ${lead ? "h-[70vh] min-h-96" : "h-80"}`}>
        <img
          src={plate.img ?? ""}
          alt={name}
          width={lead ? 1400 : 900}
          height={lead ? 900 : 640}
          loading={lead ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="still-fade absolute inset-0" />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 py-5">
          <div>
            <h4 className={`font-display leading-none italic ${lead ? "text-5xl md:text-6xl" : "text-3xl"}`}>{name}</h4>
            <p className="mt-2 max-w-md text-sm text-fg/75">{portion}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="font-display text-2xl text-brass">{money(plate.price)}</span>
            <button type="button" onClick={onAdd} className="min-h-11 border border-brass bg-bg/80 px-3 text-sm text-brass">
              {qty > 0 ? `${addLabel} · ${qty}` : addLabel}
            </button>
          </div>
        </figcaption>
      </figure>
    </article>
  );
}

function SlotPicker({
  lang,
  date,
  time,
  label,
  onChange,
}: {
  lang: Lang;
  date: string;
  time: string;
  label: string;
  onChange: (time: string) => void;
}) {
  const t = copy[lang];

  return (
    <fieldset className="grid gap-2 border-0 p-0 text-sm text-muted">
      <legend>{label}</legend>
      <p>{t.slotsLead}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {SLOT_TIMES.map((slot) => {
          const on = time === slot;
          return (
            <button
              key={slot}
              type="button"
              disabled={!date}
              aria-pressed={on}
              onClick={() => onChange(slot)}
              className={
                on
                  ? "min-h-11 bg-brass text-ink disabled:opacity-40"
                  : "min-h-11 border border-line text-fg disabled:text-line"
              }
            >
              {slot}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ReserveCalendar({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: string;
  onChange: (iso: string) => void;
}) {
  const locale = lang === "es" ? es : enUS;
  const selected = value ? parseISO(value) : undefined;
  const label = selected
    ? format(selected, "d MMMM yyyy", { locale })
    : lang === "es"
      ? "Elige un día"
      : "Pick a day";

  return (
    <div className="lqp-cal border border-line bg-bg p-3">
      <p className="px-2 pb-2 font-display text-2xl text-fg">{label}</p>
      <DayPicker
        mode="single"
        required
        locale={locale}
        weekStartsOn={1}
        selected={selected}
        onSelect={(day) => {
          if (day) onChange(format(day, "yyyy-MM-dd"));
        }}
        disabled={{ before: startOfToday() }}
        defaultMonth={selected ?? startOfToday()}
      />
    </div>
  );
}
