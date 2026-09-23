import { createFileRoute } from "@tanstack/react-router";

// Costing workbooks: only served to a valid house session.
export const Route = createFileRoute("/casa/$file")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { COOKIE, readCookieHeader, verifySession } = await import("@/lib/casa-ops.server");
        const token = readCookieHeader(request.headers.get("cookie"), COOKIE);
        if (!verifySession(token)) {
          return new Response("No autorizado", { status: 401, headers: { "cache-control": "no-store" } });
        }
        const { casaFile } = await import("@/lib/casa-files.server");
        const body = casaFile(params.file);
        if (!body) return new Response("No encontrado", { status: 404 });
        return new Response(body as unknown as BodyInit, {
          headers: {
            "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "content-disposition": `attachment; filename="${params.file}"`,
            "cache-control": "private, no-store",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
