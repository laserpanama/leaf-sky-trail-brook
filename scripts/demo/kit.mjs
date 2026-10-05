// Shared recording kit for the demo videos: browser, fake cursor, captions, title cards,
// one recorded browser context per scene. Only ever points at a LOCAL dev server.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

export const B = process.env.DEMO_BASE ?? "http://127.0.0.1:8080";
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(B)) {
  throw new Error(`DEMO_BASE must be a local dev server, got ${B}. The demo seeds fake data: never run it against production.`);
}

// Demo-only keys; run.sh starts the dev server with these same values.
export const KEYS = {
  gerencia: "gerencia-llave-123",
  mesero: "mesero-llave-123",
  cocina: "cocina-llave-123",
  barra: "barra-llave-1234",
};

// Fonts: DEMO_FONT_DIR points at a node_modules/@fontsource folder when Google Fonts is unreachable;
// otherwise the pages load Google Fonts normally.
const FONT_DIR = process.env.DEMO_FONT_DIR;
const LOCAL_FACES = [
  ["Cormorant Garamond", "normal", 500, "cormorant-garamond", "cormorant-garamond-latin-500-normal"],
  ["Cormorant Garamond", "italic", 500, "cormorant-garamond", "cormorant-garamond-latin-500-italic"],
  ["Cormorant Garamond", "normal", 600, "cormorant-garamond", "cormorant-garamond-latin-600-normal"],
  ["Cormorant Garamond", "italic", 600, "cormorant-garamond", "cormorant-garamond-latin-600-italic"],
  ["Outfit", "normal", 300, "outfit", "outfit-latin-300-normal"],
  ["Outfit", "normal", 400, "outfit", "outfit-latin-400-normal"],
  ["Outfit", "normal", 500, "outfit", "outfit-latin-500-normal"],
];
export const FONT_CSS = FONT_DIR
  ? LOCAL_FACES.map(([fam, style, w, pkg, file]) => `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};src:url(https://fonts.local/${pkg}/files/${file}.woff2) format('woff2')}`).join("\n")
  : "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Outfit:wght@300;400;500&display=swap');";

const OVERLAY = (mode) => `
(() => {
  const mk = () => {
    if (document.getElementById('__cur')) return;
    const st = document.createElement('style');
    st.textContent = \`
      #__cur{position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
        background:rgba(196,165,116,.55);border:2px solid #f3eadc;pointer-events:none;transition:transform .12s;left:-50px;top:-50px}
      #__cur.down{transform:scale(.7);background:rgba(196,165,116,.9)}
      #__cap{position:fixed;z-index:2147483646;left:50%;transform:translateX(-50%);${mode === "h" ? "bottom:28px;max-width:80%;font-size:26px;" : "bottom:84px;width:90%;font-size:22px;"}
        background:rgba(17,15,13,.92);color:#f3eadc;border-left:4px solid #c4a574;padding:14px 22px;font-family:Outfit,sans-serif;
        line-height:1.3;box-shadow:0 8px 30px rgba(0,0,0,.45);opacity:0;transition:opacity .35s;pointer-events:none;text-align:left}
      #__cap.on{opacity:1}
      #__cap small{display:block;color:#c4a574;font-size:.6em;letter-spacing:.25em;text-transform:uppercase;margin-bottom:4px}\`;
    document.documentElement.appendChild(st);
    const c = document.createElement('div'); c.id = '__cur'; document.documentElement.appendChild(c);
    const cap = document.createElement('div'); cap.id = '__cap'; document.documentElement.appendChild(cap);
    addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => c.classList.add('down'), true);
    addEventListener('mouseup', () => c.classList.remove('down'), true);
  };
  window.__cap = (kicker, text) => { mk(); const cap = document.getElementById('__cap');
    if (!text) { cap.classList.remove('on'); return; }
    cap.innerHTML = '<small>' + kicker + '</small>' + text; cap.classList.add('on'); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mk); else mk();
})();`;

