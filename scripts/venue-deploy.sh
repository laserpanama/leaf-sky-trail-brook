#!/usr/bin/env bash
# One deploy command for every restaurant site on the VPS.
#   venue-deploy <slug>            redeploy the version pinned in /etc/<slug>.env
#   venue-deploy <slug> <ref>      pin a new version (tag like v1.3, or a branch) and deploy it
#   venue-deploy status            list every site: domain, pinned version, port, PM2 state
# Each site has its own folder, database, env file, PM2 process, port and domain. The
# version is pinned per site, so merging new code changes no live site until you move
# that site to it on purpose. First run asks for domain, SSL email and /admin password.
set -euo pipefail
REPO=${REPO_URL:-https://github.com/laserpanama/leaf-sky-trail-brook.git}
[ "$(id -u)" = 0 ] || { echo "Ejecuta como root"; exit 1; }

if [ "${1:-}" = status ]; then
  printf "%-16s %-36s %-14s %-6s %s\n" SITIO DOMINIO VERSIÓN PUERTO PM2
  for f in /etc/*.env; do
    s=$(basename "$f" .env); [ -d "/var/www/$s/.git" ] || continue
    v() { grep -m1 "^$1=" "$f" | cut -d= -f2- | tr -d "'"; }
    st=$(pm2 jlist 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const p=JSON.parse(d||"[]").find(x=>x.name===process.argv[1]);console.log(p?p.pm2_env.status:"-")})' "$s")
    printf "%-16s %-36s %-14s %-6s %s\n" "$s" "$(v DOMAIN)" "$(v GIT_REF || true)" "$(v PORT)" "$st"
  done
  exit 0
fi

SLUG=${1:-}; NEW_REF=${2:-}
[[ "$SLUG" =~ ^[a-z0-9-]+$ ]] || { echo "Uso: venue-deploy <slug> [versión]  ·  venue-deploy status"; exit 1; }
APP=$SLUG; DIR=/var/www/$APP; ENVF=/etc/$APP.env; EXTRA=/etc/$APP.extra.env
DB=$(echo "$APP" | tr '-' '_')
[ -f "$ENVF" ] && { set -a; . "$ENVF"; set +a; }
REF=${NEW_REF:-${GIT_REF:-main}}
# 1. Code at the pinned version (tag or branch). Nothing else on the VPS changes yet.
FRESH=0; [ -d "$DIR/.git" ] || { git clone -q "$REPO" "$DIR"; FRESH=1; }
git -C "$DIR" fetch -q --tags --force origin
if git -C "$DIR" rev-parse -q --verify "refs/tags/$REF^{commit}" >/dev/null; then
  git -C "$DIR" checkout -q --force --detach "refs/tags/$REF"
else
  git -C "$DIR" fetch -q origin "$REF" 2>/dev/null || { echo "No existe la versión ni la rama '$REF'"; [ "$FRESH" = 1 ] && rm -rf "$DIR"; exit 1; }
  git -C "$DIR" checkout -q --force -B "$REF" FETCH_HEAD
fi
cd "$DIR"
[ -f "src/venues/$APP/index.ts" ] || { echo "La versión '$REF' no tiene src/venues/$APP"; cd /; [ "$FRESH" = 1 ] && rm -rf "$DIR"; exit 1; }

# 2. Settings: asked once, then reused from the env file.
[ "$APP" = laquintapata ] && DEFAULT_DOMAIN=laquintapata.pipolopez.pro || DEFAULT_DOMAIN=demo-$APP.pipolopez.pro
if [ -z "${DOMAIN:-}" ]; then read -rp "Dominio [$DEFAULT_DOMAIN]: " DOMAIN; DOMAIN=${DOMAIN:-$DEFAULT_DOMAIN}; fi
if [ -z "${CERT_EMAIL:-}" ]; then read -rp "Email para SSL (Let's Encrypt): " CERT_EMAIL; fi
if [ -z "${CASA_PASSWORD:-}" ]; then while :; do read -rsp "Clave del panel /admin (mín. 10, sin comillas simples): " CASA_PASSWORD; echo; [ ${#CASA_PASSWORD} -ge 10 ] && [[ "$CASA_PASSWORD" != *"'"* ]] && break; echo "Clave inválida"; done; fi
if [ -z "${PORT:-}" ]; then PORT=3120; while ss -ltn | grep -q ":$PORT " || grep -qs "^PORT='$PORT'" /etc/*.env; do PORT=$((PORT+1)); done; fi
CASA_SECRET=${CASA_SECRET:-$(openssl rand -hex 32)}; DB_PASS=${DB_PASS:-$(openssl rand -hex 24)}
command -v node >/dev/null || { echo "Falta Node.js"; exit 1; }
command -v pm2 >/dev/null || npm i -g pm2 --silent

# 3. Database and env file (secrets reused on every run).
PSQL="runuser -u postgres -- psql -v ON_ERROR_STOP=1 -qtAc"
[ "$($PSQL "SELECT 1 FROM pg_roles WHERE rolname='$DB'")" = 1 ] || $PSQL "CREATE ROLE $DB LOGIN"
$PSQL "ALTER ROLE $DB PASSWORD '$DB_PASS'"
[ "$($PSQL "SELECT 1 FROM pg_database WHERE datname='$DB'")" = 1 ] || runuser -u postgres -- createdb -O "$DB" "$DB"
umask 077; cat > "$ENVF" << EOF
VENUE='$APP'
GIT_REF='$REF'
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

# 4. Build this venue and check the stamp before touching the running site.
sed -i 's/preset: "vercel"/preset: "node-server"/' vite.config.ts
grep -q 'preset: "node-server"' vite.config.ts || { echo "No pude cambiar el preset de Nitro"; exit 1; }
NODE_ENV=development npm install --include=dev --no-audit --no-fund --loglevel=error
set -a; . "$ENVF"; set +a
npm run build
[ "$(cat .output/public/venue.txt 2>/dev/null)" = "$APP" ] || { echo "✖ La compilación no es de $APP; el sitio publicado no se tocó"; exit 1; }

# 5. Swap the process, Nginx and SSL.
pm2 delete "$APP" >/dev/null 2>&1 || true
pm2 start "$DIR/.output/server/index.mjs" --name "$APP" --node-args="--env-file=$ENVF" --time
pm2 save >/dev/null; pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
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

# 6. The running site must answer as this venue.
sleep 3
curl -fsS -o /dev/null -w "App local: HTTP %{http_code}\n" "http://127.0.0.1:$PORT/" || { pm2 logs "$APP" --lines 40 --nostream; exit 1; }
[ "$(curl -fsS "http://127.0.0.1:$PORT/venue.txt")" = "$APP" ] || { echo "✖ El puerto $PORT no está sirviendo $APP"; exit 1; }
install -m 755 "$DIR/scripts/venue-deploy.sh" /usr/local/bin/venue-deploy
echo "✔ $APP en $(git -C "$DIR" describe --tags --always) → https://$DOMAIN  ·  Panel → https://$DOMAIN/admin"
