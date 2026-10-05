// Seeds realistic demo data through the real UI (never production). Rotates X-Forwarded-For so
// the per-IP rate limits of the local dev server don't block the seed.
import { B } from "./kit.mjs";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let ipN = 10;

async function ctxAs(browser, wire, state, viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, storageState: state, extraHTTPHeaders: { "x-forwarded-for": `10.0.0.${ipN++}` } });
  await wire(ctx);
  ctx.on("page", (p) => p.on("dialog", (d) => d.accept()));
  return ctx;
}

async function reserve(browser, wire, { day, time, name, phone, party, notes }) {
  const ctx = await ctxAs(browser, wire);
  const p = await ctx.newPage();
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await p.locator("#reservar td:not([data-disabled]) button").nth(day).click();
  await p.locator("#reservar").getByRole("button", { name: time, exact: true }).click();
  await p.locator("#reservar label", { hasText: "Personas" }).locator("input").fill(String(party));
  await p.locator("#reservar label", { hasText: "Nombre" }).locator("input").fill(name);
  await p.getByPlaceholder("6xxx-xxxx").fill(phone);
  if (notes) await p.getByPlaceholder("Ocasión, mesa alta, partido…").fill(notes);
  await p.locator("#reservar").getByRole("button", { name: "Enviar por WhatsApp" }).click();
  await wait(1500);
  await ctx.close();
}

async function webOrder(browser, wire, { drinks = [], plates = 0, pay = "Yappy" }) {
  const ctx = await ctxAs(browser, wire);
  const p = await ctx.newPage();
  await p.goto(B + "/", { waitUntil: "networkidle" });
  for (const d of drinks) await p.getByRole("button", { name: `Pedir ${d}` }).first().click();
  for (let i = 0; i < plates; i++) await p.locator("#carta").getByRole("button", { name: /^Pedir/ }).nth(i * 2).click();
  await p.getByRole("button", { name: /^Pedido/ }).first().click();
  await wait(400);
  await p.getByRole("button", { name: pay, exact: true }).click();
  await p.getByRole("button", { name: /^(Pagar|Enviar pedido)/ }).last().click();
  await wait(1500);
  await ctx.close();
}

async function floorOrder(p, { table, drinks = [], plates = [] }) {
  await p.getByRole("button", { name: table, exact: true }).click();
  await p.getByRole("button", { name: "Tragos", exact: true }).first().click();
  for (const d of drinks) await p.locator("#carta-mesero").getByRole("button", { name: new RegExp("^" + d) }).first().click();
  if (plates.length) {
    await p.getByRole("button", { name: "Platos", exact: true }).first().click();
    for (const d of plates) await p.locator("#carta-mesero").getByRole("button", { name: new RegExp("^" + d) }).first().click();
  }
  await p.getByRole("button", { name: "Enviar a cocina y barra" }).click();
  await p.getByText(new RegExp(`Comanda enviada a ${table}`)).waitFor();
  await wait(500);
}

async function review(browser, wire, { stars, name, body }) {
  const ctx = await ctxAs(browser, wire);
  const p = await ctx.newPage();
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await p.locator('#resenas input[name="stars"]').nth(stars - 1).check({ force: true });
  await p.getByPlaceholder("Como quieres que aparezca").fill(name);
  await p.getByPlaceholder(/Qué pediste/).fill(body);
  await p.getByRole("button", { name: "Enviar reseña" }).click();
  await p.getByText("Gracias. Tu reseña llegó a la casa.").waitFor();
  await ctx.close();
}

