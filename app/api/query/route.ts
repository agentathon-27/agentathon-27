// POST /api/query — Chat with the orchestrator agent.
import { NextRequest, NextResponse } from "next/server";
import { runOrchestrator } from "@/lib/agents/orchestrator";
import { flattenZodError, queryRequestSchema } from "@/lib/validation/chat";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = queryRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: flattenZodError(parsed.error) }, { status: 400 });
    }

    const { message, sessionId, countyId } = parsed.data;
    const result = await runOrchestrator(sessionId, message, countyId);

    return NextResponse.json({
      response: result.text,
      toolsUsed: result.toolsUsed,
      agentsCalled: result.agentsCalled,
    });
  } catch (error) {
    console.error("Agent query error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
