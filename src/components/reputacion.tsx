import { useEffect, useMemo, useState } from "react";
import {
  feedbackSent,
  houseReviews,
  MANUAL_SOURCES,
  reviewAlert,
  reviewDelete,
  reviewDraft,
  reviewImport,
  reviewReply,
  reviewStatus,
  reviewSync,
  SOURCE_NAME,
  type AdminReview,
  type FeedbackQueueItem,
  type ManualSource,
  type ReviewSource,
  type ReviewStatus,
  type SourceSummary,
} from "@/lib/reviews";
import { Stars } from "@/components/stars";

type Desk = Awaited<ReturnType<typeof houseReviews>>;

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pendiente: "Por moderar",
  publicada: "Publicada",
  oculta: "Oculta",
  privada: "Privada",
};

const btn = "min-h-11 border border-line px-3 text-sm text-muted hover:text-fg";
const btnOn = "min-h-11 bg-brass px-3 text-sm text-ink";

function when(isoDate: string | null) {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("es-PA", { timeZone: "America/Panama", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(
    new Date(isoDate),
  );
}

function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 8 ? `507${digits}` : digits;
}

function waFeedback(item: FeedbackQueueItem) {
  const first = item.name.split(" ")[0];
  const text = `Hola${first ? ` ${first}` : ""}, gracias por venir a La Quinta Pata. ¿Cómo te fue? Son 20 segundos: ${item.link ?? ""}`;
  return `https://wa.me/${waNumber(item.phone)}?text=${encodeURIComponent(text)}`;
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "alert" }) {
  return (
    <div className={`border p-4 ${tone === "alert" ? "border-brass" : "border-line"}`}>
      <p className="text-xs tracking-wider text-muted uppercase">{label}</p>
      <p className={`mt-2 font-display text-4xl ${tone === "alert" ? "text-brass" : "text-fg"}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function ReviewRow({ review, onChange, crisis }: { review: AdminReview; onChange: () => void; crisis?: boolean }) {
  const [reply, setReply] = useState(review.reply || review.draft);
  const [busy, setBusy] = useState<"" | "ai" | "save">("");
  const [note, setNote] = useState("");
  const synced = review.source === "google" || review.source === "tripadvisor";
  const external = review.source !== "site" && review.source !== "visita";

  useEffect(() => setReply(review.reply || review.draft), [review.reply, review.draft]);

  function run(p: Promise<unknown>) {
    void p.then(onChange).catch(() => setNote("No se pudo guardar."));
  }

  function draft() {
    setBusy("ai");
    setNote("");
    void reviewDraft({ data: { id: review.id } })
      .then((res) => setReply(res.draft))
      .catch(() => setNote("No se pudo generar el borrador (¿falta OPENROUTER_API_KEY o saldo?)."))
      .finally(() => setBusy(""));
  }

  function save() {
    setBusy("save");
    void reviewReply({ data: { id: review.id, reply } })
      .then(() => {
        setNote(external ? "Guardada. Pégala también en la plataforma original." : "Respuesta publicada bajo la reseña.");
        onChange();
      })
      .catch(() => setNote("No se pudo guardar."))
      .finally(() => setBusy(""));
  }

  return (
    <li className="grid gap-3 py-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} />
        <span className="text-sm text-fg">{review.author}</span>
        <span className="border border-line px-2 py-0.5 text-[11px] tracking-wider text-muted uppercase">{SOURCE_NAME[review.source]}</span>
        <span className="text-xs text-muted">{when(review.postedAt)}</span>
        {review.alert === "abierta" ? <span className="bg-brass px-2 py-0.5 text-[11px] text-ink uppercase">Alerta</span> : null}
        {review.alert === "atendida" ? <span className="border border-brass px-2 py-0.5 text-[11px] text-brass uppercase">Atendida</span> : null}
      </div>
      {review.body ? <p className="max-w-3xl whitespace-pre-line text-sm text-fg/90">{review.body}</p> : <p className="text-sm text-muted">(Solo estrellas)</p>}
      {review.url ? (
        <a href={review.url} target="_blank" rel="noreferrer" className="text-xs text-brass">
          Abrir en {SOURCE_NAME[review.source]} ↗
        </a>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["publicada", "pendiente", "oculta"] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={review.status === status ? btnOn : btn}
            onClick={() => run(reviewStatus({ data: { id: review.id, status } }))}
          >
            {STATUS_LABEL[status]}
          </button>
        ))}
        {review.status === "privada" ? <span className={`${btnOn} inline-flex items-center`}>Privada</span> : null}
        {review.alert === "abierta" ? (
          <button type="button" className={btn} onClick={() => run(reviewAlert({ data: { id: review.id, alert: "atendida" } }))}>
            ☑️ Atendida
          </button>
        ) : review.alert === "no" ? (
          <button type="button" className={btn} onClick={() => run(reviewAlert({ data: { id: review.id, alert: "abierta" } }))}>
            Marcar alerta
          </button>
        ) : null}
        {!synced ? (
          <button
            type="button"
            className={btn}
            onClick={() => {
              if (window.confirm("¿Borrar esta reseña? No se puede deshacer.")) run(reviewDelete({ data: { id: review.id } }));
            }}
          >
            Borrar
          </button>
        ) : null}
      </div>

      {crisis || review.reply || review.draft || review.source === "site" || review.source === "visita" ? (
        <div className="grid max-w-3xl gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder={external ? "Respuesta para pegar en la plataforma…" : "Respuesta pública de la casa…"}
            className="border border-line bg-bg px-3 py-2 text-sm text-fg"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} disabled={busy !== ""} onClick={draft}>
              {busy === "ai" ? "Redactando…" : "🤖 Borrador IA"}
            </button>
            <button type="button" className={btnOn} disabled={busy !== "" || !reply.trim()} onClick={save}>
              {busy === "save" ? "Guardando…" : "Guardar respuesta"}
            </button>
            {external && reply.trim() ? (
              <button type="button" className={btn} onClick={() => void navigator.clipboard?.writeText(reply).then(() => setNote("Copiada."))}>
                Copiar
              </button>
            ) : null}
          </div>
          {note ? <p className="text-xs text-brass">{note}</p> : null}
        </div>
      ) : null}
    </li>
  );
}

function SourceRow({ s }: { s: SourceSummary }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
      <span className="text-fg">
        {SOURCE_NAME[s.source]}
        {s.name ? <span className="text-muted"> · {s.name}</span> : null}
      </span>
      <span className="text-muted">
        {s.rating !== null ? `${s.rating.toFixed(1)} ★ · ${s.total ?? 0}` : "sin datos"}
        {s.source !== "site" ? ` · sync ${when(s.syncedAt)}` : ""}
      </span>
      {s.error ? <span className="w-full text-xs text-brass">Error: {s.error}</span> : null}
    </li>
  );
}

export function ReputationDesk() {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<ReviewStatus | "todas">("pendiente");
  const [source, setSource] = useState<ReviewSource | "todas">("todas");
  const [syncing, setSyncing] = useState("");
  const [imp, setImp] = useState({ source: "degusta" as ManualSource, author: "", rating: 5, body: "", url: "", date: "" });
  const [impNote, setImpNote] = useState("");

  function load() {
    void houseReviews()
      .then((d) => {
        setDesk(d);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }
  useEffect(load, []);

  const stats = useMemo(() => {
    const reviews = desk?.reviews ?? [];
    const own = reviews.filter((r) => r.source === "site" || r.source === "visita");
    const answerable = reviews.filter((r) => r.status !== "oculta");
    const answered = answerable.filter((r) => r.reply.trim()).length;
    return {
      alerts: reviews.filter((r) => r.alert === "abierta"),
      pending: reviews.filter((r) => r.status === "pendiente").length,
      feedback: reviews.filter((r) => r.source === "visita").length,
      ownAvg: own.length ? own.reduce((sum, r) => sum + r.rating, 0) / own.length : null,
      responseRate: answerable.length ? Math.round((answered / answerable.length) * 100) : null,
    };
  }, [desk]);

  if (failed) return <p className="mt-10 text-sm text-brass">No se pudieron cargar las reseñas. Recarga la página.</p>;
  if (!desk) return <p className="mt-10 text-sm text-muted">Cargando reseñas…</p>;

  const google = desk.sources.find((s) => s.source === "google");
  const shown = desk.reviews.filter((r) => (status === "todas" || r.status === status) && (source === "todas" || r.source === source));
  const missing = [
    !desk.config.google && "Google (GOOGLE_PLACES_API_KEY)",
    !desk.config.tripadvisor && "TripAdvisor (TRIPADVISOR_API_KEY)",
    !desk.config.telegram && "alertas a Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_STAFF_CHAT_ID)",
    !desk.config.ai && "borradores IA (OPENROUTER_API_KEY)",
  ].filter(Boolean);

  return (
    <>
      <h1 className="mt-8 font-display text-5xl">Reseñas</h1>
      <p className="mt-4 max-w-xl text-sm text-muted">
        Reputación en un solo lugar: alertas de crisis (≤ {desk.config.alertMax} ★), opiniones post-visita, moderación y respuestas.
      </p>
      {missing.length ? (
        <p className="mt-4 max-w-2xl border border-line p-3 text-xs text-muted">Sin configurar en el servidor: {missing.join(" · ")}.</p>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Alertas abiertas" value={String(stats.alerts.length)} tone={stats.alerts.length ? "alert" : undefined} />
        <Kpi label="Por moderar" value={String(stats.pending)} />
        <Kpi label="Google" value={google?.rating != null ? `${google.rating.toFixed(1)}★` : "—"} hint={google?.total != null ? `${google.total} reseñas` : undefined} />
        <Kpi label="La casa" value={stats.ownAvg !== null ? `${stats.ownAvg.toFixed(1)}★` : "—"} hint={`${stats.feedback} post-visita`} />
        <Kpi label="Respondidas" value={stats.responseRate !== null ? `${stats.responseRate}%` : "—"} />
      </div>

      {stats.alerts.length ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl text-brass">🚨 Alertas de crisis</h2>
          <p className="mt-2 text-sm text-muted">Contactar al cliente primero. Responder sin excusas. Marcar atendida al cerrar.</p>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {stats.alerts.map((r) => (
              <ReviewRow key={r.id} review={r} onChange={load} crisis />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-3xl">Pedir opinión</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Reservas confirmadas de los últimos días. Las de Telegram reciben el enlace solas al día siguiente; las demás, un toque abre WhatsApp con el mensaje listo.
        </p>
        {desk.queue.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Nadie pendiente.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {desk.queue.map((item) => (
              <li key={item.holdId} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <span className="text-sm">
                  {item.name || "Sin nombre"} · {item.party} pers. · {item.date} {item.time}
                </span>
                {item.channel === "telegram" ? (
                  <span className="text-xs text-muted">Telegram · automático</span>
                ) : item.link && item.phone ? (
                  <a
                    href={waFeedback(item)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => void feedbackSent({ data: { holdId: item.holdId } }).then(load)}
                    className={`${btnOn} inline-flex items-center`}
                  >
                    Enviar por WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-brass">Falta CASA_SECRET o teléfono</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Todas las reseñas</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["pendiente", "publicada", "privada", "oculta", "todas"] as const).map((key) => (
            <button key={key} type="button" className={status === key ? btnOn : btn} onClick={() => setStatus(key)}>
              {key === "todas" ? "Todas" : STATUS_LABEL[key]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["todas", "site", "visita", "google", "tripadvisor", "degusta", "facebook", "otro"] as const).map((key) => (
            <button key={key} type="button" className={source === key ? btnOn : btn} onClick={() => setSource(key)}>
              {key === "todas" ? "Todas las fuentes" : SOURCE_NAME[key]}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="mt-8 font-display text-3xl text-muted">Nada en esta lista.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {shown.map((r) => (
              <ReviewRow key={r.id} review={r} onChange={load} />
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-3xl">Importar a mano</h2>
          <p className="mt-2 text-sm text-muted">Para Degusta, Facebook u otras sin API. Se publica de inmediato con enlace al original.</p>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setImpNote("");
              void reviewImport({ data: imp })
                .then(() => {
                  setImp({ ...imp, author: "", body: "", url: "", date: "" });
                  setImpNote("Importada.");
                  load();
                })
                .catch(() => setImpNote("Revisa estrellas y texto."));
            }}
          >
            <div className="flex flex-wrap gap-2">
              {MANUAL_SOURCES.map((key) => (
                <button key={key} type="button" className={imp.source === key ? btnOn : btn} onClick={() => setImp({ ...imp, source: key })}>
                  {SOURCE_NAME[key]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <input
                value={imp.author}
                onChange={(e) => setImp({ ...imp, author: e.target.value })}
                placeholder="Autor"
                className="min-h-11 border border-line bg-bg px-3 text-sm text-fg"
              />
              <select
                value={imp.rating}
                onChange={(e) => setImp({ ...imp, rating: Number(e.target.value) })}
                className="min-h-11 border border-line bg-bg px-3 text-sm text-fg"
                aria-label="Estrellas"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={imp.body}
              onChange={(e) => setImp({ ...imp, body: e.target.value })}
              rows={4}
              placeholder="Texto de la reseña"
              className="border border-line bg-bg px-3 py-2 text-sm text-fg"
            />
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <input
                value={imp.url}
                onChange={(e) => setImp({ ...imp, url: e.target.value })}
                placeholder="https://… (enlace al original)"
                className="min-h-11 border border-line bg-bg px-3 text-sm text-fg"
              />
              <input
                type="date"
                value={imp.date}
                onChange={(e) => setImp({ ...imp, date: e.target.value })}
                className="min-h-11 border border-line bg-bg px-3 text-sm text-fg"
                aria-label="Fecha"
              />
            </div>
            <button type="submit" className={btnOn}>
              Importar
            </button>
            {impNote ? <p className="text-xs text-brass">{impNote}</p> : null}
          </form>
        </section>

        <section>
          <h2 className="font-display text-3xl">Fuentes</h2>
          <p className="mt-2 text-sm text-muted">
            Google y TripAdvisor se sincronizan solos cada pocas horas. Google entrega solo 5 reseñas por consulta; sin acceso al perfil de
            negocio no garantiza ver todas las nuevas.
          </p>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {desk.sources.length ? desk.sources.map((s) => <SourceRow key={s.source} s={s} />) : <li className="py-3 text-sm text-muted">Sin fuentes todavía.</li>}
          </ul>
          <button
            type="button"
            className={`${btn} mt-4`}
            disabled={syncing === "…"}
            onClick={() => {
              setSyncing("…");
              void reviewSync()
                .then((res) => {
                  const parts = Object.entries(res).map(([k, v]) => `${k}: ${v}`);
                  setSyncing(parts.length ? parts.join(" · ") : "Ninguna fuente configurada.");
                  load();
                })
                .catch(() => setSyncing("No se pudo sincronizar."));
            }}
          >
            {syncing === "…" ? "Sincronizando…" : "Sincronizar ahora"}
          </button>
          {syncing && syncing !== "…" ? <p className="mt-2 text-xs text-muted">{syncing}</p> : null}
        </section>
      </div>
    </>
  );
}
