import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/copy";

type Line = { from: "guest" | "host"; text: string };

const T = {
  es: {
    open: "Reservar por chat",
    title: "Reservas",
    sub: "Te confirmo al momento si hay mesa.",
    hello: "¡Hola! ¿Para qué día, a qué hora y cuántas personas?",
    ph: "Ej.: viernes 8 p. m., 4 personas",
    send: "Enviar",
    close: "Cerrar chat",
    wait: "Muchos mensajes seguidos. Espera unos minutos o escríbenos por WhatsApp.",
    error: "No pude responder. Intenta otra vez o escríbenos por WhatsApp.",
    typing: "Escribiendo…",
  },
  en: {
    open: "Book by chat",
    title: "Reservations",
    sub: "I'll confirm right away if there's a table.",
    hello: "Hi! What day, what time, and how many people?",
    ph: "e.g. Friday 8 pm, 4 people",
    send: "Send",
    close: "Close chat",
    wait: "Too many messages in a row. Wait a few minutes or message us on WhatsApp.",
    error: "I couldn't answer. Try again or message us on WhatsApp.",
    typing: "Typing…",
  },
} as const;

function sessionId() {
  try {
    const saved = window.localStorage.getItem("lqp-agent-session");
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem("lqp-agent-session", fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

/** Floating reservation chat. Renders nothing until the server says the agent is on. */
export function AgentChat({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const session = useRef<string>("");
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    session.current = sessionId();
    fetch("/api/agent/chat")
      .then((r) => r.json())
      .then((j: { enabled?: boolean }) => setEnabled(Boolean(j.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [lines, busy]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setLines((l) => [...l, { from: "guest", text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session: session.current, message: text }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string };
      const reply = res.status === 429 ? t.wait : body.reply?.trim() || t.error;
      setLines((l) => [...l, { from: "host", text: reply }]);
    } catch {
      setLines((l) => [...l, { from: "host", text: t.error }]);
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-20 z-40 flex min-h-12 items-center gap-2 rounded-full border border-brass/60 bg-surface px-5 text-sm text-fg shadow-lg shadow-black/40 transition hover:border-brass md:right-6 md:bottom-6"
      >
        <span aria-hidden className="h-2 w-2 rounded-full bg-brass" />
        {t.open}
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label={t.title}
      className="fixed inset-x-3 bottom-20 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/60 md:inset-x-auto md:right-6 md:bottom-6 md:w-[380px]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-display text-2xl italic leading-none">{t.title}</p>
          <p className="mt-1 text-xs text-muted">{t.sub}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.close}
          className="-mr-1 flex h-9 w-9 items-center justify-center rounded text-muted hover:text-fg"
        >
          ✕
        </button>
      </header>

      <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm" aria-live="polite">
        <Bubble from="host" text={t.hello} />
        {lines.map((line, i) => (
          <Bubble key={i} {...line} />
        ))}
        {busy && <p className="text-xs text-muted">{t.typing}</p>}
      </div>

      <form
        className="flex items-end gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          ref={input}
          rows={1}
          value={draft}
          maxLength={800}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={t.ph}
          className="max-h-28 min-h-11 flex-1 resize-none rounded border border-line bg-bg px-3 py-2.5 text-base text-fg placeholder:text-muted focus:border-brass focus:outline-none md:text-sm"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="min-h-11 rounded bg-brass px-4 text-sm text-ink disabled:opacity-40"
        >
          {t.send}
        </button>
      </form>
    </section>
  );
}

function Bubble({ from, text }: Line) {
  const guest = from === "guest";
  return (
    <div className={guest ? "flex justify-end" : "flex justify-start"}>
      <p
        className={
          guest
            ? "max-w-[85%] whitespace-pre-wrap break-words rounded-lg rounded-br-sm bg-brass px-3 py-2 text-ink"
            : "max-w-[85%] whitespace-pre-wrap break-words rounded-lg rounded-bl-sm bg-bg px-3 py-2 text-fg"
        }
      >
        {text}
      </p>
    </div>
  );
}
