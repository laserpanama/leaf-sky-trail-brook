# La Quinta Pata — sitio y sistema de la casa

Sitio web y sistema operativo de **La Quinta Pata Gastro Bar** (Ciudad de Panamá): carta bilingüe, reservas, pedidos web, agente de reservas con IA, servicio en piso (mesas · cocina · barra · caja), costeo y reputación, todo en una sola app.

Producción: **https://laquintapata.pipolopez.pro** · Panel: **/admin**

> Construido como base del *restaurant template*: casi todo es reutilizable para otro restaurante cambiando carta, marca y `src/lib/agent/config.ts`.

---

## Qué incluye

| Módulo | Para quién | Qué hace |
| --- | --- | --- |
| **Sitio público** | Clientes | Carta de cocina y barra (ES/EN), noches de fútbol y música, ubicación, reseñas. Platos o tragos agotados se apagan desde el panel. |
| **Reservas** | Clientes · staff | Calendario por bloques de 30 min con capacidad por bloque (`holds`). Avisa al grupo de staff en Telegram. |
| **Pedidos web** | Clientes · barra | Carrito → WhatsApp con el pedido armado. Pago por Yappy, tarjeta o efectivo. No llega a cocina hasta que la barra lo acepta. |
| **Agente de reservas** | Clientes | Chat en el sitio + bot de Telegram (OpenRouter). Confirma solo dentro de las reglas de capacidad; grupos grandes pasan a staff con botones ✅/✖️. → [`docs/reservation-agent.md`](docs/reservation-agent.md) |
| **Servicio en piso** | Mesero · cocina · barra | Comandas por mesa, pantallas en vivo de cocina y barra, caja. Una llave por puesto. → [`docs/servicio.md`](docs/servicio.md) |
| **Reputación** | Gerencia | Reseñas del sitio con moderación, sync de Google Places y TripAdvisor, alerta de crisis (≤ 2★) en Telegram, borrador de respuesta con IA, feedback post-visita por enlace firmado. → [`docs/reputacion.md`](docs/reputacion.md) |
| **Costeo e insumos** | Gerencia | Costo por plato y por trago, insumos, reporte semanal de ventas y mano de obra. Los Excel de costeo solo se descargan con sesión de gerencia (`/casa/:file`). |

### Llaves del panel

| Rol | Variable | Ve |
| --- | --- | --- |
| Gerencia | `CASA_PASSWORD` | Todo, incluidos costos |
| Mesero | `CASA_KEY_MESERO` | Mesas y reservas |
| Cocina | `CASA_KEY_COCINA` | Comandas de platos |
| Barra y caja | `CASA_KEY_BARRA` | Comandas de tragos, caja, pedidos web |

`CASA_SECRET` firma las sesiones y los enlaces de feedback; cambiarlo cierra todas las sesiones.

---

## Stack

- **TanStack Start** (React 19, Router, Query) + **Vite 8** + **Nitro**
- **Tailwind CSS v4** + Radix UI
- **Postgres** en producción · **PGLite** (Postgres en WASM) en local cuando no hay `DATABASE_URL`
- **OpenRouter** para el agente y las respuestas a reseñas (por defecto `deepseek/deepseek-chat`)
- **Telegram Bot API** para reservas y alertas al staff
- Producción en VPS: **PM2 + Nginx** (puerto 3120), desplegado con `lqp-deploy`

---

## Desarrollo local

Requiere Node 22.

```bash
npm install && npm run dev
```

Abre `http://localhost:8080`. Sin `DATABASE_URL` usa PGLite en memoria y aplica las migraciones al arrancar, así que no hace falta instalar Postgres.

| Script | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `:8080` |
| `npm run build` | Compila y aplica migraciones (`db:migrate`) |
| `npm run typecheck` | TypeScript sin emitir |
| `npm test` | Pruebas de scripts, auth y reglas del agente |
| `npm run lint` / `npm run format` | ESLint / Prettier |

> Usa siempre los scripts de npm, no `vite` directo: `scripts/with-app-env.mjs` inyecta las variables que el build necesita.

---

## Variables de entorno

Todas opcionales salvo las del núcleo. Un módulo sin sus llaves se oculta solo (por ejemplo, el chat no aparece sin `OPENROUTER_API_KEY`).

