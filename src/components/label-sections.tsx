import type { ReactNode } from "react";
import { venue } from "@/venue";
import type { Copy } from "@/venues/types";
import type { Lang } from "@/lib/copy";
import { DRINK_SECTIONS, sectionLabel, money, type Drink } from "@/lib/drinks";
import { PLATE_SECTIONS, type Plate } from "@/lib/plates";

/**
 * "Label" layout: a craft-beer-label look (double gold frame with corner
 * diamonds, family band, ABV/IBU meters). Used by venues with
 * `layout.style: "label"`; the classic layout in site.tsx is untouched.
 */

export type IconName = "paw" | "parking" | "clock" | "music";

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "shrink-0 text-brass",
  };
  if (name === "paw")
    return (
      <svg {...common}>
        <circle cx="7" cy="9" r="2" />
        <circle cx="12" cy="6" r="2" />
        <circle cx="17" cy="9" r="2" />
        <path d="M8.5 16.5c0-2.2 1.6-4 3.5-4s3.5 1.8 3.5 4c0 1.4-1.1 2.5-2.5 2.5h-2c-1.4 0-2.5-1.1-2.5-2.5z" />
      </svg>
    );
  if (name === "parking")
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 17V7h3.5a2.5 2.5 0 0 1 0 5H9" />
      </svg>
    );
  if (name === "music")
    return (
      <svg {...common}>
        <path d="M9 18V5l11-2v13" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="17.5" cy="16" r="2.5" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/** Double gold rule with a diamond on each corner. Off: renders children as they are. */
export function Frame({ on = true, children, inner = "" }: { on?: boolean; children: ReactNode; inner?: string }) {
  if (!on) return <>{children}</>;
  const diamond = "absolute h-2.5 w-2.5 rotate-45 bg-brass";
  return (
    <div className="relative border border-brass p-2.5">
      <span aria-hidden="true" className={`${diamond} -top-1.5 -left-1.5`} />
      <span aria-hidden="true" className={`${diamond} -top-1.5 -right-1.5`} />
      <span aria-hidden="true" className={`${diamond} -bottom-1.5 -left-1.5`} />
      <span aria-hidden="true" className={`${diamond} -right-1.5 -bottom-1.5`} />
      <div className={`border border-line ${inner}`}>{children}</div>
    </div>
  );
}

const eyebrow = "font-label text-sm tracking-[0.32em] text-brass uppercase";
const ctaSolid =
  "font-label inline-flex min-h-13 items-center justify-center bg-brass px-7 text-lg tracking-[0.12em] text-ink uppercase";
const ctaLine =
  "font-label inline-flex min-h-13 items-center justify-center border border-fg/70 px-7 text-lg tracking-[0.12em] text-fg uppercase";

function familyParts(label: string) {
  const [name, ...rest] = label.split(" · ");
  const sub = rest.join(" · ");
  return { name, sub: sub ? sub[0].toUpperCase() + sub.slice(1) : "" };
}

export function LabelHero({ t, lang, beerCount }: { t: Copy; lang: Lang; beerCount: number }) {
  const { media, layout } = venue;
  return (
    <section id="inicio" className="scroll-mt-20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-16 gap-y-14 px-5 pt-14 pb-24 md:pt-20">
        <div className="min-w-0 flex-[1_1_440px]">
          <p className={eyebrow}>{t.kicker}</p>
          <h1 className="mt-5 font-display text-6xl leading-[0.95] font-bold md:text-[84px]">{t.heroLine}</h1>
          <p className="mt-7 max-w-md text-lg text-fg/80">{t.heroSub}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#reservar" className={ctaSolid}>
              {t.reserve}
            </a>
            <a href={venue.layout.drinksFirst ? "#barra" : "#carta"} className={ctaLine}>
              {t.menu}
            </a>
          </div>
          {layout.highlights?.length ? (
            <ul className="mt-11 flex flex-wrap gap-x-7 gap-y-3 text-[15px] text-fg/80">
              {layout.highlights.map((h) => (
                <li key={h.es} className="inline-flex items-center gap-2.5">
                  <Icon name={h.icon} />
                  {h[lang]}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative min-w-0 flex-[1_1_380px]">
          <Frame>
            <img
              src={media.hero.src}
              alt={media.hero.alt}
              width={1400}
              height={933}
              fetchPriority="high"
              decoding="async"
              className="block h-[420px] w-full object-cover md:h-[540px]"
            />
          </Frame>
          {layout.seal && beerCount > 0 ? (
            <div className="absolute -bottom-8 left-3 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-brass text-center text-ink shadow-[0_0_0_6px_var(--color-bg)] md:-left-9 md:h-36 md:w-36">
              <span className="font-display text-4xl leading-none font-bold md:text-5xl">{beerCount}</span>
              <span className="font-label mt-1 px-3 text-xs leading-tight tracking-[0.1em] uppercase md:text-sm">{layout.seal[lang]}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function TapBand({ lang, drinks }: { lang: Lang; drinks: Drink[] }) {
  const names = DRINK_SECTIONS.filter((s) => drinks.some((d) => d.section === s && d.available)).map(
    (s) => familyParts(sectionLabel[s][lang]).name,
  );
  if (!names.length) return null;
  return (
    <div className="bg-brass text-ink">
      <p className="font-label mx-auto flex max-w-6xl flex-wrap justify-center gap-x-7 gap-y-2 px-5 py-4 text-[17px] tracking-[0.2em] uppercase">
        {names.map((n, i) => (
          <span key={n} className="inline-flex items-center gap-7">
            {i > 0 ? <span aria-hidden="true">✦</span> : null}
            {n}
          </span>
        ))}
      </p>
    </div>
  );
}

function Meter({ ibu, label }: { ibu: number | null | undefined; label: string }) {
  const on = ibu == null ? 0 : Math.min(5, Math.max(1, Math.round(ibu / 16)));
  return (
    <span role="img" aria-label={label} className="flex gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`h-1.5 w-3.5 ${i < on ? "bg-brass" : "bg-line"}`} />
      ))}
    </span>
  );
}

export function LabelBeers({
  t,
  lang,
  drinks,
  qtyOf,
  onAdd,
}: {
  t: Copy;
  lang: Lang;
  drinks: Drink[];
  qtyOf: (id: string) => number;
  onAdd: (id: string) => void;
}) {
  const bitter = lang === "es" ? "Amargor" : "Bitterness";
  return (
    <section id="barra" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-2xl">
          <p className={eyebrow}>{t.barEyebrow}</p>
          <h2 className="mt-4 font-display text-5xl leading-none font-bold md:text-6xl">{t.barTitle}</h2>
          <p className="mt-5 text-fg/80">{t.barLead}</p>
        </div>
        <p className="font-label flex items-center gap-3 text-sm tracking-[0.12em] text-muted uppercase">
          {bitter}
          <Meter ibu={32} label={bitter} />
        </p>
      </div>
      <div className="mt-14 grid gap-x-16 gap-y-14 md:grid-cols-2">
        {DRINK_SECTIONS.map((section) => {
          const items = drinks.filter((d) => d.section === section && d.available);
          if (!items.length) return null;
          const { name, sub } = familyParts(sectionLabel[section][lang]);
          return (
            <article key={section} className="border-t-2 border-brass pt-5">
              <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                <h3 className="font-label text-[28px] tracking-[0.08em] text-brass uppercase">{name}</h3>
                {sub ? <span className="text-[15px] text-muted">{sub}</span> : null}
              </div>
              <ul className="mt-2">
                {items.map((d) => {
                  const nameText = lang === "es" ? d.es : d.en;
                  const ibuText = d.ibu == null ? "— IBU" : `${d.ibu} IBU`;
                  const style = d.style?.[lang] ?? d.note?.[lang] ?? "";
                  return (
                    <li key={d.id} className="flex items-center gap-4 border-b border-line py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[22px] leading-tight font-bold">{nameText}</p>
                        {style ? <p className="mt-0.5 text-[15px] text-muted">{style}</p> : null}
                        {d.abv != null ? (
                          <p className="font-label mt-2 flex items-center gap-2.5 text-[15px] tracking-[0.05em] sm:hidden">
                            {d.abv.toFixed(1)}% · {ibuText}
                            <Meter ibu={d.ibu} label={`${bitter} ${ibuText}`} />
                          </p>
                        ) : null}
                      </div>
                      {d.abv != null ? (
                        <div className="hidden flex-col items-end gap-2 sm:flex">
                          <span className="font-label text-base tracking-[0.06em]">
                            {d.abv.toFixed(1)}% · {ibuText}
                          </span>
                          <Meter ibu={d.ibu} label={`${bitter} ${ibuText}`} />
                        </div>
                      ) : null}
                      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:w-24 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                        <span className="font-label text-[17px] text-brass">{money(d.price)}</span>
                        <button
                          type="button"
                          aria-label={`${t.cartAdd} ${nameText}`}
                          onClick={() => onAdd(d.id)}
                          className="min-h-11 min-w-11 border border-line text-brass"
                        >
                          {qtyOf(d.id) || "+"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function LabelFood({
  t,
  lang,
  plates,
  qtyOf,
  onAdd,
}: {
  t: Copy;
  lang: Lang;
  plates: Plate[];
  qtyOf: (id: string) => number;
  onAdd: (id: string) => void;
}) {
  const items = PLATE_SECTIONS.flatMap((s) => plates.filter((p) => p.section === s && p.available));
  if (!items.length) return null;
  return (
    <section id="carta" className="scroll-mt-20 border-y border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-16 gap-y-10 px-5 py-24">
        <div className="min-w-0 flex-[1_1_360px]">
          <p className={eyebrow}>{t.cartaEyebrow}</p>
          <h2 className="mt-4 font-display text-5xl leading-none font-bold md:text-[56px]">{t.cartaTitle}</h2>
          <p className="mt-5 max-w-md text-[15px] text-muted">{t.cartaNote}</p>
        </div>
        <ul className="min-w-0 flex-[1_1_420px]">
          {items.map((p) => {
            const name = lang === "es" ? p.es : p.en;
            return (
              <li key={p.id} className="flex items-center gap-4 border-b border-line py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-bold">{name}</p>
                  <p className="text-[15px] text-muted">{lang === "es" ? p.portionEs : p.portionEn}</p>
                </div>
                <span className="font-label text-[17px] text-brass">{money(p.price)}</span>
                <button
                  type="button"
                  aria-label={`${t.cartAdd} ${name}`}
                  onClick={() => onAdd(p.id)}
                  className="min-h-11 min-w-11 border border-line text-brass"
                >
                  {qtyOf(p.id) || "+"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function LabelEvents({ t }: { t: Copy }) {
  const icons = venue.layout.eventIcons ?? [];
  return (
    <section id="noches" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <p className={eyebrow}>{t.nightsEyebrow}</p>
      <h2 className="mt-4 max-w-3xl font-display text-5xl leading-none font-bold md:text-[56px]">{t.nightsTitle}</h2>
      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {t.nights.map((n, i) => (
          <li key={n.title} className="flex flex-col gap-3.5 border border-line p-8">
            {icons[i] ? <Icon name={icons[i]} size={36} /> : null}
            <h3 className="font-display text-[26px] font-bold">{n.title}</h3>
            <p className="text-fg/80">{n.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
