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
  }
}
