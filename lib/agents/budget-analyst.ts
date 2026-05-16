// BudgetAnalyst sub-agent.
// Responsibility: RAG-style Q&A over Nairobi County FY 2025/2026 budget data,
// plus long-context analysis of any PDF the user has uploaded this session.
import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclarationsTool,
  type Part,
} from "@google/generative-ai";
import { executeTool } from "@/lib/budget/tools";
import { getSession, recordTool } from "./sessions";
import { getApiKey, MODEL } from "./config";
import { retrieve } from "./rag";

const RAG_TOP_K = 5;

import { getCountyName } from "@/lib/budget/counties";

const getSystemInstruction = (countyName: string) => `You are the BudgetAnalyst, a specialist sub-agent of the County Budget Watchdog system for ${countyName}.

Scope:
- Answer questions about ${countyName} budget allocations.
- Compare spending across departments, wards, and programs.
- Translate budget jargon into plain language for ward residents.
- When the user has uploaded a PDF, use it as the source of truth (long-context). Cite page-level details when possible.

Rules:
1. ALWAYS call your tools before citing numbers. Do not invent figures.
2. Present amounts in KES with proper formatting (e.g., KES 12.1B, KES 500M).
3. Be specific — cite exact departments, wards, programs.
4. If the user uploaded a PDF, treat it as the authoritative source. The structured tools cover the curated demo dataset.
5. Keep responses tight: headings, bullets, key numbers bold.
6. If asked something outside your scope (gazette amendments, SMS digests), say so — the orchestrator will re-route.`;

const tools: FunctionDeclarationsTool[] = [
  {
    functionDeclarations: [
      {
        name: "search_budget_data",
        description: "Search budget items by keyword, department, or ward.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Keyword e.g. 'health', 'road construction'" },
            department: { type: SchemaType.STRING, description: "Optional department filter" },
            ward: { type: SchemaType.STRING, description: "Optional ward filter" },
          },
          required: ["query"],
        },
      },
      {
        name: "compare_allocations",
        description: "Compare two departments' allocations side-by-side.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            department_a: { type: SchemaType.STRING },
            department_b: { type: SchemaType.STRING },
          },
          required: ["department_a", "department_b"],
        },
      },
      {
        name: "get_ward_summary",
        description: "Sector breakdown and projects for a single ward.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { ward_name: { type: SchemaType.STRING } },
          required: ["ward_name"],
        },
      },
      {
        name: "explain_budget_term",
        description: "Plain-language explanation of a budget/financial term.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { term: { type: SchemaType.STRING } },
          required: ["term"],
        },
      },
      {
        name: "get_budget_overview",
        description: "Overall county budget statistics.",
        parameters: { type: SchemaType.OBJECT, properties: {}, required: [] },
      },
    ],
  },
];

export async function askBudgetAnalyst(sessionId: string, query: string): Promise<string> {
  const session = getSession(sessionId);
  const countyId = session.countyId || "47";
  const countyName = getCountyName(countyId);

  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: MODEL,
    tools,
    systemInstruction: getSystemInstruction(countyName),
  });

  // RAG path: if a PDF is attached AND we have an embedding index, retrieve
  // the top-K most relevant chunks and pass them inline. This avoids re-billing
  // the full document on every turn. We fall back to Gemini's Files API
  // long-context path only when no index is available (e.g. extraction failed).
  const userParts: Part[] = [];
  if (session.pdf?.index && session.pdf.index.length > 0) {
    const hits = await retrieve(query, session.pdf.index, RAG_TOP_K);
    const context = hits
      .map((h, i) => `--- Excerpt ${i + 1} (chunk #${h.id}) ---\n${h.text}`)
      .join("\n\n");
    recordTool(
      sessionId,
      "rag_retrieve",
      `Retrieved ${hits.length} of ${session.pdf.index.length} chunks from "${session.pdf.displayName}".`,
    );
    userParts.push({
      text:
        `You have retrieved excerpts from "${session.pdf.displayName}". ` +
        `Treat these as the authoritative source. If the answer is not in the excerpts, say so.\n\n` +
        `${context}\n\n---\nUser question: ${query}`,
    });
  } else if (session.pdf) {
    userParts.push({
      fileData: { fileUri: session.pdf.fileUri, mimeType: session.pdf.mimeType },
    });
    userParts.push({
      text: `(Source PDF: ${session.pdf.displayName}. No local index — using long context.)\n\nUser question: ${query}`,
    });
  } else {
    userParts.push({ text: query });
  }

  const chat = model.startChat({ history: [] });
  let result = await chat.sendMessage(userParts);

  let iterations = 0;
  const MAX = 5;
  while (result.response.functionCalls()?.length && iterations < MAX) {
    const calls = result.response.functionCalls()!;
    const responses: Part[] = calls.map((call) => {
      const out = executeTool(countyId, call.name, (call.args || {}) as Record<string, unknown>);
      recordTool(sessionId, call.name, out.summary);
      return { functionResponse: { name: call.name, response: out.data as object } };
    });
    result = await chat.sendMessage(responses);
    iterations++;
  }

  return result.response.text();
}
