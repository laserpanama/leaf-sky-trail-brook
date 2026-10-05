#!/usr/bin/env bash
# Deploy one venue of the restaurant template on the VPS (same recipe as lqp-deploy).
#   venue-deploy <slug> [branch]      e.g.  venue-deploy tresgatos
# First run asks for domain, SSL email and the /admin password; later runs reuse
# /etc/<slug>.env and only pull + build + restart. Each venue gets its own folder,
# Postgres database, PM2 process and port (first free from 3120).
set -euo pipefail
SLUG=${1:-}; BRANCH=${2:-}
[[ "$SLUG" =~ ^[a-z0-9-]+$ ]] || { echo "Uso: venue-deploy <slug> [rama]"; exit 1; }
[ "$SLUG" = laquintapata ] && { echo "La Quinta Pata se publica con lqp-deploy"; exit 1; }
APP=$SLUG; DIR=/var/www/$APP; ENVF=/etc/$APP.env; EXTRA=/etc/$APP.extra.env
REPO=https://github.com/laserpanama/leaf-sky-trail-brook.git
DB=$(echo "$APP" | tr '-' '_')
[ "$(id -u)" = 0 ] || { echo "Ejecuta como root"; exit 1; }
[ -f "$ENVF" ] && { set -a; . "$ENVF"; set +a; }
BRANCH=${BRANCH:-${GIT_BRANCH:-main}}
if [ -z "${DOMAIN:-}" ]; then read -rp "Dominio [demo-$APP.pipolopez.pro]: " DOMAIN; DOMAIN=${DOMAIN:-demo-$APP.pipolopez.pro}; fi
if [ -z "${CERT_EMAIL:-}" ]; then read -rp "Email para SSL (Let's Encrypt): " CERT_EMAIL; fi
if [ -z "${CASA_PASSWORD:-}" ]; then while :; do read -rsp "Clave del panel /admin (mín. 10, sin comillas simples): " CASA_PASSWORD; echo; [ ${#CASA_PASSWORD} -ge 10 ] && [[ "$CASA_PASSWORD" != *"'"* ]] && break; echo "Clave inválida"; done; fi
if [ -z "${PORT:-}" ]; then PORT=3120; while ss -ltn | grep -q ":$PORT " || grep -qs "^PORT='$PORT'" /etc/*.env; do PORT=$((PORT+1)); done; fi
CASA_SECRET=${CASA_SECRET:-$(openssl rand -hex 32)}; DB_PASS=${DB_PASS:-$(openssl rand -hex 24)}
command -v node >/dev/null || { echo "Falta Node.js"; exit 1; }
command -v pm2 >/dev/null || npm i -g pm2 --silent
PSQL="runuser -u postgres -- psql -v ON_ERROR_STOP=1 -qtAc"
[ "$($PSQL "SELECT 1 FROM pg_roles WHERE rolname='$DB'")" = 1 ] || $PSQL "CREATE ROLE $DB LOGIN"
$PSQL "ALTER ROLE $DB PASSWORD '$DB_PASS'"
[ "$($PSQL "SELECT 1 FROM pg_database WHERE datname='$DB'")" = 1 ] || runuser -u postgres -- createdb -O "$DB" "$DB"
umask 077; cat > "$ENVF" << EOF
VENUE='$APP'
GIT_BRANCH='$BRANCH'
DOMAIN='$DOMAIN'
PUBLIC_SITE_URL='https://$DOMAIN'
CERT_EMAIL='$CERT_EMAIL'
PORT='$PORT'
HOST='127.0.0.1'
NODE_ENV='production'
VITE_AUTH_ENABLED='false'
DB_PASS='$DB_PASS'
DATABASE_URL='postgres://$DB:$DB_PASS@127.0.0.1:5432/$DB'
CASA_PASSWORD='$CASA_PASSWORD'
CASA_SECRET='$CASA_SECRET'
EOF
[ -f "$EXTRA" ] && cat "$EXTRA" >> "$ENVF"
umask 022
if [ -d "$DIR/.git" ]; then git -C "$DIR" fetch -q origin "$BRANCH" && git -C "$DIR" checkout -q -B "$BRANCH" "origin/$BRANCH" && git -C "$DIR" reset -q --hard "origin/$BRANCH"; else git clone -q -b "$BRANCH" "$REPO" "$DIR"; fi
cd "$DIR"
[ -f "src/venues/$APP/index.ts" ] || { echo "No existe src/venues/$APP en la rama $BRANCH"; exit 1; }
sed -i 's/preset: "vercel"/preset: "node-server"/' vite.config.ts
grep -q 'preset: "node-server"' vite.config.ts || { echo "No pude cambiar el preset de Nitro"; exit 1; }
NODE_ENV=development npm install --include=dev --no-audit --no-fund --loglevel=error
set -a; . "$ENVF"; set +a
npm run build
pm2 delete "$APP" >/dev/null 2>&1 || true
pm2 start "$DIR/.output/server/index.mjs" --name "$APP" --node-args="--env-file=$ENVF" --time
pm2 save >/dev/null
cat > /etc/nginx/sites-available/$APP << EOF
server {
  listen 80;
  listen [::]:80;
  server_name $DOMAIN;
  client_max_body_size 5m;
  location /assets/ {
    proxy_pass http://127.0.0.1:$PORT;
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF
ln -sf /etc/nginx/sites-available/$APP /etc/nginx/sites-enabled/$APP
nginx -t -q && systemctl reload nginx
IP=$(curl -s4 --max-time 5 https://ifconfig.me || true); DNS=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)
if [ -n "$DNS" ] && [ "$DNS" = "$IP" ]; then
  certbot --nginx -d "$DOMAIN" -m "$CERT_EMAIL" --agree-tos --non-interactive --redirect --keep-until-expiring -q || echo "⚠ Falló el SSL; revisa: certbot certificates"
else
  echo "⚠ $DOMAIN apunta a '${DNS:-nada}', no a $IP. Crea el registro A y vuelve a correr: venue-deploy $APP (sin HTTPS el /admin no deja iniciar sesión)"
fi
sleep 3
curl -fsS -o /dev/null -w "App local: HTTP %{http_code}\n" "http://127.0.0.1:$PORT/" || { pm2 logs "$APP" --lines 40 --nostream; exit 1; }
echo "✔ Listo → https://$DOMAIN  ·  Panel → https://$DOMAIN/admin  ·  Actualizar → venue-deploy $APP"
