<<<<<<< HEAD
// POST /api/query — Chat with the Budget Watchdog agent
import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const result = await chatWithAgent(sessionId, message.trim());

    return NextResponse.json({
      response: result.text,
      toolsUsed: result.toolsUsed,
    });
  } catch (error) {
    console.error("Agent query error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
=======
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
>>>>>>> 1a82f0f1a1831c172a5fd0ac0eaf907983b9f4ca
  }
}
