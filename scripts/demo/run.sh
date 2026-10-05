#!/usr/bin/env bash
# Records the two demo tours (cliente + panel) in horizontal and vertical and builds four MP4s.
#   bash scripts/demo/run.sh [outDir]          (default: demo-out/)
# Starts a LOCAL dev server with demo keys and an in-memory database for every take, so each
# recording starts from clean data. Never touches production. Needs ffmpeg and Playwright's Chromium.
# Optional env: PW_CHROME (Chromium binary), DEMO_FONT_DIR (local @fontsource folder when Google Fonts is blocked).
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="$(mkdir -p "${1:-demo-out}" && cd "${1:-demo-out}" && pwd)"
command -v ffmpeg >/dev/null || { echo "Falta ffmpeg"; exit 1; }
[ -z "${DATABASE_URL:-}" ] || { echo "DATABASE_URL está definido: la demo usa la base en memoria. Quítalo antes de correrla."; exit 1; }

start_server() {
  pkill -f "[v]ite dev" 2>/dev/null || true; sleep 2
  CASA_PASSWORD=gerencia-llave-123 CASA_KEY_MESERO=mesero-llave-123 CASA_KEY_COCINA=cocina-llave-123 \
  CASA_KEY_BARRA=barra-llave-1234 CASA_SECRET=demo-secret-not-for-production-0123456789 \
    nohup npm run dev > "$OUT/dev.log" 2>&1 &
  for _ in $(seq 1 90); do curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/ | grep -q 200 && break; sleep 1; done
  curl -s -o /dev/null http://127.0.0.1:8080/admin
}

build() { # build <clipDir> <W> <H> <out.mp4>
  local dir=$1 w=$2 h=$3 mp4=$4
  rm -f "$dir"/list.txt "$dir"/c-*.mp4 "$dir"/page@*.webm
  for f in "$dir"/[0-9][0-9]-*.webm; do
    local c="$dir/c-$(basename "${f%.webm}").mp4"
    ffmpeg -loglevel error -y -ss 0.4 -i "$f" -vf "scale=$w:$h:flags=lanczos,fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 20 -an "$c"
    echo "file '$c'" >> "$dir/list.txt"
  done
  ffmpeg -loglevel error -y -f concat -safe 0 -i "$dir/list.txt" -c copy -movflags +faststart "$mp4"
  echo "✔ $mp4"
}

for tour in cliente panel; do
  for m in h v; do
    start_server
    rm -rf "$OUT/$tour-$m"
    node "scripts/demo/$tour.mjs" "$m" "$OUT/$tour-$m"
    if [ "$m" = h ]; then build "$OUT/$tour-$m" 1280 720 "$OUT/$tour-horizontal.mp4"; else build "$OUT/$tour-$m" 1080 1920 "$OUT/$tour-vertical.mp4"; fi
  done
done
pkill -f "[v]ite dev" 2>/dev/null || true
ls -la "$OUT"/*.mp4
