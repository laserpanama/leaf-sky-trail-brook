# Un restaurante nuevo = una carpeta

El mismo código sirve a varios locales. Todo lo que cambia de un cliente a otro vive en `src/venues/<slug>/`:

| Archivo | Qué lleva |
| --- | --- |
| `index.ts` | Nombre, colores, fuentes, contacto, textos ES/EN, carta (tragos y platos), horario de reservas, datos del agente y costeo. El tipo `Venue` (`src/venues/types.ts`) avisa si falta algo. |
| `public/` | Fotos (`media/`), logo, favicon, `og.jpg` para compartir, `robots.txt`, `__grok/`. |
| `site.json` | Título y color de la tarjeta para compartir. |

`VENUE=<slug>` elige el local al compilar. Sin `VENUE`, sale La Quinta Pata, así que `lqp-deploy` no cambia.

## Crear uno

1. Copia `src/venues/tresgatos` a `src/venues/<slug>` y edita `index.ts`.
2. Cambia las fotos de `public/media/` y el logo. Si un plato no tiene foto, pon `img: null`; con `placeholder` el plato se ve compacto con el logo.
3. Pruébalo: `VENUE=<slug> npm run dev`.
4. Publícalo en el VPS: `venue-deploy <slug> [rama]`. Pide dominio, email de SSL y clave del `/admin` la primera vez, y crea una base, un proceso de PM2 y un puerto propios.

Instalar el comando en el VPS, una sola vez:

```bash
curl -fsSL https://raw.githubusercontent.com/laserpanama/leaf-sky-trail-brook/main/scripts/venue-deploy.sh -o /usr/local/bin/venue-deploy && chmod +x /usr/local/bin/venue-deploy
```

## Opciones por local

- `layout.drinksFirst`: bares y taprooms muestran primero la barra; restaurantes, la comida.
- `theme.displayStyle`: `italic` para una serif como la de La Quinta Pata y `normal` para una condensada.
- `contact.yappy: null`: oculta Yappy en el carrito.
- `booking.closedWeekdays`: días que no se reserva. Quedan bloqueados en el calendario y en el servidor.
- `menu.drinkLabels` y `menu.plateLabels`: renombran las secciones de la carta, por ejemplo "Clásico" como "Edición especial".

## Antes de entregar un demo

- Cambia `contact.whatsapp` del número de prueba al del local.
- Confirma carta, precios, horario y formas de pago con la casa.
- Quita la línea "Demo preparada por…" de `legal2`.
