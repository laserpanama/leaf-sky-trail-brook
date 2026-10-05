#!/usr/bin/env bash
# Floor-service keys setup — run ON THE VPS from the app directory:
#   bash scripts/servicio-setup.sh
# Creates one key per station (mesero, cocina, barra) next to CASA_PASSWORD,
# keeps any key that is already set, redeploys and prints the keys to hand out.
# Safe to re-run.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

ENV_FILE="$(grep -rlsE '^(export )?CASA_PASSWORD=' .env .env.production ecosystem.config.* 2>/dev/null | head -1 || true)"
if [[ -z "$ENV_FILE" ]]; then
  read -rp "No file with CASA_PASSWORD found. Env file to write [.env]: " ENV_FILE
  ENV_FILE="${ENV_FILE:-.env}"
fi
case "$ENV_FILE" in
  *.js|*.cjs|*.json) MANUAL=1 ;;
  *) MANUAL=0 ;;
esac

# Short, speakable keys staff can type on a phone: word-ish prefix + 8 random chars.
newkey() { printf '%s-%s' "$1" "$(node -e 'const c="abcdefghjkmnpqrstuvwxyz23456789";let s="";for(const b of require("crypto").randomBytes(8))s+=c[b%c.length];console.log(s)')"; }

declare -A KEYS
for pair in "CASA_KEY_MESERO:mesero" "CASA_KEY_COCINA:cocina" "CASA_KEY_BARRA:barra"; do
  var="${pair%%:*}"; word="${pair##*:}"
  current="$(grep -E "^(export )?${var}=" "$ENV_FILE" 2>/dev/null | tail -1 | sed -E "s/^(export )?${var}=//" || true)"
  if [[ ${#current} -ge 10 ]]; then KEYS[$var]="$current"; else KEYS[$var]="$(newkey "$word")"; fi
done

if [[ "$MANUAL" == 1 ]]; then
  echo "Secrets live in $ENV_FILE (PM2 ecosystem). Add these by hand, then run lqp-deploy:"
  for var in CASA_KEY_MESERO CASA_KEY_COCINA CASA_KEY_BARRA; do echo "  $var=${KEYS[$var]}"; done
  exit 0
fi

touch "$ENV_FILE"; chmod 600 "$ENV_FILE"
for var in CASA_KEY_MESERO CASA_KEY_COCINA CASA_KEY_BARRA; do
  grep -vE "^(export )?${var}=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
  mv "$ENV_FILE.tmp" "$ENV_FILE"
  printf '%s=%s\n' "$var" "${KEYS[$var]}" >> "$ENV_FILE"
done
chmod 600 "$ENV_FILE"

# Redeploy (pulls, builds, runs migrations 0006 + 0007, restarts PM2).
if command -v lqp-deploy >/dev/null; then lqp-deploy; else echo "lqp-deploy not found — redeploy the app manually."; fi

SITE="$(grep -E '^(export )?PUBLIC_SITE_URL=' "$ENV_FILE" | tail -1 | sed -E 's/^(export )?PUBLIC_SITE_URL=//' || true)"
SITE="${SITE:-https://laquintapata.pipolopez.pro}"
sleep 3
echo
echo "Panel: ${SITE}/admin   (status $(curl -s -o /dev/null -w '%{http_code}' "${SITE}/admin"))"
echo "Llaves para entregar al staff:"
echo "  Mesero:        ${KEYS[CASA_KEY_MESERO]}"
echo "  Cocina:        ${KEYS[CASA_KEY_COCINA]}"
echo "  Barra y caja:  ${KEYS[CASA_KEY_BARRA]}"
echo "  Gerencia:      la CASA_PASSWORD de siempre"
