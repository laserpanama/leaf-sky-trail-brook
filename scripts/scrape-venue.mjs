#!/usr/bin/env node
/**
 * Collect a venue's public content (text, links, photos, logos, PDFs) from its
 * own pages, for building or refreshing src/venues/<slug>. Uses a real headless
 * browser, so JS-rendered pages (Taplink, Linktree, Wix…) work.
 *
 *   node scripts/scrape-venue.mjs <slug> <url> [url…]
 *
 * Output: incoming/<slug>/<host>/{page.png,text.txt,links.json,images.json,files/…}
 * Follows same-site links one level deep (max 12 pages per site). Read-only:
 * it only loads pages and downloads their public files.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const [slug, ...urls] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug) || !urls.length) {
  console.error("Uso: node scripts/scrape-venue.mjs <slug> <url> [url…]");
  process.exit(1);
}
const MAX_PAGES = 12;
const MIN_SIDE = 64;
const FILE_RE = /\.(pdf|png|jpe?g|webp|gif|svg|avif)(\?|$)/i;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "es-PA",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
});

const summary = [];
for (const start of urls) {
  const origin = new URL(start);
  const host = origin.hostname.replace(/^www\./, "");
  const dir = join("incoming", slug, host);
  mkdirSync(join(dir, "files"), { recursive: true });
  const queue = [origin.origin + origin.pathname];
  const seen = new Set();
  const images = new Map();
  const links = [];
  const texts = [];
  let n = 0;

  while (queue.length && n < MAX_PAGES) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      // Cloudflare-style interstitials clear themselves; give them a moment.
      for (let i = 0; i < 10 && /just a moment|un momento/i.test(await page.title()); i++) await page.waitForTimeout(1500);
      await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 150));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
      const tag = n === 0 ? "page" : `page-${n}`;
      await page.screenshot({ path: join(dir, `${tag}.png`), fullPage: true });
      const data = await page.evaluate((minSide) => {
        const abs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
        const imgs = [...document.images]
          .filter((i) => (i.naturalWidth || i.width) >= minSide && (i.naturalHeight || i.height) >= minSide)
          .map((i) => ({ src: abs(i.currentSrc || i.src), alt: i.alt || "", w: i.naturalWidth, h: i.naturalHeight }));
        const bgs = [...document.querySelectorAll("*")]
          .map((el) => getComputedStyle(el).backgroundImage)
          .flatMap((b) => [...b.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => ({ src: abs(m[1]), alt: "(fondo)", w: 0, h: 0 })));
        const anchors = [...document.querySelectorAll("a[href]")].map((a) => ({ text: (a.innerText || a.getAttribute("aria-label") || "").trim().replace(/\s+/g, " "), href: abs(a.getAttribute("href")) }));
        return { title: document.title, text: document.body.innerText, imgs: [...imgs, ...bgs].filter((i) => i.src && !i.src.startsWith("data:")), anchors };
      }, MIN_SIDE);
      texts.push(`===== ${url}\n${data.title}\n\n${data.text}\n`);
      for (const img of data.imgs) if (!images.has(img.src)) images.set(img.src, img);
      for (const a of data.anchors) {
        if (!a.href) continue;
        links.push({ page: url, ...a });
        const u = new URL(a.href);
        if (FILE_RE.test(u.pathname)) images.set(a.href, images.get(a.href) ?? { src: a.href, alt: a.text, w: 0, h: 0 });
        else if (u.hostname === origin.hostname && /^https?:$/.test(u.protocol)) queue.push(u.origin + u.pathname);
      }
      n++;
    } catch (err) {
      texts.push(`===== ${url}\n(no cargó: ${String(err).slice(0, 200)})\n`);
    } finally {
      await page.close();
    }
  }

  // Download every image/PDF through the same browser session (keeps cookies).
  const saved = [];
  let i = 0;
  for (const img of images.values()) {
    try {
      const res = await ctx.request.get(img.src, { timeout: 30000 });
      if (!res.ok()) continue;
      const type = res.headers()["content-type"] || "";
      const ext = extname(new URL(img.src).pathname).toLowerCase().slice(0, 6) || (type.includes("pdf") ? ".pdf" : type.includes("png") ? ".png" : type.includes("svg") ? ".svg" : type.includes("webp") ? ".webp" : ".jpg");
      const file = `${String(++i).padStart(3, "0")}${ext}`;
      writeFileSync(join(dir, "files", file), await res.body());
      saved.push({ file: `files/${file}`, ...img, type });
    } catch {
      /* skip files that do not download */
    }
  }

  writeFileSync(join(dir, "text.txt"), texts.join("\n"));
  writeFileSync(join(dir, "links.json"), JSON.stringify(links, null, 2));
  writeFileSync(join(dir, "images.json"), JSON.stringify(saved, null, 2));
  summary.push(`${host}: ${n} página(s), ${links.length} enlaces, ${saved.length} archivos → ${dir}`);
}

await browser.close();
console.log(summary.join("\n"));
