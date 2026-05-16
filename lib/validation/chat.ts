import type { ChatMessage, ChatRole } from "@/lib/gcp/gemini";

const ROLES: readonly ChatRole[] = ["user", "model"] as const;

export function parseChatPayload(input: unknown): { messages: ChatMessage[] } {
  if (typeof input !== "object" || input === null) {
    throw new Error("Body must be a JSON object");
  }
  const { messages } = input as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("'messages' must be a non-empty array");
  }
  const parsed: ChatMessage[] = messages.map((m, i) => {
    if (typeof m !== "object" || m === null) {
      throw new Error(`messages[${i}] must be an object`);
    }
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (typeof role !== "string" || !ROLES.includes(role as ChatRole)) {
      throw new Error(`messages[${i}].role must be 'user' or 'model'`);
    }
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error(`messages[${i}].content must be a non-empty string`);
    }
    if (content.length > 8000) {
      throw new Error(`messages[${i}].content exceeds 8000 chars`);
    }
    return { role: role as ChatRole, content };
  });
  return { messages: parsed };
}