| Grupo | Variables |
| --- | --- |
| Núcleo | `DATABASE_URL`, `CASA_PASSWORD`, `CASA_SECRET`, `PUBLIC_SITE_URL` |
| Llaves de puesto | `CASA_KEY_MESERO`, `CASA_KEY_COCINA`, `CASA_KEY_BARRA` |
| Agente | `OPENROUTER_API_KEY`, `AGENT_MODEL`, `AGENT_COVERS_PER_SLOT` (24), `AGENT_AUTO_MAX_PARTY` (8), `AGENT_MAX_PARTY` (20), `AGENT_MIN_LEAD_MIN` (60), `AGENT_CLOSED_WEEKDAYS` |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_STAFF_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` |
| Reseñas | `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, `GOOGLE_PLACE_QUERY`, `TRIPADVISOR_API_KEY`, `TRIPADVISOR_LOCATION_ID`, `TRIPADVISOR_QUERY`, `REVIEW_ALERT_MAX` (2), `REVIEWS_AUTO_PUBLISH` (0), `REVIEWS_SYNC_HOURS` (12), `REVIEW_MODEL` |

No se versiona ningún `.env`. En el VPS, `/etc/laquintapata.env` lo regenera `lqp-deploy` y las llaves de módulos viven en `/etc/laquintapata.extra.env` (permisos 600).

---

## Producción (VPS)

Publicar lo último de `main`:

```bash
cd /var/www/laquintapata && git fetch origin && git merge --ff-only origin/main && lqp-deploy
```

`lqp-deploy` regenera el env, compila, aplica migraciones y reinicia PM2.

| Tarea | Comando |
| --- | --- |
| Configurar agente y Telegram | `bash scripts/agent-setup.sh` |
| Crear o rotar llaves de puesto | `bash /var/www/laquintapata/scripts/servicio-setup.sh` |
| Agregar llaves, rollback, revisar salud, respaldos | [`docs/operacion.md`](docs/operacion.md) |

Respaldo diario de la base a las 03:30 en `/var/backups/laquintapata/` (`pg_dump -Fc`). Falta copiarlo fuera del VPS.

### Migraciones

Archivos en `migrations/`, en orden y **solo hacia adelante**: lo aplicado queda registrado en `_migrations` y no se vuelve a correr. Un cambio de esquema = un archivo nuevo (`0008_*.sql`); nunca editar uno ya aplicado.

---

## Estructura

```
src/
  routes/          index (sitio), admin (panel), opinion.$token (feedback),
                   api/agent/{chat,telegram}, casa/$file (Excel protegidos)
  components/      site, cart-drawer, agent-chat, servicio, cocina, costeo,
                   insumos, reputacion, reviews-section
  lib/
    agent/         núcleo del agente: config, reglas puras, reservas, Telegram
    books/         motor de costeo (barra, cocina)
    casa*.ts       sesión del panel, roles y operaciones
    copy.ts        carta pública y textos ES/EN
    drinks, plates márgenes y estado de barra y cocina
    reviews*, service*, holds, slots, cart, pour, labor, web-sales
migrations/        esquema SQL ordenado
scripts/           setup del VPS, migraciones, QA y videos de demo
docs/              operación, servicio, reputación, agente
```

---

## Videos de demo

```bash
bash scripts/demo/run.sh demo-out
```

Graba el recorrido del cliente y el del panel con datos de prueba en un servidor local (horizontal y vertical). Nunca toca producción. Detalles en [`scripts/demo/README.md`](scripts/demo/README.md).

---

## Reutilizar para otro restaurante

1. Carta pública, textos ES/EN y WhatsApp: `src/lib/copy.ts`.
2. Recetas, costos y precios de barra y cocina: `src/lib/books/` (márgenes objetivo en `drinks.ts` y `plates.ts`).
3. Datos de la casa, horarios y reglas de reserva: `src/lib/agent/config.ts`.
4. Marca: `src/styles.css`, `public/media/`, `public/img/`, `src/lib/og/site.json`.
5. Nuevo env en el VPS, un `lqp-deploy` equivalente y el webhook de Telegram con `scripts/agent-setup.sh`.

---

## Nota sobre el origen

El proyecto se generó en Grok Build; `AGENTS.md` y `.grok/` son instrucciones de esa herramienta y no afectan la app en producción.
