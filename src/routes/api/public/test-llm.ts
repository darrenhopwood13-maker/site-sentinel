import { createFileRoute } from "@tanstack/react-router";
import { chatText } from "@/lib/openai.server";

export const Route = createFileRoute("/api/public/test-llm")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const reply = await chatText("You are a helpful assistant.", "Say 'DeepSeek is connected' and nothing else.");
          return new Response(JSON.stringify({ ok: true, reply }), {
            headers: { "content-type": "application/json" },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          const body = (e as any)?.responseBody ?? null;
          return new Response(JSON.stringify({ ok: false, error: msg, body }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
