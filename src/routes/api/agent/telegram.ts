import { createFileRoute } from "@tanstack/react-router";

type Update = {
  message?: { chat: { id: number; type: string }; text?: string; from?: { language_code?: string } };
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number }; message_id: number; text?: string };
    from?: { first_name?: string };
  };
};

const ok = () => new Response("ok");

// Telegram webhook: guests DM the bot to reserve; staff chat gets Confirm/Decline buttons.
export const Route = createFileRoute("/api/agent/telegram")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { env } = await import("@/lib/env.server");
        const secret = env("TELEGRAM_WEBHOOK_SECRET");
        // Fail closed: no secret configured, or a mismatch, means nobody gets in.
        if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
          return new Response("forbidden", { status: 403 });
        }
        let update: Update;
        try {
          update = await request.json();
        } catch {
          return ok();
        }
        const tg = await import("@/lib/agent/telegram.server");
        const staff = tg.staffChatId();

        const cb = update.callback_query;
        if (cb) {
          const chatId = cb.message?.chat.id;
          if (!staff || String(chatId) !== staff) {
            await tg.answerCallback(cb.id, "No autorizado");
            return ok();
          }
          const [action, id] = (cb.data ?? "").split(":");
          // Reputation module buttons: publish / hide / AI draft / handled.
          if (action?.startsWith("rv-") && id) {
            const { handleStaffButton } = await import("@/lib/reviews.server");
            const result = await handleStaffButton(action, id);
            const who = cb.from?.first_name ?? "staff";
            await tg.answerCallback(cb.id, result.toast);
            if (result.reply && cb.message) {
              await tg.sendMessage(cb.message.chat.id, result.reply);
            } else if (cb.message && action === "rv-done") {
              // Only closing the alert removes the buttons; publish/hide keep the AI-draft button usable.
              await tg.editMessage(cb.message.chat.id, cb.message.message_id, `${result.toast} · ${who}\n${cb.message.text ?? ""}`);
            }
            return ok();
          }
          if ((action !== "ok" && action !== "no") || !id) return ok();
          const { setStatusById } = await import("@/lib/agent/booking.server");
          const row = await setStatusById(id, action === "ok" ? "confirmada" : "no");
          if (!row) {
            await tg.answerCallback(cb.id, "Reserva no encontrada");
            return ok();
          }
          const who = cb.from?.first_name ?? "staff";
          const label = action === "ok" ? `✅ Confirmada por ${who}` : `✖️ Rechazada por ${who}`;
          await tg.answerCallback(cb.id, label);
          if (cb.message) await tg.editMessage(cb.message.chat.id, cb.message.message_id, `${label}\n${cb.message.text ?? ""}`);
          // Close the loop with the guest when they booked through Telegram.
          if (row.thread_id?.startsWith("telegram:")) {
            const guestChat = row.thread_id.slice("telegram:".length);
            const text =
              action === "ok"
                ? `¡Listo! Tu reserva ${row.code ?? ""} del ${row.day} a las ${row.slot} para ${row.party} quedó confirmada.`
                : `Lo sentimos, no pudimos confirmar tu reserva ${row.code ?? ""} del ${row.day} a las ${row.slot}. Escríbenos y buscamos otra hora.`;
            await tg.sendMessage(guestChat, text.replace(/\s+/g, " "));
          }
          return ok();
        }

        const msg = update.message;
        if (!msg?.text || msg.chat.type !== "private") return ok(); // guests only in DMs; staff group is alerts-only
        if (staff && String(msg.chat.id) === staff) return ok();
        const { agentEnabled, runAgent } = await import("@/lib/agent/agent.server");
        if (!agentEnabled()) return ok();
        if (msg.text.startsWith("/start")) {
          const { agentConfig } = await import("@/lib/agent/config");
          await tg.sendMessage(
            msg.chat.id,
            `¡Hola! Soy el asistente de reservas de ${agentConfig().restaurant.name}. ¿Para qué día, a qué hora y cuántas personas? / Hi! Tell me the day, time and party size.`,
          );
          return ok();
        }
        // Ack Telegram immediately (it retries slow webhooks → duplicate replies); answer in the background.
        const chatId = msg.chat.id;
        const text = msg.text;
        void (async () => {
          await tg.sendTyping(chatId);
          const { reply } = await runAgent({ threadId: `telegram:${chatId}`, channel: "telegram", text });
          if (reply) await tg.sendMessage(chatId, reply);
        })().catch((err) => console.error("[telegram] agent turn failed", err));
        return ok();
      },
    },
  },
});
