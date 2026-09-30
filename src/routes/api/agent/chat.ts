import { createFileRoute } from "@tanstack/react-router";

const HITS_PER_10MIN = 30;
const HITS_GLOBAL_HOUR = 600;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

// Public web-chat endpoint for the reservation agent.
export const Route = createFileRoute("/api/agent/chat")({
  server: {
    handlers: {
      GET: async () => {
        const { agentEnabled } = await import("@/lib/agent/agent.server");
        return json({ enabled: agentEnabled() });
      },
      POST: async ({ request }) => {
        const { agentEnabled, runAgent } = await import("@/lib/agent/agent.server");
        if (!agentEnabled()) return json({ error: "off" }, 503);
        let body: { session?: unknown; message?: unknown };
        try {
          body = await request.json();
        } catch {
          return json({ error: "bad" }, 400);
        }
        const session = typeof body.session === "string" ? body.session : "";
        const message = typeof body.message === "string" ? body.message : "";
        if (!/^[0-9a-f-]{36}$/i.test(session) || !message.trim() || message.length > 2000) {
          return json({ error: "bad" }, 400);
        }
        const { ipKey } = await import("@/lib/casa-ops.server");
        const { getSql } = await import("@/lib/db");
        const sql = await getSql();
        const key = ipKey();
        const [hits] = await sql<{ mine: number; total: number }>`
          select
            count(*) filter (where key = ${key} and at > now() - interval '10 minutes')::int as mine,
            count(*) filter (where at > now() - interval '1 hour')::int as total
          from agent_hits
        `;
        if (Number(hits?.mine) >= HITS_PER_10MIN || Number(hits?.total) >= HITS_GLOBAL_HOUR) {
          return json({ error: "wait" }, 429);
        }
        await sql`insert into agent_hits (key) values (${key})`;
        if (Math.random() < 0.02) await sql`delete from agent_hits where at < now() - interval '1 day'`;
        const result = await runAgent({ threadId: `web:${session.toLowerCase()}`, channel: "web", text: message });
        return json(result);
      },
    },
  },
});
