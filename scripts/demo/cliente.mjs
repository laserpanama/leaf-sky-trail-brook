// Recorrido 1: del cliente a la caja (sitio, reserva, pedido, mesero, cocina, barra, caja, reseñas).
// Usage (from the repo root, with the demo dev server up — see scripts/demo/README.md):
//   node scripts/demo/cliente.mjs <h|v> <outDir>
import { createKit, KEYS, B } from "./kit.mjs";

const { browser, MODE, H, wire, loginState, wait, cap, smooth, hoverClick, scene, card } = await createKit(process.argv[2], process.argv[3]);

/* ───────────── setup (not recorded) ───────────── */
const ger = await loginState(KEYS.gerencia);
const mes = await loginState(KEYS.mesero);
const coc = await loginState(KEYS.cocina);
const bar = await loginState(KEYS.barra);
{
  // Seed one guest review (published) and one Degusta import so the reviews wall isn't empty.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, storageState: ger });
  await wire(ctx);
  const p = await ctx.newPage();
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await p.locator('#resenas input[name="stars"]').nth(4).check({ force: true });
  await p.getByPlaceholder("Como quieres que aparezca").fill("Valeria");
  await p.getByPlaceholder(/Qué pediste/).fill("El Canal Mule está buenísimo y la parrillada para dos alcanzó para tres. Volvemos el viernes.");
  await p.getByRole("button", { name: "Enviar reseña" }).click();
  await p.getByText("Gracias. Tu reseña llegó a la casa.").waitFor();
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Reseñas", exact: true }).click();
  await p.waitForTimeout(1200);
  await p.locator("section", { hasText: "Todas las reseñas" }).locator("li").getByRole("button", { name: "Publicada", exact: true }).first().click();
  await p.waitForTimeout(800);
  await p.getByPlaceholder("Autor").fill("Mariela R.");
  await p.getByPlaceholder("Texto de la reseña").fill("Los chicharroncitos del Burro, un must. Atención muy amable.");
  await p.getByRole("button", { name: "Importar", exact: true }).click();
  await p.getByText("Importada.").waitFor();
  await ctx.close();
}

/* ───────────── scenes ───────────── */
await scene("intro", undefined, async (p) => {
  await p.setContent(card("Un solo sistema para todo el bar.", "Sitio, reservas, pedidos, servicio en mesa, caja y reputación — funcionando hoy."));
  await wait(3600);
});

await scene("sitio", undefined, async (p) => {
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await wait(600);
  await cap(p, "Sitio web", "Sitio propio en español e inglés, hecho para el celular");
  await wait(1600);
  await hoverClick(p, p.getByRole("button", { name: "EN", exact: true }));
  await wait(1300);
  await hoverClick(p, p.getByRole("button", { name: "ES", exact: true }));
  await smooth(p, "#carta", 70);
  await cap(p, "Carta viva", "Precios y agotados se cambian desde el panel y la web se actualiza sola");
  await wait(2400);
  await p.evaluate(() => window.scrollBy({ top: 420, behavior: "smooth" }));
  await wait(1500);
});

await scene("reserva", undefined, async (p) => {
  await p.goto(B + "/#reservar", { waitUntil: "networkidle" });
  await smooth(p, "#reservar", MODE === "h" ? 10 : 60);
  await cap(p, "Reservas", "El cliente elige día, hora y personas en segundos");
  await wait(900);
  await hoverClick(p, p.locator("#reservar td:not([data-disabled]) button").nth(4));
  await hoverClick(p, p.locator("#reservar").getByRole("button", { name: "20:00", exact: true }));
  const name = p.locator("#reservar label", { hasText: "Nombre" }).locator("input");
  await name.scrollIntoViewIfNeeded();
  await name.pressSequentially("Andrea", { delay: 70 });
  await p.getByPlaceholder("6xxx-xxxx").pressSequentially("6123-4567", { delay: 55 });
  await cap(p, "Reservas", "La reserva llega al staff por Telegram para confirmar con un toque");
  await hoverClick(p, p.locator("#reservar").getByRole("button", { name: "Enviar por WhatsApp" }));
  await wait(2000);
});

await scene("pedido-web", undefined, async (p) => {
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await smooth(p, "#barra", 70);
  await cap(p, "Pedidos", "Se pide desde la carta: tragos y platos al carrito");
  await hoverClick(p, p.getByRole("button", { name: "Pedir Canal Mule" }));
  await smooth(p, "#carta", 70);
  await hoverClick(p, p.locator("#carta").getByRole("button", { name: /^Pedir/ }).first());
  await hoverClick(p, p.getByRole("button", { name: /^Pedido/ }).first());
  await wait(500);
  await hoverClick(p, p.getByRole("button", { name: "Efectivo", exact: true }));
  await cap(p, "Pedidos", "Total con ITBMS y forma de pago: Yappy, tarjeta o efectivo");
  await wait(1600);
  await hoverClick(p, p.getByRole("button", { name: /^Pagar en efectivo/ }));
  await p.waitForURL(/wa\.me/, { timeout: 8000 }).catch(() => {});
  await wait(3200);
});

