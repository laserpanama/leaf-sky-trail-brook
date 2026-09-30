# Reservation agent

An LLM host that takes reservations over **web chat** (floating button on the site) and **Telegram** (guests DM the bot), and alerts staff in a Telegram group with Confirm / Decline buttons. WhatsApp plugs into the same core later.

## How it works

```
guest ─ web chat ─┐                                   ┌─ Telegram staff group
                  ├─ runAgent (OpenRouter tool loop) ─┤   🟢 auto-confirmed · 🟡 needs approval [✅][✖️]
guest ─ Telegram ─┘        │                          └─ guest gets the outcome in Telegram
                           ▼
          booking.server.ts → rules.ts (pure) → holds table (Postgres)
```

- The model never writes SQL. It can only call `check_availability`, `create_reservation`, `find_reservations`, `cancel_reservation`, `escalate_to_staff`.
- Capacity is **covers per 30-min slot**. Web-form requests, chat bookings and staff decisions all count against the same `holds` table (anything not `no`).
- Parties ≤ `AGENT_AUTO_MAX_PARTY` confirm instantly; bigger parties are saved as `pendiente` and staff decide from Telegram. Nothing is refused for size alone up to `AGENT_MAX_PARTY`.
- Bookings get a 5-character code. Cancelling needs code + the phone used.
- The web reservation form now also pings the staff group.

## Guardrails (in code, not just the prompt)

| Limit | Value |
|---|---|
| Tool rounds per guest message | 5 |
| Tokens per completion | 450 |
| Turns per thread per day | 60 |
| Web chat per IP | 30 msgs / 10 min, 600 / hour global |
| Telegram webhook | rejected unless `TELEGRAM_WEBHOOK_SECRET` matches (fails closed) |
| Staff buttons | only accepted from `TELEGRAM_STAFF_CHAT_ID` |
| Overbooking | per-date lock + conditional insert (tested with 5 concurrent bookings) |

If OpenRouter fails, the guest gets a WhatsApp handoff message — and any booking code already created.

## Env vars

| Var | Required | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | yes (chat hidden without it) | — |
| `AGENT_MODEL` | no | `deepseek/deepseek-chat` |
| `AGENT_COVERS_PER_SLOT` | no | 24 |
| `AGENT_AUTO_MAX_PARTY` | no | 8 |
| `AGENT_MAX_PARTY` | no | 20 |
| `AGENT_MIN_LEAD_MIN` | no | 60 |
| `AGENT_CLOSED_WEEKDAYS` | no | none (e.g. `1` = Mondays) |
| `TELEGRAM_BOT_TOKEN` | for Telegram | — |
| `TELEGRAM_STAFF_CHAT_ID` | for staff alerts | — |
| `TELEGRAM_WEBHOOK_SECRET` | for Telegram | — |
| `PUBLIC_SITE_URL` | no | — |
| `AGENT_API_BASE` | no (tests / other providers) | OpenRouter |

## Setup on the VPS

From the app directory: `bash scripts/agent-setup.sh` — prompts for keys, finds the staff chat id, writes the env next to `CASA_PASSWORD`, runs `lqp-deploy`, registers the webhook.

## Reusing for another restaurant

Edit `src/lib/agent/config.ts` only: name, address, facts the agent may state, slots, capacity. Everything else is restaurant-agnostic.

## Adding WhatsApp later

Add `src/routes/api/agent/whatsapp.ts` that verifies the Meta signature, calls `runAgent({ threadId: "whatsapp:<wa_id>", channel: "whatsapp", text })`, and sends the reply via the Cloud API. No changes to the agent or booking core.
