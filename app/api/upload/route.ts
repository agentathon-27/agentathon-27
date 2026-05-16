// POST /api/upload — Ingest a county budget PDF and attach it to a session.
//
// Demo path (this implementation):
//   Uploads the PDF to Gemini's Files API via @google/generative-ai/server.
//   Subsequent /api/query turns hand the file URI to the BudgetAnalyst as
//   inline file-data so Gemini 1.5 Pro can reason over the full document in
//   its long context window.
//
// Production path (see .agent/rules.md §2.1):
//   Route the PDF through Document AI Layout Parser (lib/gcp/documentai.ts),
//   normalize line items, and stream them into BigQuery (lib/gcp/bigquery.ts).
import { NextRequest, NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { attachPdf } from "@/lib/agents/sessions";
import { getApiKey } from "@/lib/agents/config";

export const runtime = "nodejs";
export const maxDuration = 300; // PDFs up to a few hundred pages can take a while.

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB hard cap.

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const sessionId = String(form.get("sessionId") ?? "").trim();
    const file = form.get("file");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file (multipart) is required" }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF uploads are supported" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large (max ${MAX_BYTES / 1_000_000} MB)` }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const fm = new GoogleAIFileManager(getApiKey());

    const upload = await fm.uploadFile(bytes, {
      mimeType: "application/pdf",
      displayName: file.name,
    });

    attachPdf(sessionId, {
      fileUri: upload.file.uri,
      mimeType: upload.file.mimeType,
      displayName: file.name,
      uploadedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        sizeBytes: file.size,
        uri: upload.file.uri,
      },
      message: `Attached "${file.name}" to this session. The BudgetAnalyst will use it for follow-up questions.`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const msg = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
