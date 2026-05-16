// Gemini 1.5 Pro client with function calling for the Budget Watchdog agent
import { GoogleGenerativeAI, Content, Part, SchemaType, type FunctionDeclarationsTool } from "@google/generative-ai";
import { executeTool } from "./budget/tools";

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

const SYSTEM_INSTRUCTION = `You are the County Budget Watchdog 🐕, an AI agent that helps Kenyan citizens understand their county's budget allocations. You analyze the Nairobi City County FY 2025/2026 budget and provide clear, plain-language answers.

Your role:
- Answer questions about budget allocations in plain, accessible language that any Kenyan can understand
- Compare spending across departments and wards
- Explain budget jargon and financial terms simply
- Generate SMS-friendly budget digests for mobile users
- Help citizens hold their county government accountable through budget transparency

CRITICAL RULES:
1. ALWAYS use your tools to look up actual budget data before answering. NEVER make up or guess numbers.
2. Present amounts in KES (Kenya Shillings) with proper formatting (e.g., KES 12.1B, KES 500M)
3. Be specific — cite exact figures, departments, wards, and programs
4. When comparing, show percentage differences and year-on-year changes
5. Keep language accessible — avoid complex financial jargon, or explain it when you must use it
6. Format responses with clear headings, bullet points, and emphasis on key numbers
7. Show genuine care for Kenyan citizens' right to budget transparency
8. If asked about something outside the budget data, politely explain your scope

You have access to these tools:
- search_budget_data: Search budget items by keyword, department, or ward
- compare_allocations: Compare spending between two departments
- get_ward_summary: Get ward-level budget breakdown with projects
- explain_budget_term: Explain budget/financial terms in plain language
- generate_sms_digest: Create SMS-friendly budget summaries (160 chars)
- get_budget_overview: Get overall county budget statistics

When greeting users, briefly introduce yourself and suggest what they can ask about.`;

const toolDeclarations: FunctionDeclarationsTool[] = [
  {
    functionDeclarations: [
      {
        name: "search_budget_data",
        description: "Search and filter budget allocation data by keyword, department name, or ward. Use this to find specific budget items, programs, or allocations.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Search keyword (e.g., 'health', 'road construction', 'water supply')" },
            department: { type: SchemaType.STRING, description: "Optional: filter by department name (e.g., 'Health Services', 'Transport')" },
            ward: { type: SchemaType.STRING, description: "Optional: filter by ward name (e.g., 'Kibra', 'Westlands')" },
          },
          required: ["query"],
        },
      },
      {
        name: "compare_allocations",
        description: "Compare budget allocations between two departments. Shows total allocation, recurrent vs development split, year-on-year growth, and programs.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            department_a: { type: SchemaType.STRING, description: "First department name (e.g., 'Health', 'Education')" },
            department_b: { type: SchemaType.STRING, description: "Second department name (e.g., 'Transport', 'Water')" },
          },
          required: ["department_a", "department_b"],
        },
      },
      {
        name: "get_ward_summary",
        description: "Get a detailed budget summary for a specific ward, including sector-by-sector breakdown and key development projects.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ward_name: { type: SchemaType.STRING, description: "Ward name (e.g., 'Kibra', 'Langata', 'Westlands', 'Mathare')" },
          },
          required: ["ward_name"],
        },
      },
      {
        name: "explain_budget_term",
        description: "Explain a budget or financial term in simple, plain language that any citizen can understand.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            term: { type: SchemaType.STRING, description: "The budget term to explain (e.g., 'recurrent expenditure', 'supplementary budget', 'equitable share')" },
          },
          required: ["term"],
        },
      },
      {
        name: "generate_sms_digest",
        description: "Generate a concise SMS-friendly budget summary (under 160 characters) on a specific topic.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            topic: { type: SchemaType.STRING, description: "Topic for the digest (e.g., 'health', 'roads', 'education', or 'overview' for general summary)" },
          },
          required: ["topic"],
        },
      },
      {
        name: "get_budget_overview",
        description: "Get overall county budget statistics including total budget, recurrent vs development split, top departments, and key metrics.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
          required: [],
        },
      },
    ],
  },
];

// In-memory session storage
const sessions = new Map<string, Content[]>();

export interface AgentResponse {
  text: string;
  toolsUsed: { name: string; summary: string }[];
}

export async function chatWithAgent(sessionId: string, userMessage: string): Promise<AgentResponse> {
  if (!API_KEY) {
    throw new Error("GOOGLE_API_KEY environment variable is not set. Please set it in your .env file.");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    tools: toolDeclarations,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const history = sessions.get(sessionId) || [];
  const chat = model.startChat({ history });

  const toolsUsed: { name: string; summary: string }[] = [];

  let result = await chat.sendMessage(userMessage);

  // Function calling loop — agent may call multiple tools
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (result.response.functionCalls()?.length && iterations < MAX_ITERATIONS) {
    const calls = result.response.functionCalls()!;
    
    const functionResponses: Part[] = calls.map((call) => {
      const toolResult = executeTool(call.name, (call.args || {}) as Record<string, unknown>);
      toolsUsed.push({ name: call.name, summary: toolResult.summary });
      
      return {
        functionResponse: {
          name: call.name,
          response: toolResult.data as object,
        },
      };
    });

    result = await chat.sendMessage(functionResponses);
    iterations++;
  }

  // Save updated history
  const updatedHistory = await chat.getHistory();
  sessions.set(sessionId, updatedHistory);

  return {
    text: result.response.text(),
    toolsUsed,
  };
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}
