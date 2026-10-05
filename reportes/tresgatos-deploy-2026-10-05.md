# Deploy Tres Gatos — 2026-10-05

- ✅ **0) LQP antes**: `LQP 200` · status online · restarts 0 · uptime 85m
- ✅ **1) Instalar comando**: `OK`
- ✅ **2) /etc/tresgatos.env**: creado manualmente por Pipo (mi intento fue denegado; no se recreó). Claves presentes: DOMAIN, CERT_EMAIL, CASA_PASSWORD (+ las que añadió venue-deploy: VENUE, GIT_REF, PUBLIC_SITE_URL, PORT, HOST, NODE_ENV, VITE_AUTH_ENABLED, DB_PASS, DATABASE_URL, CASA_SECRET)
- ⚠️ **3) DNS**: `getent ahostsv4 demo-tresgatos.pipolopez.pro` → vacío (no resuelve). Falta registro A → 76.13.114.136 en Hostinger.
- ✅ **4) Deploy**: último log:
  `App local: HTTP 200`
  `✔ tresgatos en 451b4d5 → https://demo-tresgatos.pipolopez.pro · Panel → .../admin`
  `⚠ demo-tresgatos.pipolopez.pro apunta a 'nada', no a 76.13.114.136 ... (sin HTTPS el /admin no deja iniciar sesión)`
- ✅ **5) Verificación**:
  ```
  SITIO            DOMINIO                              VERSIÓN       PUERTO PM2
  laquintapata     laquintapata.pipolopez.pro                          3120   online
  tresgatos        demo-tresgatos.pipolopez.pro         venue-template 3121   online
  venue.txt → tresgatos
  <title>Cervecería Tres Gatos — Taproom en Ciudad de Panamá
  LQP 200 · status online · restarts 0 · uptime 90m
  ```
  LQP sin cambios (restarts 0 antes y después).
- ⏳ **6) Pendiente**: tras crear el registro A, correr `venue-deploy tresgatos` para emitir SSL.
