// Server-only: costing workbooks live in the server bundle, never in public/.
// Only imported (dynamically) from the gated /casa/$file route handler.
import { CASA_FILES } from "@/lib/casa-files.data.server";

export function casaFile(name: string): Uint8Array | null {
  const base64 = Object.prototype.hasOwnProperty.call(CASA_FILES, name) ? CASA_FILES[name] : undefined;
  if (!base64) return null;
  return new Uint8Array(Buffer.from(base64, "base64"));
}
