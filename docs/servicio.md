# Módulo de servicio (mesas · cocina · barra · caja) y llaves por rol

Todo en **/admin**. Cada puesto entra con su propia llave y solo ve lo que su turno necesita; solo gerencia ve costos.

| Rol | Llave (env) | Ve |
|---|---|---|
| Gerencia | `CASA_PASSWORD` | Todo: reservas, pedidos, mesas, cocina y barra en vivo, caja, reseñas, platos, tragos, insumos, semana |
| Mesero | `CASA_KEY_MESERO` | Mesas (tomar pedido, mesas abiertas, anular si nada está listo) y reservas |
| Cocina | `CASA_KEY_COCINA` | Comandas de platos, "Listo", apagar platos agotados |
| Barra y caja | `CASA_KEY_BARRA` | Comandas de tragos, caja (cobrar mesas, aceptar pedidos web), mesas, apagar tragos |

Cada llave: 10+ caracteres y distinta de las demás. Cambiar una llave cierra solo las sesiones de ese rol; cambiar `CASA_SECRET` cierra todas.

## Flujo

1. El mesero elige mesa, toca la carta (lo agotado aparece tachado), agrega notas por línea y envía.
2. Los platos van a **Cocina** y los tragos a **Barra**; cada estación marca su parte "Listo". La pantalla se actualiza sola (6 s) y puede sonar/vibrar con cada comanda nueva.
3. El mesero ve en "Mesas abiertas" qué parte ya está lista.
4. En **Caja** (en la barra) cada mesa muestra su cuenta acumulada; se elige Yappy, tarjeta o efectivo y se cobra.
5. Los **pedidos web** no llegan a cocina hasta que la barra los acepta (después de confirmar por WhatsApp), para que un pedido falso no dispare comandas.

Los precios siempre salen de la carta del servidor; el cliente nunca los envía. Las ventas de mesero también suman en "Semana".

## Pendiente / siguiente paso natural

- Pantalla fija en cocina: la misma vista "Cocina" sirve en una tablet o TV con navegador.
- Impresora de comandas o división de cuentas, si el bar lo pide.
