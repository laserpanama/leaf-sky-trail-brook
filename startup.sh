#!/bin/sh
# Restart contract: bring the preview back on 0.0.0.0:8080 via npm run dev.
set -e
cd /workspace
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >/tmp/dev-server.log 2>&1 &
exit 0
