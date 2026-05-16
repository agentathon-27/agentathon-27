export type ChatRole = "user" | "model";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface GeminiContent {
  role: ChatRole;
  parts: { text: string }[];
}

const MODEL = process.env.VERTEX_AI_MODEL ?? "gemini-flash-latest";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_INSTRUCTION = `You are the County Budget Watchdog, an assistant that helps Kenyan residents understand county budgets and gazette notices in plain language. Translate financial jargon to ward-level impact. Be concise. When unsure, say so.`;

function toContents(messages: ChatMessage[]): GeminiContent[] {
  return messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
}

export async function streamGemini(
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return mockStream(messages);
  }

  const url = `${ENDPOINT}/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: toContents(messages),
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini request failed: ${res.status} ${detail}`);
  }

  return parseSSE(res.body);
}

function parseSSE(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const text: string =
                json?.candidates?.[0]?.content?.parts
                  ?.map((p: { text?: string }) => p.text ?? "")
                  .join("") ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // Skip malformed chunk
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}

function mockStream(messages: ChatMessage[]): ReadableStream<Uint8Array> {
  const last = messages[messages.length - 1]?.content ?? "";
  const reply = `(mock) GEMINI_API_KEY not set. You said: "${last}". Configure your key in .env to enable live answers about county budgets.`;
  const encoder = new TextEncoder();
  const tokens = reply.split(/(\s+)/);
  return new ReadableStream({
    async start(controller) {
      for (const tok of tokens) {
        controller.enqueue(encoder.encode(tok));
        await new Promise((r) => setTimeout(r, 25));
      }
      controller.close();
    },
  });
}
