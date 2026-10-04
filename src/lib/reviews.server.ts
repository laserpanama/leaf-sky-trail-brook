import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { houseOpen, ipKey } from "@/lib/casa-ops.server";
import { agentConfig } from "@/lib/agent/config";
import type {
  AdminReview,
  FeedbackInfo,
  FeedbackQueueItem,
  ManualSource,
  PublicReview,
  ReviewAlert,
  ReviewSource,
  ReviewStatus,
  SourceSummary,
} from "@/lib/reviews";

/**
 * Reputation module (template-reusable).
 *
 *  Reviews ─┬─ site      public form on the home page, moderated
 *           ├─ visita    post-visit feedback link tied to a reservation (verified)
 *           ├─ google    Places API (New): rating, count and up to 5 "relevant" reviews
 *           ├─ tripadvisor  Content API: rating, count and up to 5 latest reviews
 *           └─ degusta / facebook / otro  imported by hand in /admin
 *
 *  Crisis alert: any new review at or below REVIEW_ALERT_MAX stars (default 2)
 *  pings the staff Telegram chat with "AI draft" / "Handled" buttons.
 *
 * Env (all optional — each source switches on when its key is present):
 *   GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID (or GOOGLE_PLACE_QUERY to auto-resolve)
 *   TRIPADVISOR_API_KEY, TRIPADVISOR_LOCATION_ID (or TRIPADVISOR_QUERY)
 *   REVIEW_ALERT_MAX=2, REVIEWS_AUTO_PUBLISH=0, REVIEWS_SYNC_HOURS=12
 */

const SYNC_HOURS = () => clampInt(env("REVIEWS_SYNC_HOURS"), 12, 1, 72);
const ALERT_MAX = () => clampInt(env("REVIEW_ALERT_MAX"), 2, 1, 4);
const GOOGLE_RETENTION_DAYS = 30; // Google Maps Platform terms: don't keep review content longer.
const NEW_REVIEW_WINDOW_DAYS = 14; // older synced reviews never raise alerts (first sync would flood).
const POSTS_PER_IP_10MIN = 2;
const POSTS_PER_IP_DAY = 5;
const POSTS_GLOBAL_DAY = 150;

