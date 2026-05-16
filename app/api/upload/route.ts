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
import { extractPdfText, buildIndex } from "@/lib/agents/rag";
import {
  flattenZodError,
  uploadMetadataSchema,
  uploadedFileSchema,
  uploadResponseSchema,
} from "@/lib/validation/chat";

export const runtime = "nodejs";
export const maxDuration = 300; // PDFs up to a few hundred pages can take a while.

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const meta = uploadMetadataSchema.safeParse({ sessionId: form.get("sessionId") ?? "" });
    if (!meta.success) {
      return NextResponse.json({ error: flattenZodError(meta.error) }, { status: 400 });
    }

    const fileParse = uploadedFileSchema.safeParse(form.get("file"));
    if (!fileParse.success) {
      const msg = flattenZodError(fileParse.error);
      // Map common cases to better HTTP codes.
      const status = /too large/i.test(msg) ? 413 : /pdf/i.test(msg) ? 415 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
    const file = fileParse.data;

    const bytes = Buffer.from(await file.arrayBuffer());

    // RAG (local) is the primary path. The Files API upload is best-effort —
    // it's only used as a long-context fallback when local indexing fails.
    const text = await extractPdfText(bytes);
    const index = await buildIndex(text);

    let fileUri = "";
    let mimeType = "application/pdf";
    try {
      const fm = new GoogleAIFileManager(getApiKey());
      const upload = await fm.uploadFile(bytes, {
        mimeType: "application/pdf",
        displayName: file.name,
      });
      fileUri = upload.file.uri;
      mimeType = upload.file.mimeType;
    } catch (e) {
      console.warn("Files API upload failed (RAG will still work):", e instanceof Error ? e.message : e);
    }

    attachPdf(meta.data.sessionId, {
      fileUri,
      mimeType,
      displayName: file.name,
      uploadedAt: Date.now(),
      index,
      chunkCount: index.length,
    });

    const body = uploadResponseSchema.parse({
      success: true,
      file: {
        name: file.name,
        sizeBytes: file.size,
        uri: fileUri,
        chunks: index.length,
      },
      message: `Indexed "${file.name}" into ${index.length} chunks. The BudgetAnalyst will retrieve the most relevant passages for each question.`,
    });
    return NextResponse.json(body);
  } catch (error) {
    console.error("Upload error:", error);
    const msg = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
