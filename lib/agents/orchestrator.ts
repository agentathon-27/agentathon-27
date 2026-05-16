// Orchestrator (Root) agent.
// Demonstrates the hierarchical multi-agent pattern required by the rules:
// the root agent does no domain work itself — it plans, delegates to a
// specialist via a delegate_* tool, then returns the specialist's reply.
//
// Sub-agents:
//   - BudgetAnalyst   → budget allocation Q&A, PDF long-context analysis
//   - GazetteMonitor  → Kenya Gazette amendment lookup
//   - DigestGenerator → SMS-sized digests + Africa's Talking delivery
import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclarationsTool,
  type Part,
} from "@google/generative-ai";
import { askBudgetAnalyst } from "./budget-analyst";
import { askGazetteMonitor } from "./gazette-monitor";
import { askDigestGenerator } from "./digest-generator";
import { consumeToolLog, getSession, recordTool } from "./sessions";
import { getApiKey, MODEL } from "./config";

import { getCountyName } from "@/lib/budget/counties";

const getSystemInstruction = (countyName: string) => `You are the County Budget Watchdog 🐕 Orchestrator for ${countyName}. You are the ENTRY POINT for every user request and you do NOT answer budget questions yourself. Your sole job is to PLAN and DELEGATE to the right specialist sub-agent.

Sub-agents available as tools:
- delegate_to_budget_analyst — for ANY question about ${countyName} budget allocations, departments, wards, programs, comparisons, or the uploaded PDF.
- delegate_to_gazette_monitor — for ANY question about Kenya Gazette notices affecting ${countyName}, budget amendments, supplementary appropriations, reallocations, or withdrawals.
- delegate_to_digest_generator — when the user wants an SMS digest or asks you to text/send a budget summary to a phone number.

Rules:
1. ALWAYS delegate. Never answer budget, gazette, or SMS questions from your own knowledge.
2. Re-state the user's question to the specialist clearly and include any context they'll need (e.g., "user uploaded a PDF, focus on health allocations").
3. If a single user message spans multiple specialists (e.g., "compare health spending AND check for amendments"), delegate to each in sequence and combine their answers.
4. For greetings / meta questions about your scope, answer briefly yourself and suggest 2–3 example queries.
5. Always return the specialist's response verbatim or with minimal connective wrapping. Do not paraphrase numbers.
6. Be concise. Markdown formatting is fine.`;

const getTools = (countyName: string): FunctionDeclarationsTool[] => [
  {
    functionDeclarations: [
      {
        name: "delegate_to_budget_analyst",
        description: `Send a question to the BudgetAnalyst sub-agent for ${countyName} budget Q&A, comparisons, ward summaries, or PDF analysis.`,
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "The full, self-contained question for the specialist." },
          },
          required: ["query"],
        },
      },
      {
        name: "delegate_to_gazette_monitor",
        description: `Send a question to the GazetteMonitor sub-agent about Kenya Gazette notices or budget amendments affecting ${countyName}.`,
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING },
          },
          required: ["query"],
        },
      },
      {
        name: "delegate_to_digest_generator",
        description: "Send a request to the DigestGenerator sub-agent to draft (and optionally send) an SMS budget digest.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING },
          },
          required: ["query"],
        },
      },
    ],
  },
];

export interface AgentResponse {
  text: string;
  toolsUsed: { name: string; summary: string }[];
  agentsCalled: string[];
}

export async function runOrchestrator(sessionId: string, userMessage: string, countyId?: string): Promise<AgentResponse> {
  const session = getSession(sessionId);
  
  if (countyId) {
    session.countyId = countyId;
  }
  
  const currentCountyId = session.countyId || "47";
  const countyName = getCountyName(currentCountyId);

  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: MODEL,
    tools: getTools(countyName),
    systemInstruction: getSystemInstruction(countyName),
  });

  const chat = model.startChat({ history: session.history });

  // Annotate the user turn with PDF presence so the orchestrator knows to mention it.
  const augmented = session.pdf
    ? `${userMessage}\n\n[context: user has uploaded a budget PDF named "${session.pdf.displayName}" this session]`
    : userMessage;

  let result = await chat.sendMessage(augmented);

  const agentsCalled: string[] = [];
  let iterations = 0;
  const MAX = 5;

  while (result.response.functionCalls()?.length && iterations < MAX) {
    const calls = result.response.functionCalls()!;
    const responses: Part[] = await Promise.all(
      calls.map(async (call) => {
        const args = (call.args || {}) as { query?: string };
        const sub = call.name;
        const subQuery = args.query ?? userMessage;
        let subText = "";
        try {
          if (sub === "delegate_to_budget_analyst") {
            agentsCalled.push("BudgetAnalyst");
            subText = await askBudgetAnalyst(sessionId, subQuery);
          } else if (sub === "delegate_to_gazette_monitor") {
            agentsCalled.push("GazetteMonitor");
            subText = await askGazetteMonitor(sessionId, subQuery);
          } else if (sub === "delegate_to_digest_generator") {
            agentsCalled.push("DigestGenerator");
            subText = await askDigestGenerator(sessionId, subQuery);
          } else {
            subText = `Unknown delegate target: ${sub}`;
          }
        } catch (e) {
          subText = e instanceof Error ? `Specialist error: ${e.message}` : "Specialist error";
        }
        recordTool(sessionId, sub, `Routed to ${sub.replace("delegate_to_", "")}`);
        return {
          functionResponse: {
            name: sub,
            response: { reply: subText },
          },
        };
      }),
    );
    result = await chat.sendMessage(responses);
    iterations++;
  }

  // Persist updated history so the orchestrator keeps memory across turns.
  session.history = await chat.getHistory();

  return {
    text: result.response.text(),
    toolsUsed: consumeToolLog(sessionId),
    agentsCalled,
  };
}
