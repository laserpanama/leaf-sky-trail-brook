# Videos de demo

Graba los dos recorridos del sistema con datos de prueba, en horizontal (1280×720) y vertical (1080×1920):

| Archivo | Recorrido | Duración aprox. |
| --- | --- | --- |
| `cliente-*.mp4` | Del cliente a la caja: sitio ES/EN, reserva, pedido web, comanda del mesero, cocina, barra y cobro, reseña y alerta de crisis | 1:40 |
| `panel-*.mp4` | El panel de la casa: llave, reservas, pedidos, mesas, cocina y barra en vivo, caja, reseñas, costeo e insumos, reporte semanal, qué ve cada llave | 2:07 |

```bash
bash scripts/demo/run.sh demo-out
```

`run.sh` levanta un servidor de desarrollo local con llaves de demo y la base en memoria, y lo reinicia antes de cada toma para que todas empiecen limpias. Se niega a correr si `DATABASE_URL` está definido, y `kit.mjs` solo acepta un servidor en `127.0.0.1` o `localhost`. La demo nunca toca producción.

Requisitos: `ffmpeg` y el Chromium de Playwright. Variables opcionales:

- `PW_CHROME`: ruta al binario de Chromium si Playwright no lo encuentra solo.
- `DEMO_FONT_DIR`: carpeta `node_modules/@fontsource` con `cormorant-garamond` y `outfit`, cuando Google Fonts está bloqueado.

## Archivos

- `kit.mjs`: navegador, cursor visible, subtítulos, tarjetas de título y una grabación por escena. Los enlaces a WhatsApp se interceptan: muestran el mensaje armado y no se envía nada.
- `seed.mjs`: carga datos de prueba por la interfaz real (5 reservas, 3 pedidos web, 4 comandas, cobros, 4 reseñas y 2 importadas, conteos de la semana).
- `cliente.mjs` y `panel.mjs`: las escenas de cada recorrido.

## Para otro cliente

Cambiar la carta y la marca en la app, ajustar textos de subtítulos y tarjetas en `cliente.mjs` y `panel.mjs` (y el nombre en `kit.mjs`), y volver a correr `run.sh`. Si un selector deja de existir, el script se detiene en la escena que falló.

El costeo de platos solo se muestra si las recetas tienen costo; con platos en $0 el reporte de cocina engaña, por eso el recorrido del panel enseña el de barra.
