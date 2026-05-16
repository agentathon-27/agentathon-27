// Cross-agent session state. Used by the orchestrator and every sub-agent so
// that conversational memory, uploaded PDFs, and gazette context follow the
// user across turns.
import type { Content } from "@google/generative-ai";
import type { Chunk } from "./rag";

export interface PdfRef {
  fileUri: string;
  mimeType: string;
  displayName: string;
  uploadedAt: number;
  index?: Chunk[];
  chunkCount?: number;
}

export interface SessionState {
  history: Content[];
  pdf?: PdfRef;
  countyId: string;
  toolsUsed: { name: string; summary: string }[];
}

const sessions = new Map<string, SessionState>();

export function getSession(sessionId: string): SessionState {
  let s = sessions.get(sessionId);
  if (!s) {
    s = { history: [], toolsUsed: [], countyId: "47" };
    sessions.set(sessionId, s);
  }
  return s;
}

export function setCounty(sessionId: string, countyId: string): void {
  const s = getSession(sessionId);
  s.countyId = countyId;
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function attachPdf(sessionId: string, ref: PdfRef): void {
  const s = getSession(sessionId);
  s.pdf = ref;
}

export function recordTool(sessionId: string, name: string, summary: string): void {
  const s = getSession(sessionId);
  s.toolsUsed.push({ name, summary });
}

export function consumeToolLog(sessionId: string): { name: string; summary: string }[] {
  const s = getSession(sessionId);
  const out = s.toolsUsed;
  s.toolsUsed = [];
  return out;
}
