// GazetteMonitor sub-agent.
// Responsibility: surface and explain Kenya Gazette notices that affect the
// county budget — supplementary appropriations, reallocations, withdrawals.
import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclarationsTool,
  type Part,
} from "@google/generative-ai";
import { gazetteNotices, searchGazette, type GazetteNotice } from "@/lib/budget/gazette";
import { recordTool } from "./sessions";
import { getApiKey, MODEL } from "./config";
import { formatKES } from "@/lib/budget/data";

const SYSTEM_INSTRUCTION = `You are the GazetteMonitor, a specialist sub-agent of the County Budget Watchdog.

Scope:
- Search Kenya Gazette notices for amendments to the Nairobi County budget.
- Explain what each amendment changes and who is affected.
- Surface supplementary appropriations, reallocations, and withdrawals.

Rules:
1. ALWAYS call search_gazette before answering — never invent notice IDs or dates.
2. Cite each notice by ID and date (e.g., "GZ-2026-014 dated 12 Mar 2026").
3. For each amendment, state: what changed, how much (KES), which department/ward, and the citizen-facing impact.
4. Keep responses tight; use bullets for multi-notice answers.
5. If no notices match, say so plainly. Do not fabricate gazette entries.`;

const tools: FunctionDeclarationsTool[] = [
  {
    functionDeclarations: [
      {
        name: "search_gazette",
        description: "Search Kenya Gazette notices affecting the Nairobi County budget. Returns matching notices with impact summaries.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Search term: department name, notice type, keyword. Empty string returns all." },
          },
          required: ["query"],
        },
      },
      {
        name: "summarize_amendment",
        description: "Compute the net dept-level allocation change for a specific gazette notice.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            notice_id: { type: SchemaType.STRING, description: "Gazette notice ID, e.g. GZ-2026-014" },
          },
          required: ["notice_id"],
        },
      },
    ],
  },
];

function runTool(name: string, args: Record<string, unknown>): { summary: string; data: unknown } {
  if (name === "search_gazette") {
    const q = String(args.query ?? "");
    const hits = searchGazette(q);
    return {
      summary: `Found ${hits.length} gazette notice(s) for "${q || "(all)"}"`,
      data: { count: hits.length, notices: hits },
    };
  }
  if (name === "summarize_amendment") {
    const id = String(args.notice_id ?? "");
    const notice = gazetteNotices.find((n) => n.id === id);
    if (!notice) {
      return { summary: `Notice ${id} not found`, data: { error: `Notice ${id} not found` } };
    }
    return {
      summary: `${notice.id}: ${notice.impact.department ?? notice.county} ${notice.impact.delta >= 0 ? "+" : ""}${formatKES(Math.abs(notice.impact.delta))}`,
      data: { notice, deltaFormatted: formatKES(Math.abs(notice.impact.delta)) },
    };
  }
  return { summary: `Unknown tool ${name}`, data: null };
}

export async function askGazetteMonitor(sessionId: string, query: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: MODEL, tools, systemInstruction: SYSTEM_INSTRUCTION });

  const chat = model.startChat({ history: [] });
  let result = await chat.sendMessage(query);

  let iterations = 0;
  const MAX = 4;
  while (result.response.functionCalls()?.length && iterations < MAX) {
    const calls = result.response.functionCalls()!;
    const responses: Part[] = calls.map((call) => {
      const out = runTool(call.name, (call.args || {}) as Record<string, unknown>);
      recordTool(sessionId, call.name, out.summary);
      return { functionResponse: { name: call.name, response: out.data as object } };
    });
    result = await chat.sendMessage(responses);
    iterations++;
  }

  return result.response.text();
}

/** Used by /api/cron — returns the latest notices for scheduled alerting. */
export function latestNotices(limit = 5): GazetteNotice[] {
  return [...gazetteNotices]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