export async function createKit(mode, out) {
  const MODE = mode === "v" ? "v" : "h";
  const H = MODE === "h";
  const VP = H ? { width: 1280, height: 720 } : { width: 540, height: 960 };
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});

  async function wire(ctx) {
    if (FONT_DIR) {
      await ctx.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ contentType: "text/css", body: FONT_CSS }));
      await ctx.route("https://fonts.gstatic.com/**", (r) => r.abort());
      await ctx.route("https://fonts.local/**", (r) => {
        const rel = new URL(r.request().url()).pathname.replace(/^\//, "");
        r.fulfill({ contentType: "font/woff2", body: fs.readFileSync(path.join(FONT_DIR, rel)) });
      });
    }
    // Orders and reservations hand off to WhatsApp: never send real messages from a demo.
    // Show the pre-written message instead (styled as the house's page, not as WhatsApp).
    await ctx.route("https://wa.me/**", (r) => {
      const msg = new URL(r.request().url()).searchParams.get("text") || "";
      const esc = msg.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      r.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>${FONT_CSS}
        body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#110f0d;font-family:Outfit,sans-serif;color:#f3eadc}
        .w{width:min(520px,88vw)} .k{color:#c4a574;letter-spacing:.3em;font-size:13px;text-transform:uppercase}
        h1{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:40px;margin:10px 0 22px}
        .b{background:#1f3b2d;border-radius:14px 14px 4px 14px;padding:16px 18px;white-space:pre-wrap;line-height:1.45;font-size:17px;margin-left:auto;max-width:92%;box-shadow:0 6px 24px rgba(0,0,0,.4)}
        p{color:#a39688;font-size:15px;margin-top:18px}</style></head>
        <body><div class="w"><div class="k">WhatsApp de la casa</div><h1>El pedido llega escrito.</h1><div class="b">${esc}</div>
        <p>El cliente solo toca “Enviar”. La casa confirma y el pedido aparece en la caja.</p></div></body></html>` });
    });
    await ctx.route("https://grok.com/**", (r) => r.abort());
    await ctx.addInitScript(OVERLAY(MODE));
  }

  async function loginState(key) {
    const ctx = await browser.newContext({ viewport: VP });
    await wire(ctx);
    const p = await ctx.newPage();
    await p.goto(B + "/admin", { waitUntil: "networkidle" });
    await p.locator('input[type="password"]').fill(key);
    await p.getByRole("button", { name: "Entrar" }).click();
    await p.waitForTimeout(1500);
    const state = await ctx.storageState();
    await ctx.close();
    return state;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const cap = (p, kicker, text) => p.evaluate(([k, t]) => window.__cap(k, t), [kicker, text]);
  async function smooth(p, selector, offset = 0) {
    await p.evaluate(([s, o]) => { const el = document.querySelector(s); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - o, behavior: "smooth" }); }, [selector, offset]);
    await wait(1100);
  }
  async function hoverClick(p, locator) { await locator.scrollIntoViewIfNeeded(); await locator.hover(); await wait(350); await locator.click(); await wait(450); }

  let n = 0;
  async function scene(name, state, fn) {
    const ctx = await browser.newContext({ viewport: VP, storageState: state, recordVideo: { dir: out, size: VP } });
    await wire(ctx);
    const p = await ctx.newPage();
    p.on("dialog", (d) => setTimeout(() => d.accept(), 900));
    await p.setContent('<html style="background:#110f0d"></html>');
    await fn(p);
    const v = p.video();
    await ctx.close();
    const dest = path.join(out, `${String(++n).padStart(2, "0")}-${name}.webm`);
    fs.renameSync(await v.path(), dest);
    console.log("scene", dest);
  }

  function card(title, sub, foot) {
    return `<html><head><style>${FONT_CSS}
    body{margin:0;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:0 ${H ? 110 : 44}px;
    background:radial-gradient(circle at 70% 30%,#2a2219,#110f0d 60%);color:#f3eadc;font-family:Outfit,sans-serif;box-sizing:border-box}
    .k{color:#c4a574;letter-spacing:.42em;font-size:${H ? 18 : 15}px;text-transform:uppercase;opacity:0;animation:in .8s .1s forwards}
    h1{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:${H ? 84 : 58}px;line-height:1.02;margin:18px 0;opacity:0;animation:in .9s .35s forwards}
    p{font-size:${H ? 24 : 19}px;color:#a39688;max-width:820px;line-height:1.4;margin:0;opacity:0;animation:in .9s .7s forwards}
    .f{position:absolute;bottom:${H ? 48 : 70}px;color:#c4a574;font-size:${H ? 18 : 15}px;letter-spacing:.2em;opacity:0;animation:in .9s 1s forwards}
    @keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}</style></head>
    <body><div class="k">La Quinta Pata · Gastrobar</div><h1>${title}</h1><p>${sub}</p>${foot ? `<div class="f">${foot}</div>` : ""}</body></html>`;
  }

  return { browser, MODE, H, VP, wire, loginState, wait, cap, smooth, hoverClick, scene, card };
}