function clampInt(raw: string | undefined, fallback: number, min: number, max: number) {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

function assertHouse() {
  if (!houseOpen()) throw new Error("cerrado");
}

function iso(value: unknown) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function clean(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanBody(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function siteUrl() {
  return (env("PUBLIC_SITE_URL") ?? "https://laquintapata.pipolopez.pro").replace(/\/+$/, "");
}

function panamaDay(offsetDays = 0) {
  const d = new Date(Date.now() - 5 * 3600_000 + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/* ───────────────────────── feedback tokens ───────────────────────── */

function tokenSecret() {
  return env("CASA_SECRET") ?? null;
}

export function feedbackToken(holdId: string) {
  const secret = tokenSecret();
  if (!secret) return null;
  const mac = createHmac("sha256", secret).update(`fb|${holdId}`).digest("base64url").slice(0, 22);
  return `${holdId}.${mac}`;
}

function holdFromToken(token: string) {
  const [id, mac] = String(token ?? "").split(".");
  if (!id || !mac || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const expected = feedbackToken(id)?.split(".")[1];
  if (!expected || expected.length !== mac.length) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(mac)) ? id : null;
}

export function feedbackLink(holdId: string) {
  const token = feedbackToken(holdId);
  return token ? `${siteUrl()}/opinion/${token}` : null;
}

/* ───────────────────────── reads ───────────────────────── */

type Row = {
  id: string;
  source: string;
  hold_id: string | null;
  author: string;
  author_url: string | null;
  author_photo: string | null;
  rating: number;
  body: string;
  lang: string | null;
  url: string | null;
  status: string;
  reply: string;
  draft: string;
  alert: string;
  posted_at: unknown;
  created_at: unknown;
};

function toPublic(row: Row): PublicReview {
  return {
    id: row.id,
    source: row.source as ReviewSource,
    author: row.author || "Anónimo",
    authorUrl: row.author_url,
    authorPhoto: row.author_photo,
    rating: Number(row.rating),
    body: row.body,
    lang: row.lang,
    url: row.url,
    reply: row.reply,
    verified: row.source === "visita",
    postedAt: iso(row.posted_at) ?? new Date().toISOString(),
  };
}

function toAdmin(row: Row): AdminReview {
  return {
    ...toPublic(row),
    status: row.status as ReviewStatus,
    draft: row.draft,
    alert: row.alert as ReviewAlert,
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
  };
}

async function summaries(): Promise<SourceSummary[]> {
  const sql = await getSql();
  const ext = await sql<{
    source: string;
    name: string | null;
    rating: string | null;
    total: number | null;
    url: string | null;
    synced_at: unknown;
    error: string | null;
  }>`select source, name, rating, total, url, synced_at, error from review_sources order by source`;
  const [own] = await sql<{ avg: string | null; n: number }>`
    select avg(rating)::numeric(3,2)::text as avg, count(*)::int as n
    from reviews where source in ('site', 'visita') and status = 'publicada'
  `;
  const list: SourceSummary[] = [];
  if (Number(own?.n) > 0) {
    list.push({ source: "site", rating: Number(own.avg), total: Number(own.n), url: null, syncedAt: null, error: null, name: null });
  }
  for (const row of ext) {
    list.push({
      source: row.source as ReviewSource,
      name: row.name,
      rating: row.rating === null ? null : Number(row.rating),
      total: row.total === null ? null : Number(row.total),
      url: row.url,
      syncedAt: iso(row.synced_at),
      error: row.error,
    });
  }
  return list;
}

async function googlePlaceId() {
  const fromEnv = env("GOOGLE_PLACE_ID");
  if (fromEnv) return fromEnv;
  const sql = await getSql();
  const [row] = await sql<{ ext_id: string | null }>`select ext_id from review_sources where source = 'google'`;
  return row?.ext_id ?? null;
}

export async function publicReviews() {
  tick();
  const sql = await getSql();
  const rows = await sql<Row>`
    select * from reviews where status = 'publicada'
    order by posted_at desc limit 60
  `;
  const placeId = await googlePlaceId();
  return {
    reviews: rows.map(toPublic),
    sources: await summaries(),
    googleWriteUrl: placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : null,
  };
}

/* ───────────────────────── public writes ───────────────────────── */

export type PostInput = { rating: number; name: string; body: string; lang?: string; website?: string };

export async function postReview(input: PostInput) {
  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (input.website && input.website.trim()) return { id: randomUUID(), status: "pendiente" as const };
  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error("estrellas");
  const author = clean(input.name, 60);
  if (author.length < 2) throw new Error("nombre");
  const body = cleanBody(input.body, 1000);
  if (body.length < 10) throw new Error("texto");
  const lang = input.lang === "en" ? "en" : "es";

  const sql = await getSql();
  const ip = ipKey();
  const [recent] = await sql<{ short: number; day: number; global: number }>`
    select
      count(*) filter (where ip_hash = ${ip} and created_at > now() - interval '10 minutes')::int as short,
      count(*) filter (where ip_hash = ${ip} and created_at > now() - interval '1 day')::int as day,
      count(*) filter (where created_at > now() - interval '1 day')::int as global
    from reviews where source = 'site'
  `;
  if (
    Number(recent?.short) >= POSTS_PER_IP_10MIN ||
    Number(recent?.day) >= POSTS_PER_IP_DAY ||
    Number(recent?.global) >= POSTS_GLOBAL_DAY
  ) {
    throw new Error("espera");
  }

  const hasLink = /(https?:\/\/|www\.|\.(com|net|xyz|ru|top)\b)/i.test(body);
  const status: ReviewStatus = env("REVIEWS_AUTO_PUBLISH") === "1" && !hasLink ? "publicada" : "pendiente";
  const alert: ReviewAlert = rating <= ALERT_MAX() ? "abierta" : "no";
  const id = randomUUID();
  await sql`
    insert into reviews (id, source, author, rating, body, lang, status, alert, ip_hash)
    values (${id}, 'site', ${author}, ${rating}, ${body}, ${lang}, ${status}, ${alert}, ${ip})
  `;
  await notifyReview({ id, source: "site", author, rating, body, status, alert }).catch(() => undefined);
  return { id, status };
}

export async function feedbackInfo(token: string): Promise<FeedbackInfo> {
  const holdId = holdFromToken(token);
  if (!holdId) return { ok: false };
  const sql = await getSql();
  const [hold] = await sql<{ name: string | null; day: string }>`select name, day from holds where id = ${holdId}`;
  if (!hold) return { ok: false };
  const [done] = await sql<{ id: string }>`select id from reviews where hold_id = ${holdId}`;
  const placeId = await googlePlaceId();
  return {
    ok: true,
    firstName: clean(hold.name, 60).split(" ")[0] ?? "",
    date: String(hold.day).slice(0, 10),
    answered: Boolean(done),
    googleWriteUrl: placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : null,
  };
}

export async function submitFeedback(input: { token: string; rating: number; body: string; publish: boolean; lang?: string }) {
  const holdId = holdFromToken(input.token);
  if (!holdId) throw new Error("enlace");
  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error("estrellas");
  const body = cleanBody(input.body, 1000);
  const sql = await getSql();
  const [hold] = await sql<{ name: string | null }>`select name from holds where id = ${holdId}`;
  if (!hold) throw new Error("enlace");
  // First name only: the full name and phone stay in the reservation, never on the public page.
  const author = clean(hold.name, 60).split(" ")[0] || "Cliente";
  // Private unless the guest opts in; even then a human publishes it.
  const status: ReviewStatus = input.publish && body.length >= 10 ? "pendiente" : "privada";
  const alert: ReviewAlert = rating <= ALERT_MAX() ? "abierta" : "no";
  const id = randomUUID();
  const inserted = await sql<{ id: string }>`
    insert into reviews (id, source, hold_id, author, rating, body, lang, status, alert)
    values (${id}, 'visita', ${holdId}, ${author}, ${rating}, ${body}, ${input.lang === "en" ? "en" : "es"}, ${status}, ${alert})
    on conflict do nothing
    returning id
  `;
  if (!inserted.length) return { id: null, duplicate: true };
  await notifyReview({ id, source: "visita", author, rating, body, status, alert }).catch(() => undefined);
  return { id, duplicate: false };
}

/* ───────────────────────── admin ───────────────────────── */

export async function adminReviews() {
  assertHouse();
  tick();
  const sql = await getSql();
  const rows = await sql<Row>`select * from reviews order by created_at desc limit 500`;
  const holds = await sql<{ id: string; day: string; slot: string; party: number; name: string; phone: string; thread_id: string | null }>`
    select h.id, h.day, h.slot, h.party, h.name, h.phone, h.thread_id from holds h
    where h.status = 'confirmada'
      and h.feedback_at is null
      and h.day between ${panamaDay(-4)} and ${panamaDay(-1)}
      and not exists (select 1 from reviews r where r.hold_id = h.id)
    order by h.day desc, h.slot desc limit 60
  `;
  const queue: FeedbackQueueItem[] = holds.map((h) => ({
    holdId: h.id,
    date: String(h.day).slice(0, 10),
    time: h.slot,
    party: Number(h.party),
    name: h.name ?? "",
    phone: h.phone ?? "",
    channel: h.thread_id?.startsWith("telegram:") ? "telegram" : "whatsapp",
    link: feedbackLink(h.id),
  }));
  const placeId = await googlePlaceId();
  return {
    reviews: rows.map(toAdmin),
    sources: await summaries(),
    queue,
    config: {
      google: Boolean(env("GOOGLE_PLACES_API_KEY")),
      tripadvisor: Boolean(env("TRIPADVISOR_API_KEY")),
      telegram: Boolean(env("TELEGRAM_BOT_TOKEN") && env("TELEGRAM_STAFF_CHAT_ID")),
      ai: Boolean(env("OPENROUTER_API_KEY")),
      autoPublish: env("REVIEWS_AUTO_PUBLISH") === "1",
      alertMax: ALERT_MAX(),
      googlePlaceId: placeId,
    },
  };
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  assertHouse();
  const sql = await getSql();
  await sql`update reviews set status = ${status} where id = ${id}`;
}

export async function setReviewAlert(id: string, alert: ReviewAlert) {
  assertHouse();
  const sql = await getSql();
  await sql`update reviews set alert = ${alert} where id = ${id}`;
}

export async function saveReply(id: string, reply: string) {
  assertHouse();
  const sql = await getSql();
  const text = cleanBody(reply, 1500);
  // Answering a crisis closes it.
  await sql`
    update reviews set reply = ${text}, alert = case when alert = 'abierta' and ${text} <> '' then 'atendida' else alert end
    where id = ${id}
  `;
}

export async function deleteReview(id: string) {
  assertHouse();
  const sql = await getSql();
  // Synced reviews come back on the next sync; hide those instead.
  await sql`delete from reviews where id = ${id} and source not in ('google', 'tripadvisor')`;
}

export async function importReview(input: {
  source: ManualSource;
  author: string;
  rating: number;
  body: string;
  url?: string;
  date?: string;
}) {
  assertHouse();
  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error("estrellas");
  const author = clean(input.author, 60) || "Cliente";
  const body = cleanBody(input.body, 2000);
  if (!body) throw new Error("texto");
  const url = /^https:\/\/\S+$/.test(String(input.url ?? "")) ? String(input.url).slice(0, 500) : null;
  const posted = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date ?? "")) ? `${input.date}T12:00:00-05:00` : new Date().toISOString();
  const sql = await getSql();
  const id = randomUUID();
  await sql`
    insert into reviews (id, source, author, rating, body, url, status, alert, posted_at)
    values (${id}, ${input.source}, ${author}, ${rating}, ${body}, ${url}, 'publicada', 'no', ${posted})
  `;
  return { id };
}

export async function markFeedbackSent(holdId: string) {
  assertHouse();
  const sql = await getSql();
  await sql`update holds set feedback_at = now() where id = ${holdId}`;
}

export async function syncNow() {
  assertHouse();
  return syncAll(true);
}

/* ───────────────────────── AI reply drafts ───────────────────────── */

export async function draftReply(id: string, fromStaffChat = false) {
  if (!fromStaffChat) assertHouse();
  const key = env("OPENROUTER_API_KEY");
  if (!key) throw new Error("ia");
  const sql = await getSql();
  const [row] = await sql<Row>`select * from reviews where id = ${id}`;
  if (!row) throw new Error("resena");
  const cfg = agentConfig();
  const negative = Number(row.rating) <= 3;
  const english = row.lang === "en" || (!row.lang && /\b(the|and|was|great|food)\b/i.test(row.body));
  const system = [
    `Eres quien responde las reseñas de ${cfg.restaurant.name} (${cfg.restaurant.kind}, ${cfg.restaurant.address}).`,
    "Tono: cercano, directo, sin frases de agencia ni emojis de más. Máximo 70 palabras.",
    "Nunca inventes datos, promociones ni compensaciones. No discutas ni culpes al cliente.",
    negative
      ? `Reseña negativa: agradece, reconoce lo concreto sin excusas e invita a escribir al WhatsApp ${cfg.restaurant.whatsapp} para resolverlo.`
      : "Reseña positiva: agradece algo concreto que mencionó e invita a volver.",
    `Datos ciertos que puedes usar: ${cfg.restaurant.facts.join(" ")}`,
    english ? "Responde en inglés." : "Responde en español.",
    "Devuelve solo el texto de la respuesta.",
  ].join("\n");
  const res = await fetch(`${env("AGENT_API_BASE") ?? "https://openrouter.ai/api/v1"}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "x-title": `${cfg.restaurant.name} reseñas`,
      ...(env("PUBLIC_SITE_URL") ? { "http-referer": env("PUBLIC_SITE_URL")! } : {}),
    },
    body: JSON.stringify({
      model: env("REVIEW_MODEL") ?? env("AGENT_MODEL") ?? "deepseek/deepseek-chat",
      temperature: 0.5,
      max_tokens: 300,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `${row.rating}/5 estrellas · ${row.author}\n\n${row.body || "(sin texto)"}` },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`ia ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  const draft = cleanBody(json.choices?.[0]?.message?.content ?? "", 1500).replace(/^["“]|["”]$/g, "");
  if (!draft) throw new Error("ia");
  await sql`update reviews set draft = ${draft} where id = ${id}`;
  return { draft };
}

/* ───────────────────────── staff alerts (Telegram) ───────────────────────── */

const SOURCE_LABEL: Record<string, string> = {
  site: "Sitio web",
  visita: "Feedback post-visita",
  google: "Google",
  tripadvisor: "TripAdvisor",
  degusta: "Degusta",
  facebook: "Facebook",
  otro: "Otro",
};

type Alertable = { id: string; source: string; author: string; rating: number; body: string; status: string; alert: string };

async function notifyReview(r: Alertable) {
  const tg = await import("@/lib/agent/telegram.server");
  const chat = tg.staffChatId();
  if (!chat) return;
  const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  const head =
    r.alert === "abierta"
      ? `🚨 ALERTA DE CRISIS · ${agentConfig().restaurant.name}`
      : r.status === "pendiente"
        ? "📝 Reseña nueva por moderar"
        : `⭐ Reseña nueva · ${SOURCE_LABEL[r.source] ?? r.source}`;
  const lines = [
    head,
    `${stars} ${r.rating}/5 · ${SOURCE_LABEL[r.source] ?? r.source}`,
    `👤 ${r.author}`,
    r.body ? `💬 ${r.body.slice(0, 900)}` : "",
    r.status === "privada" ? "🔒 Privada: el cliente no pidió publicarla." : "",
    r.alert === "abierta" ? "⚡ Contactar al cliente y responder a mano." : "",
  ].filter(Boolean);
  const buttons: { text: string; callback_data: string }[][] = [];
  if (r.status === "pendiente") {
    buttons.push([
      { text: "✅ Publicar", callback_data: `rv-pub:${r.id}` },
      { text: "🙈 Ocultar", callback_data: `rv-hide:${r.id}` },
    ]);
  }
  if (r.alert === "abierta") {
    buttons.push([
      { text: "🤖 Borrador IA", callback_data: `rv-ai:${r.id}` },
      { text: "☑️ Atendida", callback_data: `rv-done:${r.id}` },
    ]);
  }
  await tg.sendMessage(chat, lines.join("\n"), buttons.length ? buttons : undefined);
}

/** Staff pressed a review button in Telegram. Returns the toast text. */
export async function handleStaffButton(action: string, id: string): Promise<{ toast: string; reply?: string }> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return { toast: "Reseña no encontrada" };
  const sql = await getSql();
  const [row] = await sql<{ id: string }>`select id from reviews where id = ${id}`;
  if (!row) return { toast: "Reseña no encontrada" };
  switch (action) {
    case "rv-pub":
      await sql`update reviews set status = 'publicada' where id = ${id}`;
      return { toast: "✅ Publicada" };
    case "rv-hide":
      await sql`update reviews set status = 'oculta' where id = ${id}`;
      return { toast: "🙈 Oculta" };
    case "rv-done":
      await sql`update reviews set alert = 'atendida' where id = ${id}`;
      return { toast: "☑️ Atendida" };
    case "rv-ai": {
      try {
        const { draft } = await draftReply(id, true);
        return { toast: "🤖 Borrador listo", reply: `🤖 Borrador de respuesta (revísalo antes de publicar):\n\n${draft}` };
      } catch {
        return { toast: "No se pudo generar el borrador" };
      }
    }
    default:
      return { toast: "Acción desconocida" };
  }
}

/* ───────────────────────── background tick ───────────────────────── */

const g = globalThis as typeof globalThis & { __lqpReviewTick__?: number; __lqpReviewSync__?: Promise<Record<string, string>> };

/** Cheap, throttled housekeeping piggy-backed on traffic: syncs sources and sends due feedback DMs. */
export function tick() {
  const now = Date.now();
  if (g.__lqpReviewTick__ && now - g.__lqpReviewTick__ < 10 * 60_000) return;
  g.__lqpReviewTick__ = now;
  void syncAll(false).catch((err) => console.error("[reviews] sync", err));
  void sendTelegramFeedback().catch((err) => console.error("[reviews] feedback", err));
}

async function sendTelegramFeedback() {
  const tg = await import("@/lib/agent/telegram.server");
  if (!tg.telegramEnabled() || !tokenSecret()) return;
  const hour = new Date(Date.now() - 5 * 3600_000).getUTCHours();
  if (hour < 11 || hour >= 21) return; // don't ping guests at night
  const sql = await getSql();
  const due = await sql<{ id: string; name: string; thread_id: string }>`
    select id, name, thread_id from holds
    where status = 'confirmada' and feedback_at is null and thread_id like 'telegram:%'
      and day between ${panamaDay(-2)} and ${panamaDay(-1)}
    limit 20
  `;
  for (const h of due) {
    const link = feedbackLink(h.id);
    if (!link) return;
    // Mark first so a crash can't double-message a guest.
    await sql`update holds set feedback_at = now() where id = ${h.id}`;
    const first = clean(h.name, 60).split(" ")[0];
    await tg.sendMessage(
      h.thread_id.slice("telegram:".length),
      `Hola${first ? ` ${first}` : ""}, gracias por venir a ${agentConfig().restaurant.name}. ¿Cómo te fue? Son 20 segundos: ${link}`,
    );
  }
}

/* ───────────────────────── sync: Google + TripAdvisor ───────────────────────── */

async function syncAll(force: boolean): Promise<Record<string, string>> {
  if (g.__lqpReviewSync__) return g.__lqpReviewSync__;
  const run = (async () => {
    const sql = await getSql();
    await sql`delete from reviews where source = 'google' and synced_at < now() - make_interval(days => ${GOOGLE_RETENTION_DAYS})`;
    const states = await sql<{ source: string; synced_at: unknown }>`select source, synced_at from review_sources`;
    const fresh = (source: string) => {
      if (force) return false;
      const at = iso(states.find((s) => s.source === source)?.synced_at);
      return Boolean(at && Date.now() - new Date(at).getTime() < SYNC_HOURS() * 3600_000);
    };
    const result: Record<string, string> = {};
    if (env("GOOGLE_PLACES_API_KEY") && !fresh("google")) result.google = await guard("google", syncGoogle);
    if (env("TRIPADVISOR_API_KEY") && !fresh("tripadvisor")) result.tripadvisor = await guard("tripadvisor", syncTripadvisor);
    return result;
  })();
  g.__lqpReviewSync__ = run;
  try {
    return await run;
  } finally {
    g.__lqpReviewSync__ = undefined;
  }
}

async function guard(source: string, fn: () => Promise<number>) {
  const sql = await getSql();
  try {
    const n = await fn();
    await sql`
      insert into review_sources (source, synced_at, error) values (${source}, now(), null)
      on conflict (source) do update set synced_at = now(), error = null
    `;
    return `ok · ${n} reseñas`;
  } catch (err) {
    const message = String(err instanceof Error ? err.message : err).slice(0, 300);
    // Record the failure but keep the previous synced_at so the panel shows how stale the data is.
    await sql`
      insert into review_sources (source, error) values (${source}, ${message})
      on conflict (source) do update set error = ${message}
    `;
    return `error · ${message}`;
  }
}

type Upsert = {
  source: "google" | "tripadvisor";
  externalId: string;
  author: string;
  authorUrl: string | null;
  authorPhoto: string | null;
  rating: number;
  body: string;
  lang: string | null;
  url: string | null;
  postedAt: string;
};

async function upsertSynced(r: Upsert) {
  const sql = await getSql();
  const recent = Date.now() - new Date(r.postedAt).getTime() < NEW_REVIEW_WINDOW_DAYS * 86_400_000;
  const alert: ReviewAlert = recent && r.rating <= ALERT_MAX() ? "abierta" : "no";
  const id = randomUUID();
  const [row] = await sql<{ id: string; inserted: boolean }>`
    insert into reviews (id, source, external_id, author, author_url, author_photo, rating, body, lang, url, status, alert, posted_at, synced_at)
    values (${id}, ${r.source}, ${r.externalId}, ${r.author}, ${r.authorUrl}, ${r.authorPhoto}, ${r.rating}, ${r.body},
            ${r.lang}, ${r.url}, 'publicada', ${alert}, ${r.postedAt}, now())
    on conflict (source, external_id) do update set
      author = excluded.author, author_url = excluded.author_url, author_photo = excluded.author_photo,
      rating = excluded.rating, body = excluded.body, url = excluded.url, synced_at = now()
    returning id, (xmax = 0) as inserted
  `;
  if (row?.inserted && alert === "abierta") {
    await notifyReview({ id: row.id, source: r.source, author: r.author, rating: r.rating, body: r.body, status: "publicada", alert }).catch(
      () => undefined,
    );
  }
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text) as T;
}

async function syncGoogle() {
  const key = env("GOOGLE_PLACES_API_KEY")!;
  const sql = await getSql();
  let placeId = await googlePlaceId();
  if (!placeId) {
    const query = env("GOOGLE_PLACE_QUERY") ?? `${agentConfig().restaurant.name}, ${agentConfig().restaurant.address}`;
    const found = await getJson<{ places?: { id: string }[] }>("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key, "x-goog-fieldmask": "places.id" },
      body: JSON.stringify({ textQuery: query, languageCode: "es", regionCode: "PA" }),
    });
    placeId = found.places?.[0]?.id ?? null;
    if (!placeId) throw new Error(`Google no encontró "${query}". Define GOOGLE_PLACE_ID.`);
  }
  type GReview = {
    name: string;
    rating?: number;
    text?: { text?: string; languageCode?: string };
    originalText?: { text?: string; languageCode?: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
    publishTime?: string;
    googleMapsUri?: string;
  };
  const place = await getJson<{
    displayName?: { text?: string };
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    reviews?: GReview[];
  }>(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es&regionCode=PA`, {
    headers: {
      "x-goog-api-key": key,
      "x-goog-fieldmask": "displayName,rating,userRatingCount,googleMapsUri,reviews",
    },
  });
  await sql`
    insert into review_sources (source, ext_id, name, rating, total, url)
    values ('google', ${placeId}, ${place.displayName?.text ?? null}, ${place.rating ?? null}, ${place.userRatingCount ?? null}, ${place.googleMapsUri ?? null})
    on conflict (source) do update set ext_id = excluded.ext_id, name = excluded.name, rating = excluded.rating,
      total = excluded.total, url = excluded.url
  `;
  const reviews = place.reviews ?? [];
  for (const r of reviews) {
    const original = r.originalText ?? r.text;
    await upsertSynced({
      source: "google",
      externalId: r.name,
      author: clean(r.authorAttribution?.displayName, 80) || "Usuario de Google",
      authorUrl: r.authorAttribution?.uri ?? null,
      authorPhoto: r.authorAttribution?.photoUri ?? null,
      rating: Math.min(5, Math.max(1, Math.round(r.rating ?? 0))),
      body: cleanBody(original?.text, 2000),
      lang: original?.languageCode?.slice(0, 2) ?? null,
      url: r.googleMapsUri ?? place.googleMapsUri ?? null,
      postedAt: r.publishTime ?? new Date().toISOString(),
    });
  }
  return reviews.length;
}

async function syncTripadvisor() {
  const key = env("TRIPADVISOR_API_KEY")!;
  const base = "https://api.content.tripadvisor.com/api/v1";
  const headers = { accept: "application/json", referer: siteUrl() };
  const sql = await getSql();
  let locationId = env("TRIPADVISOR_LOCATION_ID") ?? null;
  if (!locationId) {
    const [row] = await sql<{ ext_id: string | null }>`select ext_id from review_sources where source = 'tripadvisor'`;
    locationId = row?.ext_id ?? null;
  }
  if (!locationId) {
    const query = env("TRIPADVISOR_QUERY") ?? `${agentConfig().restaurant.name} Panama`;
    const found = await getJson<{ data?: { location_id: string }[] }>(
      `${base}/location/search?key=${encodeURIComponent(key)}&searchQuery=${encodeURIComponent(query)}&category=restaurants&language=es`,
      { headers },
    );
    locationId = found.data?.[0]?.location_id ?? null;
    if (!locationId) throw new Error(`TripAdvisor no encontró "${query}". Define TRIPADVISOR_LOCATION_ID.`);
  }
  const details = await getJson<{ name?: string; rating?: string; num_reviews?: string; web_url?: string }>(
    `${base}/location/${encodeURIComponent(locationId)}/details?key=${encodeURIComponent(key)}&language=es`,
    { headers },
  );
  await sql`
    insert into review_sources (source, ext_id, name, rating, total, url)
    values ('tripadvisor', ${locationId}, ${details.name ?? null}, ${details.rating ? Number(details.rating) : null},
            ${details.num_reviews ? Number(details.num_reviews) : null}, ${details.web_url ?? null})
    on conflict (source) do update set ext_id = excluded.ext_id, name = excluded.name, rating = excluded.rating,
      total = excluded.total, url = excluded.url
  `;
  type TReview = {
    id: number | string;
    lang?: string;
    published_date?: string;
    rating?: number;
    text?: string;
    title?: string;
    url?: string;
    user?: { username?: string; avatar?: { small?: string; thumbnail?: string } };
  };
  const list = await getJson<{ data?: TReview[] }>(
    `${base}/location/${encodeURIComponent(locationId)}/reviews?key=${encodeURIComponent(key)}&language=es`,
    { headers },
  );
  const reviews = list.data ?? [];
  for (const r of reviews) {
    const title = clean(r.title, 200);
    const text = cleanBody(r.text, 2000);
    await upsertSynced({
      source: "tripadvisor",
      externalId: String(r.id),
      author: clean(r.user?.username, 80) || "Usuario de TripAdvisor",
      authorUrl: null,
      authorPhoto: r.user?.avatar?.small ?? r.user?.avatar?.thumbnail ?? null,
      rating: Math.min(5, Math.max(1, Math.round(r.rating ?? 0))),
      body: title && !text.startsWith(title) ? `${title}\n\n${text}` : text,
      lang: r.lang?.slice(0, 2) ?? null,
      url: r.url ?? details.web_url ?? null,
      postedAt: r.published_date ?? new Date().toISOString(),
    });
  }
  return reviews.length;
}
