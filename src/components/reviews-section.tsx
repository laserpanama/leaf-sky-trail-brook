import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/copy";
import { listReviews, sendReview, SOURCE_NAME, type PublicReview, type ReviewSource, type SourceSummary } from "@/lib/reviews";
import { reviewsCopy } from "@/lib/reviews-copy";
import { StarPicker, Stars } from "@/components/stars";

const PAGE = 6;

function when(isoDate: string, lang: Lang) {
  try {
    return new Intl.DateTimeFormat(lang === "es" ? "es-PA" : "en-US", {
      timeZone: "America/Panama",
      month: "short",
      year: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return "";
  }
}

function ReviewCard({ review, lang }: { review: PublicReview; lang: Lang }) {
  const t = reviewsCopy[lang];
  const [open, setOpen] = useState(false);
  const long = review.body.length > 280;
  const label = review.source === "site" ? null : SOURCE_NAME[review.source];
  return (
    <article className="flex flex-col gap-3 border border-line bg-bg p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {review.authorPhoto ? (
            <img
              src={review.authorPhoto}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface font-display text-lg text-brass">
              {review.author.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm text-fg">
              {review.authorUrl ? (
                <a href={review.authorUrl} target="_blank" rel="noreferrer nofollow" className="hover:text-brass">
                  {review.author}
                </a>
              ) : (
                review.author
              )}
            </p>
            <p className="text-xs text-muted">{when(review.postedAt, lang)}</p>
          </div>
        </div>
        {label ? (
          <span className="shrink-0 border border-line px-2 py-1 text-[11px] tracking-wider text-muted uppercase">
            {review.verified ? t.verified : label}
          </span>
        ) : null}
      </header>
      <Stars value={review.rating} label={t.starLabel(review.rating)} />
      {review.body ? (
        <p className={`whitespace-pre-line text-sm leading-relaxed text-fg/90 ${!open && long ? "line-clamp-5" : ""}`}>{review.body}</p>
      ) : null}
      {long ? (
        <button type="button" onClick={() => setOpen(!open)} className="self-start text-xs text-brass">
          {open ? t.less : t.more}
        </button>
      ) : null}
      {review.reply ? (
        <div className="border-l-2 border-brass/60 pl-3">
          <p className="text-xs tracking-wider text-brass uppercase">{t.reply}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted">{review.reply}</p>
        </div>
      ) : null}
      {review.url && label && !review.verified ? (
        <a href={review.url} target="_blank" rel="noreferrer nofollow" className="mt-auto text-xs text-muted hover:text-brass">
          {t.readMore} {label} ↗
        </a>
      ) : null}
    </article>
  );
}

function SourceBadge({ s, lang }: { s: SourceSummary; lang: Lang }) {
  const t = reviewsCopy[lang];
  if (s.rating === null) return null;
  const inner = (
    <>
      <span className="font-display text-3xl text-fg">{s.rating.toFixed(1)}</span>
      <span className="grid gap-0.5">
        <Stars value={s.rating} size="text-sm" label={t.starLabel(s.rating)} />
        <span className="text-xs text-muted">
          {s.total ?? 0} {t.reviewsWord} {s.source === "site" ? t.onSite : `${t.onPlatform} ${SOURCE_NAME[s.source]}`}
        </span>
      </span>
    </>
  );
  return s.url ? (
    <a href={s.url} target="_blank" rel="noreferrer nofollow" className="flex items-center gap-3 border border-line px-4 py-3 hover:border-brass">
      {inner}
    </a>
  ) : (
    <div className="flex items-center gap-3 border border-line px-4 py-3">{inner}</div>
  );
}

export function ReviewsSection({ lang, plain = false }: { lang: Lang; plain?: boolean }) {
  const t = reviewsCopy[lang];
  const [data, setData] = useState<{ reviews: PublicReview[]; sources: SourceSummary[]; googleWriteUrl: string | null } | null>(null);
  const [filter, setFilter] = useState<ReviewSource | "todas">("todas");
  const [shown, setShown] = useState(PAGE);
  const [form, setForm] = useState({ rating: 0, name: "", body: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "pendiente" | "publicada" | "wait" | "bad" | "error">("idle");

  function load() {
    void listReviews()
      .then(setData)
      .catch(() => setData({ reviews: [], sources: [], googleWriteUrl: null }));
  }
  useEffect(load, []);

  const present = useMemo(() => {
    const set = new Set<ReviewSource>();
    for (const r of data?.reviews ?? []) set.add(r.source === "visita" ? "site" : r.source);
    return [...set];
  }, [data]);

  const list = useMemo(
    () =>
      (data?.reviews ?? []).filter(
        (r) => filter === "todas" || r.source === filter || (filter === "site" && r.source === "visita"),
      ),
    [data, filter],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating < 1 || form.name.trim().length < 2 || form.body.trim().length < 10) {
      setState("bad");
      return;
    }
    setState("sending");
    void sendReview({ data: { ...form, lang } })
      .then((res) => {
        setState(res.status === "publicada" ? "publicada" : "pendiente");
        setForm({ rating: 0, name: "", body: "", website: "" });
        if (res.status === "publicada") load();
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        setState(msg.includes("espera") ? "wait" : /estrellas|nombre|texto/.test(msg) ? "bad" : "error");
      });
  }

  const done = state === "pendiente" || state === "publicada";

  return (
    <section id="resenas" className={plain ? "scroll-mt-20 border-t border-line" : "scroll-mt-20 border-t border-line bg-surface"}>
      <div className="mx-auto max-w-6xl px-5 py-24">
        {plain ? null : <p className="text-xs tracking-[0.42em] text-brass uppercase">{t.eyebrow}</p>}
        <h2 className="mt-3 font-display text-5xl leading-tight">{t.title}</h2>
        <p className="mt-4 max-w-xl text-sm text-muted">{t.lead}</p>

        {data?.sources.some((s) => s.rating !== null) ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {data.sources.map((s) => (
              <SourceBadge key={s.source} s={s} lang={lang} />
            ))}
          </div>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {present.length > 1 ? (
              <div className="mb-6 flex flex-wrap gap-2" role="tablist">
                {(["todas", ...present] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={filter === key}
                    onClick={() => {
                      setFilter(key);
                      setShown(PAGE);
                    }}
                    className={filter === key ? "min-h-11 bg-brass px-4 text-sm text-ink" : "min-h-11 border border-line px-4 text-sm text-muted"}
                  >
                    {key === "todas" ? t.all : SOURCE_NAME[key]}
                  </button>
                ))}
              </div>
            ) : null}

            {data === null ? (
              <div className="grid gap-4 md:grid-cols-2" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-44 animate-pulse border border-line bg-bg" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <p className="font-display text-3xl text-muted">{t.empty}</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {list.slice(0, shown).map((r) => (
                    <ReviewCard key={r.id} review={r} lang={lang} />
                  ))}
                </div>
                {list.length > shown ? (
                  <button type="button" onClick={() => setShown(shown + PAGE)} className="mt-6 min-h-11 border border-line px-5 text-sm text-fg">
                    {t.more} ({list.length - shown})
                  </button>
                ) : null}
              </>
            )}
          </div>

          <aside className="h-fit border border-line bg-bg p-6 lg:sticky lg:top-24">
            <h3 className="font-display text-3xl">{t.writeTitle}</h3>
            <p className="mt-2 text-sm text-muted">{t.writeLead}</p>
            {done ? (
              <div className="mt-6 grid gap-2" role="status">
                <p className="font-display text-2xl text-brass">{t.thanks}</p>
                <p className="text-sm text-muted">{state === "publicada" ? t.thanksLive : t.thanksPending}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 grid gap-4" noValidate>
                <StarPicker
                  value={form.rating}
                  onChange={(rating) => setForm({ ...form, rating })}
                  legend={t.stars}
                  starLabel={t.starLabel}
                />
                <label className="grid gap-2 text-sm text-muted">
                  {t.name}
                  <input
                    value={form.name}
                    maxLength={60}
                    autoComplete="given-name"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t.namePh}
                    className="min-h-11 border border-line bg-bg px-3 text-fg"
                  />
                </label>
                <label className="grid gap-2 text-sm text-muted">
                  {t.body}
                  <textarea
                    value={form.body}
                    maxLength={1000}
                    rows={4}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder={t.bodyPh}
                    className="border border-line bg-bg px-3 py-3 text-fg"
                  />
                </label>
                {/* Honeypot: hidden from people, irresistible to bots. */}
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  name="website"
                />
                {state === "bad" ? <p className="text-sm text-brass">{t.errBad}</p> : null}
                {state === "wait" ? <p className="text-sm text-brass">{t.errWait}</p> : null}
                {state === "error" ? <p className="text-sm text-brass">{t.errFail}</p> : null}
                <button type="submit" disabled={state === "sending"} className="min-h-11 bg-brass text-ink disabled:opacity-60">
                  {state === "sending" ? t.sending : t.send}
                </button>
              </form>
            )}
            {data?.googleWriteUrl ? (
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm text-muted">{t.google}</p>
                <a
                  href={data.googleWriteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center border border-line px-4 text-sm text-fg hover:border-brass"
                >
                  {t.googleCta} ↗
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
