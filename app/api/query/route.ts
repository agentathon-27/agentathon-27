import { streamGemini } from "@/lib/gcp/gemini";
import { parseChatPayload } from "@/lib/validation/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let messages;
  try {
    ({ messages } = parseChatPayload(body));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const stream = await streamGemini(messages);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream error";
    return Response.json({ error: message }, { status: 502 });
  }
}