export async function seed(browser, wire, S) {
  // Reservations
  const res = [
    { day: 0, time: "19:30", name: "Andrea Castillo", phone: "6123-4567", party: 4, notes: "Cumpleaños, si se puede mesa alta" },
    { day: 1, time: "20:00", name: "Luis Batista", phone: "6234-1188", party: 2, notes: "" },
    { day: 1, time: "21:00", name: "Grupo Copa Oficina", phone: "6677-2201", party: 8, notes: "Vienen a ver el partido" },
    { day: 2, time: "18:30", name: "Marta Ríos", phone: "6555-9012", party: 3, notes: "" },
    { day: 3, time: "20:30", name: "Kevin Chen", phone: "6011-3344", party: 2, notes: "Aniversario" },
  ];
  for (const r of res) await reserve(browser, wire, r);
  console.log("seed: reservas");

  // Web orders
  await webOrder(browser, wire, { drinks: ["Canal Mule"], plates: 1, pay: "Efectivo" });
  await webOrder(browser, wire, { drinks: [], plates: 2, pay: "Tarjeta" });
  await webOrder(browser, wire, { drinks: ["Canal Mule", "Canal Mule"], plates: 0, pay: "Tarjeta" });
  console.log("seed: pedidos web");

  // Gerencia: confirm two reservations, accept a web order, mark reviews etc.
  const g = await ctxAs(browser, wire, S.ger);
  const gp = await g.newPage();
  await gp.goto(B + "/admin", { waitUntil: "networkidle" });
  await gp.getByRole("button", { name: "Reservas", exact: true }).click();
  await wait(800);
  const conf = gp.locator("li", { hasText: "Andrea Castillo" }).getByRole("button", { name: "Confirmada", exact: true });
  if (await conf.count()) await conf.first().click();
  await wait(500);
  const conf2 = gp.locator("li", { hasText: "Grupo Copa Oficina" }).getByRole("button", { name: "Confirmada", exact: true });
  if (await conf2.count()) await conf2.first().click();
  await wait(500);

  // Floor orders (mesero)
  const m = await ctxAs(browser, wire, S.mes);
  const mp = await m.newPage();
  await mp.goto(B + "/admin", { waitUntil: "networkidle" });
  await mp.getByPlaceholder("Tu nombre").fill("Ana");
  await floorOrder(mp, { table: "Mesa 2", drinks: ["Canal Mule", "Canal Mule"], plates: ["Spicy pork", "Mini Sliders"] });
  await floorOrder(mp, { table: "Mesa 5", drinks: ["Canal Mule"], plates: ["Nachos", "Buffalo"] });
  await floorOrder(mp, { table: "Terraza", drinks: [], plates: ["Chorizo", "Jalapeño"] });
  await floorOrder(mp, { table: "Barra", drinks: ["Canal Mule", "Canal Mule", "Canal Mule"], plates: [] });
  await m.close();
  console.log("seed: comandas");

  // Kitchen marks Mesa 2 ready; bar marks Mesa 2 and Barra ready
  const k = await ctxAs(browser, wire, S.coc);
  const kp = await k.newPage();
  await kp.goto(B + "/admin", { waitUntil: "networkidle" });
  await kp.getByText("Mesa 2").first().waitFor();
  await kp.locator("li", { hasText: "Mesa 2" }).getByRole("button", { name: "Listo", exact: true }).first().click();
  await wait(800);
  await k.close();
  const b = await ctxAs(browser, wire, S.bar);
  const bp = await b.newPage();
  await bp.goto(B + "/admin", { waitUntil: "networkidle" });
  await bp.getByText("Mesa 2").first().waitFor();
  for (const t of ["Mesa 2", "Barra"]) {
    const btn = bp.locator("li", { hasText: t }).getByRole("button", { name: "Listo", exact: true });
    if (await btn.count()) { await btn.first().click(); await wait(800); }
  }
  // Caja: accept first web order, charge Barra
  await bp.getByRole("button", { name: "Caja", exact: true }).click();
  await bp.getByRole("heading", { name: "Pedidos web" }).waitFor();
  const acc = bp.getByRole("button", { name: "Aceptar y preparar" });
  if (await acc.count()) { await acc.first().click(); await wait(800); }
  const barTab = bp.locator("li", { hasText: "Barra" }).filter({ has: bp.getByRole("button", { name: /^Cobrar \$/ }) }).first();
  if (await barTab.count()) {
    await barTab.getByRole("button", { name: "Tarjeta", exact: true }).click();
    await barTab.getByRole("button", { name: /^Cobrar \$/ }).click();
    await wait(1500);
  }
  // Charge one web order directly
  const webCharge = bp.getByRole("button", { name: /^Cobrar \(/ });
  if (await webCharge.count()) { await webCharge.first().click(); await wait(1500); }
  await b.close();
  console.log("seed: cocina/barra/caja");

  // Reviews
  await review(browser, wire, { stars: 5, name: "Valeria", body: "El Canal Mule está buenísimo y la parrillada para dos alcanzó para tres. Volvemos el viernes." });
  await review(browser, wire, { stars: 4, name: "Jorge M.", body: "Buen ambiente para ver el partido. Las alitas jerk, muy buenas; la música un poco alta." });
  await review(browser, wire, { stars: 5, name: "Daniela", body: "Atención de primera. Los sliders y los tragos de la casa, recomendados." });
  await review(browser, wire, { stars: 1, name: "Ricardo", body: "Esperamos 50 minutos por la comida y nadie nos avisó." });
  // Publish the good ones and import two Degusta reviews
  await gp.reload({ waitUntil: "networkidle" });
  await gp.getByRole("button", { name: "Reseñas", exact: true }).click();
  await wait(1200);
  const all = gp.locator("section", { hasText: "Todas las reseñas" });
  for (const who of ["Valeria", "Jorge M.", "Daniela"]) {
    const btn = all.locator("li", { hasText: who }).getByRole("button", { name: "Publicada", exact: true });
    if (await btn.count()) { await btn.first().click(); await wait(700); }
  }
  for (const [author, body] of [
    ["Mariela R.", "Los chicharroncitos del Burro, un must. Atención muy amable."],
    ["Carlos P.", "Buena relación precio-calidad y los cócteles bien preparados."],
  ]) {
    await gp.getByPlaceholder("Autor").fill(author);
    await gp.getByPlaceholder("Texto de la reseña").fill(body);
    await gp.getByRole("button", { name: "Importar", exact: true }).click();
    await gp.getByText("Importada.").waitFor();
    await wait(600);
  }
  console.log("seed: reseñas");

  // Weekly counts (local units) for drinks and plates
  await gp.getByRole("button", { name: "Semana", exact: true }).click();
  await wait(1200);
  const fillLocal = async (n, vals) => {
    const inputs = gp.locator('input[aria-label^="Local, "]');
    const c = Math.min(await inputs.count(), n);
    for (let i = 0; i < c; i++) { await inputs.nth(i).fill(String(vals[i % vals.length])); await wait(120); }
  };
  await fillLocal(10, [22, 17, 30, 12, 9, 14, 8, 11, 6, 5]);
  await gp.getByRole("button", { name: "Barra", exact: true }).first().click();
  await wait(1000);
  await fillLocal(8, [42, 31, 18, 25, 12, 9, 15, 7]);
  await wait(1500);
  await g.close();
  console.log("seed: semana");
}
