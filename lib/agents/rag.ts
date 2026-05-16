// Lightweight embedding RAG over uploaded PDFs.
//
// Strategy:
//   1. Extract text from the PDF (pdf-parse).
//   2. Chunk into ~CHUNK_CHARS-sized windows with overlap so paragraph
//      boundaries aren't lost.
//   3. Embed each chunk with Gemini text-embedding-004.
//   4. Store vectors in-memory on the session.
//   5. At query time, embed the question, cosine-rank chunks, pass top-K
//      back to the BudgetAnalyst as plain text context.
//
// Note: in-memory only. Restart loses the index — fine for the demo.
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { getApiKey } from "./config";
import {
  embeddingResponseSchema,
  pdfParseResultSchema,
  ragRetrieveInputSchema,
} from "@/lib/validation/chat";

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const CHUNK_CHARS = 1500;
const CHUNK_OVERLAP = 200;
const EMBED_BATCH = 100;

export interface Chunk {
  id: number;
  text: string;
  embedding: number[];
}

export async function extractPdfText(bytes: Buffer): Promise<string> {
  // pdf-parse v2 exports a class; ESM-only, so dynamic import is required.
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const raw = await parser.getText();
    return pdfParseResultSchema.parse(raw).text;
  } finally {
    await parser.destroy().catch(() => {});
  }
}

export function chunkText(text: string): string[] {
  const cleaned = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];
  const out: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + CHUNK_CHARS, cleaned.length);
    let slice = cleaned.slice(i, end);
    // Try to end on a paragraph or sentence boundary.
    if (end < cleaned.length) {
      const breakAt = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
      if (breakAt > CHUNK_CHARS * 0.5) slice = slice.slice(0, breakAt + 1);
    }
    out.push(slice.trim());
    if (end >= cleaned.length) break;
    i += slice.length - CHUNK_OVERLAP;
    if (i < 0) i = 0;
  }
  return out.filter((c) => c.length > 0);
}

async function embedBatch(texts: string[], taskType: TaskType): Promise<number[][]> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: EMBED_MODEL });
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const res = await model.batchEmbedContents({
      requests: batch.map((t) => ({
        content: { role: "user", parts: [{ text: t }] },
        taskType,
      })),
    });
    const parsed = embeddingResponseSchema.parse(res);
    for (const e of parsed.embeddings) out.push(e.values);
  }
  return out;
}

export async function buildIndex(text: string): Promise<Chunk[]> {
  const chunks = chunkText(text);
  if (chunks.length === 0) return [];
  const embeddings = await embedBatch(chunks, TaskType.RETRIEVAL_DOCUMENT);
  return chunks.map((text, id) => ({ id, text, embedding: embeddings[id] }));
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

export async function retrieve(query: string, index: Chunk[], k = 5): Promise<Chunk[]> {
  if (index.length === 0) return [];
  const args = ragRetrieveInputSchema.parse({ query, k });
  const [qEmb] = await embedBatch([args.query], TaskType.RETRIEVAL_QUERY);
  return index
    .map((c) => ({ c, score: cosine(qEmb, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, args.k)
    .map((x) => x.c);
}
