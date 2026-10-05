// Recorrido 2: el panel de la casa (todas las pestañas de gerencia y lo que ve cada llave).
// Usage (from the repo root, with the demo dev server up — see scripts/demo/README.md):
//   node scripts/demo/panel.mjs <h|v> <outDir>
import { createKit, KEYS, B } from "./kit.mjs";
import { seed } from "./seed.mjs";
const { browser, MODE, H, wire, loginState, wait, cap, smooth, hoverClick, scene, card } = await createKit(process.argv[2], process.argv[3]);

const S = {
  ger: await loginState(KEYS.gerencia),
  mes: await loginState(KEYS.mesero),
  coc: await loginState(KEYS.cocina),
  bar: await loginState(KEYS.barra),
};
await seed(browser, wire, S);


/* ───────────── admin scenes ───────────── */
async function tab(p, name) { await hoverClick(p, p.getByRole("button", { name, exact: true }).first()); await wait(900); await p.evaluate(() => window.scrollTo({ top: 0 })); }
async function heading(p, text, off = 20) {
  await p.evaluate(([t, o]) => { const el = [...document.querySelectorAll("h1,h2")].find((h) => h.textContent.includes(t)); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - o, behavior: "smooth" }); }, [text, off]);
  await wait(1100);
}
async function glide(p, px, ms = 1400) { await p.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), px); await wait(ms); }

await scene("intro", undefined, async (p) => {
  await p.setContent(card("El panel de la casa.", "Reservas, pedidos, servicio, caja, reputación y costos. Una llave por puesto."));
  await wait(3600);
});

await scene("login", undefined, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await cap(p, "Acceso", "Cada puesto entra con su propia llave: gerencia, mesero, cocina y barra");
  await wait(900);
  const pw = p.locator('input[type="password"]');
  await pw.hover(); await pw.click();
  await pw.pressSequentially(KEYS.gerencia, { delay: 45 });
  await hoverClick(p, p.getByRole("button", { name: "Entrar" }));
  await p.getByRole("button", { name: "Semana", exact: true }).waitFor();
  await cap(p, "Gerencia", "Gerencia ve todas las pestañas");
  await wait(2600);
});

await scene("reservas", S.ger, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await tab(p, "Reservas");
  await cap(p, "Reservas", "Las solicitudes de la web llegan aquí y al Telegram del staff");
  await wait(1500);
  const row = p.locator("li", { hasText: "Luis Batista" });
  await hoverClick(p, row.getByRole("button", { name: "Confirmada", exact: true }));
  await cap(p, "Reservas", "Se confirma con un toque; el teléfono abre WhatsApp con el cliente");
  await wait(1200);
  await hoverClick(p, p.getByRole("button", { name: "Todas", exact: true }).first());
  await wait(1800);
});

await scene("pedidos", S.ger, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await tab(p, "Pedidos");
  await cap(p, "Pedidos web", "Cada pedido con productos, forma de pago y si ya se cobró");
  await wait(2200);
  await glide(p, H ? 260 : 420);
  await hoverClick(p, p.getByRole("button", { name: "Todas", exact: true }).first());
  await wait(1600);
});

await scene("vivo", S.ger, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await tab(p, "Mesas");
  await heading(p, "Mesas abiertas");
  await cap(p, "Mesas", "Mesas abiertas: qué pidió cada una y en qué va cocina y barra");
  await wait(2400);
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await wait(700);
  await tab(p, "Cocina en vivo");
  await cap(p, "Cocina en vivo", "Lo mismo que ve el celular de cocina, con aviso sonoro");
  await wait(2200);
  await hoverClick(p, p.getByRole("button", { name: "Agotados", exact: true }));
  await cap(p, "Agotados", "Si se acaba un plato, se apaga aquí y desaparece de la carta web");
  await wait(2400);
  await tab(p, "Barra en vivo");
  await cap(p, "Barra en vivo", "La barra ve solo los tragos");
  await wait(2200);
});

