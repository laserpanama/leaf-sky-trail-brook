#!/usr/bin/env bash
# Reservation agent setup — run ON THE VPS from the app directory:
#   bash scripts/agent-setup.sh
# Asks for the OpenRouter key and Telegram bot token, finds the staff chat,
# writes env vars next to the existing CASA_PASSWORD, registers the Telegram
# webhook, and redeploys. Safe to re-run (keys are replaced, not duplicated).
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

# 1. Find where this app's secrets already live (same place as CASA_PASSWORD).
ENV_FILE="$(grep -rlsE '^(export )?CASA_PASSWORD=' .env .env.production ecosystem.config.* 2>/dev/null | head -1 || true)"
if [[ -z "$ENV_FILE" ]]; then
  read -rp "No file with CASA_PASSWORD found. Env file to write [.env]: " ENV_FILE
  ENV_FILE="${ENV_FILE:-.env}"
fi
case "$ENV_FILE" in
  *.js|*.cjs|*.json) echo "Secrets live in $ENV_FILE (PM2 ecosystem). Add the vars printed below there by hand."; MANUAL=1 ;;
  *) MANUAL=0 ;;
esac

read -rp "Site URL [https://laquintapata.pipolopez.pro]: " SITE_URL
SITE_URL="${SITE_URL:-https://laquintapata.pipolopez.pro}"
read -rsp "OpenRouter API key: " OR_KEY; echo
read -rp "Model [deepseek/deepseek-chat]: " MODEL; MODEL="${MODEL:-deepseek/deepseek-chat}"
read -rp "Covers per 30-min slot [24]: " COVERS; COVERS="${COVERS:-24}"
read -rp "Auto-confirm parties up to [8]: " AUTOMAX; AUTOMAX="${AUTOMAX:-8}"
read -rsp "Telegram bot token (from @BotFather, blank to skip Telegram): " TG_TOKEN; echo

STAFF_CHAT=""
TG_SECRET=""
if [[ -n "$TG_TOKEN" ]]; then
  # Webhook must be off for getUpdates to show recent chats.
  curl -fsS "https://api.telegram.org/bot${TG_TOKEN}/deleteWebhook" >/dev/null
  echo "Add the bot to the staff group and send any message there. Press Enter when done."
  read -r _
  curl -fsS "https://api.telegram.org/bot${TG_TOKEN}/getUpdates" | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      const seen=new Map();
      for (const u of JSON.parse(s).result||[]) { const c=(u.message||u.my_chat_member||{}).chat; if (c) seen.set(c.id, `${c.type} · ${c.title||c.username||c.first_name}`); }
      for (const [id,label] of seen) console.log(`  ${id}  ${label}`);
      if (!seen.size) console.log("  (no chats yet)");
    });'
  read -rp "Staff chat id from the list above: " STAFF_CHAT
  TG_SECRET="$(node -e 'console.log(require("crypto").randomBytes(24).toString("hex"))')"
fi

VARS=(
  "OPENROUTER_API_KEY=$OR_KEY"
  "AGENT_MODEL=$MODEL"
  "AGENT_COVERS_PER_SLOT=$COVERS"
  "AGENT_AUTO_MAX_PARTY=$AUTOMAX"
  "PUBLIC_SITE_URL=$SITE_URL"
)
[[ -n "$TG_TOKEN" ]] && VARS+=("TELEGRAM_BOT_TOKEN=$TG_TOKEN" "TELEGRAM_STAFF_CHAT_ID=$STAFF_CHAT" "TELEGRAM_WEBHOOK_SECRET=$TG_SECRET")

if [[ "$MANUAL" == 1 ]]; then
  printf '  %s\n' "${VARS[@]}"
  read -rp "Press Enter once they are in $ENV_FILE…" _
else
  touch "$ENV_FILE"; chmod 600 "$ENV_FILE"
  for kv in "${VARS[@]}"; do
    key="${kv%%=*}"
    grep -vE "^(export )?${key}=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
    mv "$ENV_FILE.tmp" "$ENV_FILE"
    printf '%s\n' "$kv" >> "$ENV_FILE"
  done
  echo "Wrote ${#VARS[@]} vars to $ENV_FILE"
fi

# Redeploy (runs migrations, restarts PM2).
if command -v lqp-deploy >/dev/null; then lqp-deploy; else echo "lqp-deploy not found — redeploy the app manually."; fi

if [[ -n "$TG_TOKEN" ]]; then
  curl -fsS "https://api.telegram.org/bot${TG_TOKEN}/setWebhook" \
    -d "url=${SITE_URL}/api/agent/telegram" \
    -d "secret_token=${TG_SECRET}" \
    -d 'allowed_updates=["message","callback_query"]' && echo
fi

sleep 3
echo -n "Agent status: "; curl -fsS "${SITE_URL}/api/agent/chat" && echo
