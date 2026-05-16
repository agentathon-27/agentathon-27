// GET /api/cron — Scheduled gazette-amendment scan.
//
// Designed to be invoked by Cloud Scheduler (or `gcloud run jobs`) on a daily
// cadence. Returns the latest gazette notices the GazetteMonitor knows about
// so an external pipeline can fan them out as SMS alerts. In production this
// would diff against a "last-seen" timestamp in BigQuery and only return
// genuinely new notices.
import { NextRequest, NextResponse } from "next/server";
import { latestNotices } from "@/lib/agents/gazette-monitor";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Optional shared-secret guard for Cloud Scheduler.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
    if (got !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "5");
  const notices = latestNotices(Number.isFinite(limit) ? limit : 5);

  return NextResponse.json({
    scannedAt: new Date().toISOString(),
    count: notices.length,
    notices,
  });
}