await scene("caja", S.ger, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await tab(p, "Caja");
  await cap(p, "Caja", "Pedidos web por aceptar y cuentas abiertas por mesa");
  await wait(2000);
  await heading(p, "Mesas", H ? 20 : 10);
  const t = p.locator("li", { hasText: "Mesa 5" }).filter({ has: p.getByRole("button", { name: /^Cobrar \$/ }) }).first();
  await hoverClick(p, t.getByRole("button", { name: "Tarjeta", exact: true }));
  await hoverClick(p, t.getByRole("button", { name: /^Cobrar \$/ }));
  await p.getByText(/Mesa 5: cobrado/).waitFor({ timeout: 8000 });
  await cap(p, "Caja", "Cobrada con tarjeta: entra al reporte de la semana sola");
  await wait(2200);
});

await scene("resenas", S.ger, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await tab(p, "Reseñas");
  await cap(p, "Reputación", "Calificación, alertas abiertas y reseñas por moderar de un vistazo");
  await wait(2600);
  await heading(p, "Alertas de crisis");
  await cap(p, "Alerta de crisis", "Las de 1–2★ quedan en privado hasta que la casa las atiende");
  await wait(2600);
  await heading(p, "Pedir opinión");
  await cap(p, "Pedir opinión", "Al día siguiente de la visita se pide la opinión al cliente");
  await wait(2200);
  await heading(p, "Importar a mano");
  await cap(p, "Fuentes", "Google y TripAdvisor se sincronizan solos; Degusta se importa en segundos");
  await wait(2800);
});

await scene("costos", S.ger, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await tab(p, "Tragos");
  await cap(p, "Costeo de tragos", "Costo por receta y precio de cada trago. La web nunca lo muestra");
  await wait(2600);
  await tab(p, "Insumos");
  await cap(p, "Insumos", "Cambia el precio de compra y todas las recetas se recalculan");
  const buy = p.getByLabel("Costo de compra, Panza de cerdo");
  await buy.evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.38, behavior: "smooth" }));
  await wait(1000);
  await buy.hover(); await wait(300);
  await buy.click();
  await wait(400);
  await buy.fill("4.25");
  await wait(2600);
});

await scene("semana", S.ger, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await tab(p, "Semana");
  await hoverClick(p, p.getByRole("button", { name: "Barra", exact: true }).first());
  await heading(p, "Costo semanal", H ? 10 : 10);
  await cap(p, "Reporte semanal", "Ventas, costo y costo % de la semana: web se suma sola, lo local se anota");
  await wait(2800);
  await heading(p, "Cócteles que más salen");
  await cap(p, "Reporte semanal", "Los más vendidos, su margen en dólares y cuáles pasan el 20%");
  await wait(3000);
});

await scene("roles", undefined, async (p) => {
  for (const [key, who, text] of [
    [KEYS.mesero, "Mesero", "El mesero solo ve Mesas y Reservas"],
    [KEYS.cocina, "Cocina", "Cocina solo ve sus pedidos"],
    [KEYS.barra, "Barra", "La barra ve Barra, Caja y Mesas, porque la caja está en la barra"],
  ]) {
    await p.goto(B + "/admin", { waitUntil: "networkidle" });
    const salir = p.getByRole("button", { name: "Salir", exact: true });
    if (await salir.count()) { await salir.first().click(); await wait(800); }
    const pw = p.locator('input[type="password"]');
    await pw.click();
    await pw.pressSequentially(key, { delay: 30 });
    await p.getByRole("button", { name: "Entrar" }).click();
    await wait(1200);
    await cap(p, `Llave de ${who.toLowerCase()}`, text);
    await wait(2600);
  }
});

await scene("cierre", undefined, async (p) => {
  await p.setContent(card("Todo el bar, en un panel.", "Funciona en el celular, la tablet o la computadora de la barra.", "PIPO LOPEZ · PIPOLOPEZ.PRO"));
  await wait(3800);
});

await browser.close();
