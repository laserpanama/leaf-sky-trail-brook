# Módulo de reputación (reseñas · alerta de crisis · feedback post-visita)

Módulo reutilizable del restaurant template. Todo se maneja en **/admin → Reseñas**.

| Pieza | Qué hace |
|---|---|
| Sección pública `#resenas` | Feed de reseñas publicadas (sitio, visitas, Google, TripAdvisor, Degusta…), rating por fuente y formulario abierto a cualquiera. Lo nuevo entra **por moderar**. |
| Alerta de crisis | Toda reseña nueva con ≤ `REVIEW_ALERT_MAX` estrellas (2 por defecto) llega al chat de staff en Telegram con botones **🤖 Borrador IA** y **☑️ Atendida**. |
| Feedback post-visita | Enlace firmado `/opinion/<token>` por reserva confirmada. Reservas por Telegram lo reciben solas al día siguiente (11:00–21:00); las demás, el staff lo manda desde el panel con un toque a WhatsApp. Privado por defecto; el cliente puede autorizar publicarlo. **Todos** ven el enlace a Google (sin review gating). |
| Respuestas IA | Borrador con la voz de la casa (OpenRouter). Se publica bajo reseñas del sitio; para Google/otras se copia y pega. |
| Sync | Google Places (rating, total, hasta 5 reseñas "relevantes") y TripAdvisor Content API (hasta 5 recientes) cada `REVIEWS_SYNC_HOURS` (12 h). Google se borra a los 30 días (términos de Google). |
| Importación manual | Degusta, Facebook u otras sin API. |

## Variables de entorno (todas opcionales)

```
GOOGLE_PLACES_API_KEY=      # activa Google
GOOGLE_PLACE_ID=            # opcional; si falta se busca con GOOGLE_PLACE_QUERY y se guarda
GOOGLE_PLACE_QUERY=         # por defecto: nombre + dirección de agent/config.ts
TRIPADVISOR_API_KEY=        # activa TripAdvisor (requiere dominio/IP autorizado en su consola)
TRIPADVISOR_LOCATION_ID=    # opcional; si falta se busca con TRIPADVISOR_QUERY
REVIEW_ALERT_MAX=2          # estrellas que disparan alerta (1–4)
REVIEWS_AUTO_PUBLISH=0      # 1 = publica reseñas del sitio sin moderación (las que traen enlaces siguen esperando)
REVIEWS_SYNC_HOURS=12
REVIEW_MODEL=               # opcional; por defecto AGENT_MODEL
```

Reutiliza `CASA_SECRET` (firma de enlaces), `PUBLIC_SITE_URL`, `OPENROUTER_API_KEY` y el bot/chat de Telegram del agente de reservas.

## Límites honestos

- Sin acceso al Google Business Profile, Google solo entrega 5 reseñas por consulta y no necesariamente las más nuevas: la alerta de Google puede perder alguna. Las reseñas del sitio y del feedback post-visita se capturan todas.
- Responder en Google desde el panel requiere el GBP; mientras tanto, copiar y pegar.
- Anti-spam: honeypot + límite por IP (2 cada 10 min, 5/día) + tope global (150/día).
