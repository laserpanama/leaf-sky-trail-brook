import { env } from "@/lib/env.server";

/**
 * Minimal Telegram Bot API client. One bot serves two roles:
 *  - guests DM it to reserve (same agent as the web chat)
 *  - the staff chat (TELEGRAM_STAFF_CHAT_ID) gets alerts with Confirm / Decline buttons
 */

const API = "https://api.telegram.org";

function token() {
  return env("TELEGRAM_BOT_TOKEN");
}

export function telegramEnabled() {
  return Boolean(token());
}

export function staffChatId() {
  return env("TELEGRAM_STAFF_CHAT_ID");
}

type Button = { text: string; callback_data: string };

async function call(method: string, body: Record<string, unknown>) {
  const t = token();
  if (!t) return null;
  try {
    const res = await fetch(`${API}/bot${t}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json()) as { ok: boolean; result?: unknown; description?: string };
    if (!json.ok) console.error(`[telegram] ${method} failed:`, json.description);
    return json.ok ? json.result : null;
  } catch (err) {
    console.error(`[telegram] ${method} error:`, err);
    return null;
  }
}

export function sendMessage(chatId: string | number, text: string, buttons?: Button[][]) {
  return call("sendMessage", {
    chat_id: chatId,
    text: text.slice(0, 4000),
    disable_web_page_preview: true,
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
}

export function editMessage(chatId: string | number, messageId: number, text: string) {
  return call("editMessageText", { chat_id: chatId, message_id: messageId, text: text.slice(0, 4000) });
}

export function answerCallback(id: string, text: string) {
  return call("answerCallbackQuery", { callback_query_id: id, text });
}

export function sendTyping(chatId: string | number) {
  return call("sendChatAction", { chat_id: chatId, action: "typing" });
}

export type StaffHold = {
  id: string;
  date: string;
  time: string;
  party: number;
  name: string;
  phone: string;
  notes?: string;
  code?: string | null;
  status: string;
  source: string;
};

export function holdSummary(h: StaffHold) {
  const lines = [
    `${h.name} · ${h.party} pers.`,
    `${h.date} · ${h.time}`,
    `Tel: ${h.phone}`,
    h.code ? `Código: ${h.code}` : "",
    h.notes ? `Nota: ${h.notes}` : "",
    `Canal: ${h.source}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Alert staff. Pending holds get Confirm / Decline buttons. */
export async function notifyStaff(h: StaffHold, kind: "nueva" | "cancelada") {
  const chat = staffChatId();
  if (!chat) return;
  if (kind === "cancelada") {
    await sendMessage(chat, `❌ Reserva cancelada por el cliente\n${holdSummary(h)}`);
    return;
  }
  if (h.status === "pendiente") {
    await sendMessage(chat, `🟡 Reserva por aprobar\n${holdSummary(h)}`, [
      [
        { text: "✅ Confirmar", callback_data: `ok:${h.id}` },
        { text: "✖️ Rechazar", callback_data: `no:${h.id}` },
      ],
    ]);
    return;
  }
  await sendMessage(chat, `🟢 Reserva confirmada (auto)\n${holdSummary(h)}`, [
    [{ text: "✖️ Anular", callback_data: `no:${h.id}` }],
  ]);
}