await scene("mesero", mes, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await wait(500);
  await cap(p, "Mesero · celular", "El mesero toma la comanda en su celular");
  await p.getByPlaceholder("Tu nombre").pressSequentially("Ana", { delay: 80 });
  await hoverClick(p, p.getByRole("button", { name: "Mesa 4", exact: true }));
  await smooth(p, "#carta-mesero", 10);
  await hoverClick(p, p.getByRole("button", { name: /^Canal Mule/ }).first());
  await hoverClick(p, p.getByRole("button", { name: /^Canal Mule/ }).first());
  await hoverClick(p, p.getByRole("button", { name: "Platos", exact: true }));
  await hoverClick(p, p.getByRole("button", { name: /^Chicharroncitos/ }).first());
  await cap(p, "Mesero · celular", "Notas por plato y total al instante");
  if (MODE === "v") { await hoverClick(p, p.getByRole("link", { name: /Ver comanda/ })); }
  await smooth(p, "#comanda", 10);
  const note = p.getByPlaceholder("Nota: sin hielo, término…").last();
  await note.pressSequentially("Sin cebolla", { delay: 70 });
  await wait(500);
  await hoverClick(p, p.getByRole("button", { name: "Enviar a cocina y barra" }));
  await p.getByText(/Comanda enviada a Mesa 4/).waitFor();
  await wait(1700);
});

await scene("cocina", coc, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await p.getByText("Mesa 4").first().waitFor();
  await cap(p, "Cocina", "Cocina recibe solo los platos, con la nota y los minutos de espera");
  await wait(2600);
  await hoverClick(p, p.locator("li", { hasText: "Mesa 4" }).getByRole("button", { name: "Listo", exact: true }).first());
  await cap(p, "Cocina", "Un toque en “Listo” y el mesero lo ve en su celular");
  await wait(2000);
});

await scene("barra-caja", bar, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await p.getByText("Mesa 4").first().waitFor();
  await cap(p, "Barra", "Barra recibe solo los tragos");
  await wait(1800);
  await hoverClick(p, p.locator("li", { hasText: "Mesa 4" }).getByRole("button", { name: "Listo", exact: true }).first());
  await hoverClick(p, p.getByRole("button", { name: "Caja", exact: true }));
  await p.getByRole("heading", { name: "Pedidos web" }).waitFor();
  await cap(p, "Caja", "La cuenta de cada mesa, y los pedidos web, se cobran en la barra");
  await wait(1500);
  const card4 = p.locator("li", { hasText: "Mesa 4" }).filter({ has: p.getByRole("button", { name: /^Cobrar \$/ }) }).first();
  await card4.scrollIntoViewIfNeeded();
  await wait(700);
  await hoverClick(p, card4.getByRole("button", { name: "Yappy", exact: true }));
  await hoverClick(p, card4.getByRole("button", { name: /^Cobrar \$/ }));
  await p.getByText(/Mesa 4: cobrado/).waitFor({ timeout: 8000 });
  await cap(p, "Caja", "Cobrado con Yappy: la mesa se cierra sola");
  await wait(2000);
});

await scene("resenas", undefined, async (p) => {
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await smooth(p, "#resenas", MODE === "h" ? 10 : 60);
  await cap(p, "Reputación", "Reseñas del sitio, de Google y de Degusta en un solo lugar");
  await wait(2200);
  const form = p.locator("#resenas aside");
  await form.scrollIntoViewIfNeeded();
  await p.locator('#resenas input[name="stars"]').nth(1).check({ force: true });
  await wait(500);
  await p.getByPlaceholder("Como quieres que aparezca").pressSequentially("Carlos", { delay: 70 });
  await p.getByPlaceholder(/Qué pediste/).pressSequentially("Esta vez la comida tardó casi una hora.", { delay: 35 });
  await hoverClick(p, p.getByRole("button", { name: "Enviar reseña" }));
  await p.getByText("Gracias. Tu reseña llegó a la casa.").waitFor();
  await wait(1200);
});

await scene("alerta", ger, async (p) => {
  await p.goto(B + "/admin", { waitUntil: "networkidle" });
  await hoverClick(p, p.getByRole("button", { name: "Reseñas", exact: true }));
  await p.getByRole("heading", { name: /Alertas de crisis/ }).waitFor();
  await smooth(p, "h2", 20);
  await cap(p, "Alerta de crisis", "Una reseña mala llega al staff al instante, antes de que se haga pública");
  await wait(3200);
  await cap(p, "Alerta de crisis", "Borrador de respuesta con IA, y se marca atendida al resolver");
  await hoverClick(p, p.getByRole("button", { name: /Atendida/ }).first());
  await wait(2600);
});

await scene("cierre", undefined, async (p) => {
  await p.setContent(card("Listo para La Quinta Pata.", "Cada puesto con su llave: mesero, cocina, barra y gerencia.", "PIPO LOPEZ · PIPOLOPEZ.PRO"));
  await wait(3800);
});

await browser.close();
