import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Lang } from "@/lib/copy";
import { getFeedback, sendFeedback, type FeedbackInfo } from "@/lib/reviews";
import { reviewsCopy } from "@/lib/reviews-copy";
import { StarPicker } from "@/components/stars";

/** Post-visit feedback: private by default, every guest also sees the Google link (no review gating). */
export const Route = createFileRoute("/opinion/$token")({
  head: () => ({
    meta: [{ title: "¿Cómo te fue? — La Quinta Pata" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Feedback,
});

function Feedback() {
  const { token } = Route.useParams();
  const [lang, setLang] = useState<Lang>("es");
  const t = reviewsCopy[lang];
  const [info, setInfo] = useState<FeedbackInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [publish, setPublish] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lqp-lang");
      if (saved === "en" || saved === "es") setLang(saved);
    } catch {
      /* storage blocked */
    }
    void getFeedback({ data: { token } })
      .then(setInfo)
      .catch(() => setInfo({ ok: false }));
  }, [token]);

  function choose(code: Lang) {
    setLang(code);
    try {
      window.localStorage.setItem("lqp-lang", code);
    } catch {
      /* storage blocked */
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return;
    setState("sending");
    void sendFeedback({ data: { token, rating, body, publish, lang } })
      .then(() => setState("sent"))
      .catch(() => setState("error"));
  }

  const date =
    info?.ok && info.date
      ? new Intl.DateTimeFormat(lang === "es" ? "es-PA" : "en-US", { day: "numeric", month: "long", timeZone: "UTC" }).format(
          new Date(`${info.date}T12:00:00Z`),
        )
      : "";

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-5">
          <a href="/" className="font-display text-base tracking-[0.22em] uppercase">
            La Quinta Pata
          </a>
          <div className="flex border border-line text-xs tracking-widest">
            {(["es", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => choose(code)}
                aria-pressed={lang === code}
                className={lang === code ? "min-h-11 bg-brass px-3 text-ink" : "min-h-11 px-3 text-muted"}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-16">
        {info === null ? (
          <div className="h-64 animate-pulse border border-line bg-surface" aria-hidden />
        ) : !info.ok ? (
          <div>
            <p className="font-display text-4xl">{t.fbBad}</p>
            <a href="/" className="mt-6 inline-flex min-h-11 items-center bg-brass px-5 text-ink">
              {t.fbHome}
            </a>
          </div>
        ) : info.answered || state === "sent" ? (
          <div role="status">
            <p className="font-display text-4xl">{state === "sent" ? t.fbThanks : t.fbDone}</p>
            {info.googleWriteUrl ? (
              <div className="mt-8 border-t border-line pt-6">
                <p className="text-sm text-muted">{t.fbGoogle}</p>
                <a
                  href={info.googleWriteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center bg-brass px-5 text-ink"
                >
                  {t.googleCta} ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-6">
            <div>
              <p className="text-xs tracking-[0.42em] text-brass uppercase">{t.fbHello(info.firstName)}</p>
              <h1 className="mt-3 font-display text-5xl leading-tight">{t.fbTitle}</h1>
              <p className="mt-4 text-sm text-muted">{t.fbLead(date)}</p>
            </div>
            <StarPicker value={rating} onChange={setRating} legend={t.stars} starLabel={t.starLabel} />
            <label className="grid gap-2 text-sm text-muted">
              {t.fbBody}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder={t.fbBodyPh}
                className="border border-line bg-bg px-3 py-3 text-fg"
              />
            </label>
            <label className="flex items-start gap-3 text-sm text-muted">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="mt-1 h-5 w-5 accent-[#c4a574]" />
              {t.fbPublish}
            </label>
            {state === "error" ? <p className="text-sm text-brass">{t.errFail}</p> : null}
            <button type="submit" disabled={rating < 1 || state === "sending"} className="min-h-12 bg-brass text-ink disabled:opacity-50">
              {state === "sending" ? t.sending : t.fbSend}
            </button>
            {info.googleWriteUrl ? (
              <p className="text-sm text-muted">
                {t.google}:{" "}
                <a href={info.googleWriteUrl} target="_blank" rel="noreferrer" className="text-brass">
                  {t.googleCta} ↗
                </a>
              </p>
            ) : null}
          </form>
        )}
      </main>
    </div>
  );
}
