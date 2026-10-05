# Un restaurante nuevo = una carpeta

El mismo código sirve a varios locales. Todo lo que cambia de un cliente a otro vive en `src/venues/<slug>/`:

| Archivo | Qué lleva |
| --- | --- |
| `index.ts` | Nombre, colores, fuentes, contacto, textos ES/EN, carta (tragos y platos), horario de reservas, datos del agente y costeo. El tipo `Venue` (`src/venues/types.ts`) avisa si falta algo. |
| `public/` | Fotos (`media/`), logo, favicon, `og.jpg` para compartir, `robots.txt`, `__grok/`. |
| `site.json` | Título y color de la tarjeta para compartir. |

`VENUE=<slug>` elige el local al compilar. Sin `VENUE`, sale La Quinta Pata.

## Cómo se mantienen separados

Cada sitio tiene en el VPS su carpeta (`/var/www/<slug>`), su base de datos, su archivo de claves (`/etc/<slug>.env`), su proceso de PM2, su puerto y su dominio. Además:

- **Versión fija por sitio.** `/etc/<slug>.env` guarda `GIT_REF`, la versión que corre ese sitio (una etiqueta como `v1.3` o una rama). Mergear a `main` no cambia ningún sitio publicado: cada uno se pasa a la versión nueva a propósito.
- **Cada sitio solo puede correr como sí mismo.** La compilación deja `venue.txt` con el slug, y el deploy lo revisa antes de reemplazar el sitio publicado. El servidor también compara `VENUE` de su archivo de claves con el local compilado; si no coinciden, no muestra nada en lugar de mostrar el sitio de otro cliente.

## Comandos (en el VPS, como root)

```bash
venue-deploy status                 # todos los sitios: dominio, versión, puerto, estado
venue-deploy tresgatos              # vuelve a publicar la versión fijada
venue-deploy tresgatos v1.3         # fija la versión v1.3 y la publica
venue-deploy laquintapata v1.3      # también sirve para La Quinta Pata
```

La primera vez de un sitio pide dominio, email de SSL y clave del `/admin`. Después reutiliza todo. El comando se actualiza solo desde la versión que publica.

Instalarlo, una sola vez:

```bash
curl -fsSL https://raw.githubusercontent.com/laserpanama/leaf-sky-trail-brook/main/scripts/venue-deploy.sh -o /usr/local/bin/venue-deploy && chmod +x /usr/local/bin/venue-deploy
```

Si el repo pasa a privado, el VPS necesita un token de GitHub de solo lectura (una vez):

```bash
read -rsp "Token de GitHub (solo lectura): " T && echo && git config --global credential.helper store && printf 'https://laserpanama:%s@github.com\n' "$T" > /root/.git-credentials && chmod 600 /root/.git-credentials && git ls-remote https://github.com/laserpanama/leaf-sky-trail-brook.git HEAD >/dev/null && echo "✔ El VPS puede leer el repo"
```

## Sacar una versión

Cuando un cambio está listo y probado, se marca con una etiqueta y se publica sitio por sitio:

```bash
git tag v1.3 && git push origin v1.3
```

## Crear un local

1. Copia `src/venues/tresgatos` a `src/venues/<slug>` y edita `index.ts`.
2. Cambia las fotos de `public/media/` y el logo. Si un plato no tiene foto, pon `img: null`; con `placeholder` el plato se ve compacto con el logo.
3. Pruébalo: `VENUE=<slug> npm run dev`.
4. Publícalo: `venue-deploy <slug> <versión>`.

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
