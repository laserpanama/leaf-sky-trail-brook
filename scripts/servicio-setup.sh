#!/usr/bin/env bash
# Floor-service keys setup — run ON THE VPS as root:
#   bash /var/www/laquintapata/scripts/servicio-setup.sh
#
# lqp-deploy rewrites /etc/laquintapata.env from scratch on every deploy, so module
# keys can't live there. This script:
#   1. keeps them in /etc/laquintapata.extra.env (created 600, never overwritten),
#   2. patches lqp-deploy once so it appends that file after regenerating the main env,
#   3. moves over any module vars left in the app's old .env (agent / Telegram),
#   4. creates one key per station (keeps existing ones), redeploys, prints the keys.
# Safe to re-run.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Ejecuta como root"; exit 1; }

APP=laquintapata
DIR=/var/www/$APP
ENVF=/etc/$APP.env
EXTRA=/etc/$APP.extra.env
DEPLOY="$(command -v lqp-deploy || true)"
[ -n "$DEPLOY" ] || { echo "No encontré lqp-deploy"; exit 1; }

# 1. Extra env file.
touch "$EXTRA"; chmod 600 "$EXTRA"

setvar() { # setvar NAME VALUE  → replace or add in $EXTRA
  grep -vE "^(export )?$1=" "$EXTRA" > "$EXTRA.tmp" || true
  printf "%s='%s'\n" "$1" "$2" >> "$EXTRA.tmp"
  mv "$EXTRA.tmp" "$EXTRA"; chmod 600 "$EXTRA"
}
getvar() { grep -E "^(export )?$1=" "$EXTRA" 2>/dev/null | tail -1 | sed -E "s/^(export )?$1=//; s/^'(.*)'$/\1/; s/^\"(.*)\"$/\1/" || true; }

# 2. Patch lqp-deploy once (backup kept next to it).
if ! grep -q "$APP.extra.env" "$DEPLOY"; then
  cp "$DEPLOY" "$DEPLOY.bak.$(date +%Y%m%d%H%M%S)"
  # Right after the heredoc that regenerates $ENVF ("umask 022"), append the extras.
  sed -i "0,/^umask 022\$/s//umask 022\n[ -f \/etc\/\$APP.extra.env ] \&\& cat \/etc\/\$APP.extra.env >> \"\$ENVF\"/" "$DEPLOY"
  grep -q "$APP.extra.env" "$DEPLOY" || { echo "No pude parchear $DEPLOY"; exit 1; }
  echo "✔ lqp-deploy ahora conserva $EXTRA en cada deploy"
fi

# 3. Rescue module vars written to the app's .env by older setup scripts.
CORE='^(export )?(DOMAIN|CERT_EMAIL|PORT|HOST|NODE_ENV|VITE_AUTH_ENABLED|DB_PASS|DATABASE_URL|CASA_PASSWORD|CASA_SECRET)='
for f in "$DIR/.env" "$DIR/.env.production"; do
  [ -f "$f" ] || continue
  while IFS= read -r line; do
    [[ "$line" =~ ^(export\ )?([A-Z][A-Z0-9_]*)=(.*)$ ]] || continue
    name="${BASH_REMATCH[2]}"; value="${BASH_REMATCH[3]}"; value="${value#\'}"; value="${value%\'}"; value="${value#\"}"; value="${value%\"}"
    [[ "$line" =~ $CORE ]] && continue
    [ -n "$(getvar "$name")" ] || { setvar "$name" "$value"; echo "  movida $name desde $f"; }
  done < "$f"
done

# 4. Station keys: short and typeable on a phone; existing ones are kept.
newkey() { printf '%s-%s' "$1" "$(node -e 'const c="abcdefghjkmnpqrstuvwxyz23456789";let s="";for(const b of require("crypto").randomBytes(8))s+=c[b%c.length];console.log(s)')"; }
for pair in CASA_KEY_MESERO:mesero CASA_KEY_COCINA:cocina CASA_KEY_BARRA:barra; do
  var="${pair%%:*}"; word="${pair##*:}"
  current="$(getvar "$var")"
  [ ${#current} -ge 10 ] || setvar "$var" "$(newkey "$word")"
done

# Redeploy: regenerates the env (now + extras), builds, runs migrations 0006 + 0007, restarts PM2.
"$DEPLOY"

grep -q '^CASA_KEY_MESERO=' "$ENVF" && echo "✔ Llaves activas en $ENVF" || echo "⚠ Las llaves no llegaron a $ENVF: revisa $DEPLOY"
echo
echo "Llaves para entregar al staff (panel: /admin):"
echo "  Mesero:        $(getvar CASA_KEY_MESERO)"
echo "  Cocina:        $(getvar CASA_KEY_COCINA)"
echo "  Barra y caja:  $(getvar CASA_KEY_BARRA)"
echo "  Gerencia:      tu CASA_PASSWORD de siempre"
