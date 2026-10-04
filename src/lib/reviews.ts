import { createServerFn } from "@tanstack/react-start";

/** Shared types + server functions for the reputation module (reviews, crisis alerts, post-visit feedback). */

export type ReviewSource = "site" | "visita" | "google" | "tripadvisor" | "degusta" | "facebook" | "otro";
export type ManualSource = "degusta" | "facebook" | "tripadvisor" | "otro";
export type ReviewStatus = "pendiente" | "publicada" | "oculta" | "privada";
export type ReviewAlert = "no" | "abierta" | "atendida";

export const MANUAL_SOURCES: ManualSource[] = ["degusta", "facebook", "tripadvisor", "otro"];

export const SOURCE_NAME: Record<ReviewSource, string> = {
  site: "La casa",
  visita: "Visita verificada",
  google: "Google",
  tripadvisor: "TripAdvisor",
  degusta: "Degusta",
  facebook: "Facebook",
  otro: "Otro",
};

export type PublicReview = {
  id: string;
  source: ReviewSource;
  author: string;
  authorUrl: string | null;
  authorPhoto: string | null;
  rating: number;
  body: string;
  lang: string | null;
  url: string | null;
  reply: string;
  verified: boolean;
  postedAt: string;
};

export type AdminReview = PublicReview & {
  status: ReviewStatus;
  draft: string;
  alert: ReviewAlert;
  createdAt: string;
};

export type SourceSummary = {
  source: ReviewSource;
  name: string | null;
  rating: number | null;
  total: number | null;
  url: string | null;
  syncedAt: string | null;
  error: string | null;
};

export type FeedbackQueueItem = {
  holdId: string;
  date: string;
  time: string;
  party: number;
  name: string;
  phone: string;
  channel: "telegram" | "whatsapp";
  link: string | null;
};

export type FeedbackInfo =
  | { ok: false }
  | { ok: true; firstName: string; date: string; answered: boolean; googleWriteUrl: string | null };

const UUID = /^[0-9a-f-]{36}$/;
const id = (v: unknown) => {
  if (typeof v !== "string" || !UUID.test(v)) throw new Error("id");
  return v;
};
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/* ───── public ───── */

export const listReviews = createServerFn({ method: "GET" }).handler(async () => {
  const { publicReviews } = await import("@/lib/reviews.server");
  return publicReviews();
});

export const sendReview = createServerFn({ method: "POST" })
  .validator((input: { rating: number; name: string; body: string; lang?: string; website?: string }) => {
    if (!input || typeof input.rating !== "number") throw new Error("estrellas");
    return {
      rating: input.rating,
      name: str(input.name, 120),
      body: str(input.body, 2000),
      lang: input.lang === "en" ? "en" : "es",
      website: str(input.website, 200),
    };
  })
  .handler(async ({ data }) => {
    const { postReview } = await import("@/lib/reviews.server");
    return postReview(data);
  });

export const getFeedback = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => ({ token: str(input?.token, 120) }))
  .handler(async ({ data }) => {
    const { feedbackInfo } = await import("@/lib/reviews.server");
    return feedbackInfo(data.token);
  });

export const sendFeedback = createServerFn({ method: "POST" })
  .validator((input: { token: string; rating: number; body: string; publish: boolean; lang?: string }) => {
    if (!input || typeof input.rating !== "number") throw new Error("estrellas");
    return {
      token: str(input.token, 120),
      rating: input.rating,
      body: str(input.body, 2000),
      publish: input.publish === true,
      lang: input.lang === "en" ? "en" : "es",
    };
  })
  .handler(async ({ data }) => {
    const { submitFeedback } = await import("@/lib/reviews.server");
    return submitFeedback(data);
  });

/* ───── admin (house key required; enforced server-side) ───── */

export const houseReviews = createServerFn({ method: "GET" }).handler(async () => {
  const { adminReviews } = await import("@/lib/reviews.server");
  return adminReviews();
});

export const reviewStatus = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: ReviewStatus }) => {
    if (!["pendiente", "publicada", "oculta", "privada"].includes(input?.status)) throw new Error("estado");
    return { id: id(input.id), status: input.status };
  })
  .handler(async ({ data }) => {
    const { setReviewStatus } = await import("@/lib/reviews.server");
    await setReviewStatus(data.id, data.status);
    return { ok: true };
  });

export const reviewAlert = createServerFn({ method: "POST" })
  .validator((input: { id: string; alert: ReviewAlert }) => {
    if (!["no", "abierta", "atendida"].includes(input?.alert)) throw new Error("alerta");
    return { id: id(input.id), alert: input.alert };
  })
  .handler(async ({ data }) => {
    const { setReviewAlert } = await import("@/lib/reviews.server");
    await setReviewAlert(data.id, data.alert);
    return { ok: true };
  });

export const reviewReply = createServerFn({ method: "POST" })
  .validator((input: { id: string; reply: string }) => ({ id: id(input?.id), reply: str(input?.reply, 2000) }))
  .handler(async ({ data }) => {
    const { saveReply } = await import("@/lib/reviews.server");
    await saveReply(data.id, data.reply);
    return { ok: true };
  });

export const reviewDraft = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => ({ id: id(input?.id) }))
  .handler(async ({ data }) => {
    const { draftReply } = await import("@/lib/reviews.server");
    return draftReply(data.id);
  });

export const reviewDelete = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => ({ id: id(input?.id) }))
  .handler(async ({ data }) => {
    const { deleteReview } = await import("@/lib/reviews.server");
    await deleteReview(data.id);
    return { ok: true };
  });

export const reviewImport = createServerFn({ method: "POST" })
  .validator((input: { source: ManualSource; author: string; rating: number; body: string; url?: string; date?: string }) => {
    if (!MANUAL_SOURCES.includes(input?.source)) throw new Error("fuente");
    return {
      source: input.source,
      author: str(input.author, 120),
      rating: Number(input.rating),
      body: str(input.body, 3000),
      url: str(input.url, 500),
      date: str(input.date, 10),
    };
  })
  .handler(async ({ data }) => {
    const { importReview } = await import("@/lib/reviews.server");
    return importReview(data);
  });

export const feedbackSent = createServerFn({ method: "POST" })
  .validator((input: { holdId: string }) => ({ holdId: id(input?.holdId) }))
  .handler(async ({ data }) => {
    const { markFeedbackSent } = await import("@/lib/reviews.server");
    await markFeedbackSent(data.holdId);
    return { ok: true };
  });

export const reviewSync = createServerFn({ method: "POST" }).handler(async () => {
  const { syncNow } = await import("@/lib/reviews.server");
  return syncNow();
});
