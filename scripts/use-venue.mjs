#!/usr/bin/env node
/**
 * Stage the active venue before dev/build: copies src/venues/<slug>/public to
 * ./public and src/venues/<slug>/site.json to src/lib/og/site.json (both are
 * generated, gitignored). VENUE defaults to laquintapata.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const venueSlug = () => (process.env.VENUE || "laquintapata").trim();

export function stageVenue(slug = venueSlug()) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`VENUE inválido: ${slug}`);
  const dir = join(root, "src/venues", slug);
  for (const need of ["index.ts", "site.json", "public"]) {
    if (!existsSync(join(dir, need))) throw new Error(`Falta src/venues/${slug}/${need}`);
  }
  rmSync(join(root, "public"), { recursive: true, force: true });
  cpSync(join(dir, "public"), join(root, "public"), { recursive: true });
  mkdirSync(join(root, "src/lib/og"), { recursive: true });
  cpSync(join(dir, "site.json"), join(root, "src/lib/og/site.json"));
  return slug;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(`venue: ${stageVenue()}`);
}
