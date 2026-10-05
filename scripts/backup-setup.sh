#!/usr/bin/env bash
# Daily Postgres backup for La Quinta Pata — run ON THE VPS as root:
#   bash /var/www/laquintapata/scripts/backup-setup.sh
# Installs a cron job (04:30 every day) that dumps the app database to
# /var/backups/laquintapata/YYYY-MM-DD.sql.gz and keeps 14 days, then runs one backup now.
# Safe to re-run: the cron line is replaced, never duplicated. Prints no secrets.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Ejecuta como root"; exit 1; }
ENVF=/etc/laquintapata.env
DEST=/var/backups/laquintapata
[ -f "$ENVF" ] || { echo "No encontré $ENVF"; exit 1; }
command -v pg_dump >/dev/null || { echo "Falta pg_dump (apt install postgresql-client)"; exit 1; }
mkdir -p "$DEST" && chmod 700 "$DEST"

JOB="30 4 * * * set -a && . $ENVF && set +a && pg_dump \"\$DATABASE_URL\" | gzip > $DEST/\$(date +\\%F).sql.gz && find $DEST -name '*.sql.gz' -mtime +14 -delete # lqp-backup"
( crontab -l 2>/dev/null | grep -v 'lqp-backup' ; echo "$JOB" ) | crontab -
echo "✔ Respaldo diario programado a las 4:30"

( set -a && . "$ENVF" && set +a && pg_dump "$DATABASE_URL" | gzip > "$DEST/$(date +%F).sql.gz" )
ls -lh "$DEST" | tail -3
echo "Copia esta carpeta fuera del VPS una vez por semana: un respaldo en el mismo servidor no sirve si se pierde el servidor."
