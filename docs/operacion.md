# Operación en el VPS

Todo se corre como root en el VPS, un comando por tarea. `lqp-deploy` regenera `/etc/laquintapata.env`, le agrega `/etc/laquintapata.extra.env`, compila, aplica migraciones y reinicia PM2 (puerto 3120, detrás de Nginx). Ningún comando de aquí imprime valores de llaves.

## Publicar cambios de `main`

```bash
cd /var/www/laquintapata && git fetch origin && git merge --ff-only origin/main && lqp-deploy
```

## Agregar o cambiar una llave del servidor

Pide el nombre y el valor; el valor no se ve al escribirlo.

```bash
read -rp "Variable: " K && read -rsp "Valor: " V && echo && F=/etc/laquintapata.extra.env && { grep -v "^$K=" "$F" 2>/dev/null; printf "%s='%s'\n" "$K" "$V"; } > "$F.tmp" && install -m 600 "$F.tmp" "$F" && rm "$F.tmp" && lqp-deploy && grep -c "^$K=" /etc/laquintapata.env
```

Variables de módulos: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_STAFF_CHAT_ID`, `GOOGLE_PLACES_API_KEY`, `TRIPADVISOR_API_KEY`, `OPENROUTER_API_KEY` (ver `docs/reputacion.md` y `docs/reservation-agent.md`).

## Rotar las llaves de mesero, cocina y barra

Cierra la sesión de esos celulares e imprime las llaves nuevas. Rotar cuando alguien del staff se va y cada 6 meses.

```bash
sed -i '/^CASA_KEY_/d' /etc/laquintapata.extra.env && bash /var/www/laquintapata/scripts/servicio-setup.sh
```

La de gerencia (`CASA_PASSWORD`) se cambia con el comando de llaves.

## Respaldo diario de la base

Ya existe en el VPS: cada día a las 03:30 (hora del servidor) queda `/var/backups/laquintapata/lqp-AAAA-MM-DD.dump`, en formato de `pg_dump -Fc`. Antes de cambios grandes se guardan copias con prefijo (`pre-entrega-…`, `pre-pedidos-…`). Para ver de dónde sale el job:

```bash
crontab -l 2>/dev/null | grep -i lqp; grep -ril laquintapata /etc/cron.d /etc/cron.daily 2>/dev/null
```

Comprobar que el último respaldo se puede leer (no toca la base):

```bash
F=$(ls -t /var/backups/laquintapata/lqp-*.dump | head -1) && echo "$F" && pg_restore --list "$F" | grep -cE "TABLE DATA"
```

Falta copiarlo fuera del VPS una vez por semana: un respaldo en el mismo servidor no sirve si se pierde el servidor. Restaurar siempre primero en una base aparte, nunca encima de la de producción.

## Volver a una versión anterior

Las migraciones de base no se deshacen. Antes de usarlo, confirmar que `lqp-deploy` no hace `git pull` ni `reset`; si lo hace, revertir con un commit en `main`.

```bash
cd /var/www/laquintapata && git log --oneline -8 && read -rp "Commit al que volver: " C && git checkout "$C" && lqp-deploy
```

Al terminar, `git checkout main` y publicar el arreglo normal.

## Revisión rápida de salud

```bash
pm2 ls && pm2 logs --lines 40 --nostream 2>&1 | grep -iE "error|fail" | tail -20; curl -s -o /dev/null -w "sitio %{http_code}\n" https://laquintapata.pipolopez.pro/ && ls -lt /var/backups/laquintapata | head -3
```

## Rutina

| Cuándo | Qué |
| --- | --- |
| Cada lunes | Saldo de OpenRouter, revisión de salud, alertas de reseñas abiertas |
| Cada mes | Uso de Google Places y TripAdvisor en sus consolas |
| Cada 6 meses | Rotar llaves, actualizar dependencias, probar una restauración del respaldo en una base aparte |

## Videos de demo

`bash scripts/demo/run.sh demo-out` graba los recorridos con datos de prueba en un servidor local (ver `scripts/demo/README.md`).
