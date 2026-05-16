// POST /api/sms — Send an ad-hoc SMS budget digest via Africa's Talking.
// The orchestrator pipeline can also send SMS through the DigestGenerator
// sub-agent; this route exists for the "Send SMS Digest" UI button.
import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms/africastalking";
import { flattenZodError, smsRequestSchema } from "@/lib/validation/chat";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = smsRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: flattenZodError(parsed.error) }, { status: 400 });
    }

    const result = await sendSms(parsed.data.phone, parsed.data.message);

    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to send SMS";
    console.error("SMS error:", error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
