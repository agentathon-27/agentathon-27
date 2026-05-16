// DigestGenerator sub-agent.
// Responsibility: turn budget analysis into a 160-char SMS digest and (when
// the user supplies a phone number) send it via Africa's Talking.
import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclarationsTool,
  type Part,
} from "@google/generative-ai";
import { generateSmsDigest } from "@/lib/budget/tools";
import { sendSms } from "@/lib/sms/africastalking";
import { recordTool } from "./sessions";
import { getApiKey, MODEL } from "./config";

import { getCountyName } from "@/lib/budget/counties";
import { getSession } from "./sessions";

const getSystemInstruction = (countyName: string) => `You are the DigestGenerator, a specialist sub-agent of the County Budget Watchdog for Kenyan Counties.

Scope:
- Produce SMS-sized (≤160 chars) summaries of Kenyan County budget topics for ward residents.
- Support both English and Swahili (Kiswahili) digests.
- Optionally deliver the SMS via Africa's Talking when a phone number is provided.

Rules:
1. ALWAYS call generate_digest first to draft the message.
2. SMS must be ≤160 chars including the #BudgetWatch hashtag.
3. Tone: factual, KES-formatted (e.g., 12.1B, 500M), citizen-friendly.
4. If the user asks in Swahili, call generate_digest with language="sw".
5. Only call send_sms if the user explicitly provides a Kenyan phone number this turn.
6. Echo the final digest text back to the user so they can see what was (or would be) sent.`;

const tools: FunctionDeclarationsTool[] = [
  {
    functionDeclarations: [
      {
        name: "generate_digest",
        description: "Draft a 160-character SMS digest on a given budget topic (health, roads, education, overview, etc.).",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            topic: { type: SchemaType.STRING, description: "Topic e.g. 'health', 'roads', 'overview'" },
            language: { type: SchemaType.STRING, description: "Language code: 'en' for English (default) or 'sw' for Swahili" },
          },
          required: ["topic"],
        },
      },
      {
        name: "send_sms",
        description: "Send the digest to a Kenyan phone number via Africa's Talking. Only call this when the user has supplied a number.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            phone: { type: SchemaType.STRING, description: "Kenyan number, +254XXXXXXXXX or 07XXXXXXXX" },
            message: { type: SchemaType.STRING, description: "The SMS body, ≤160 chars" },
          },
          required: ["phone", "message"],
        },
      },
    ],
  },
];

async function runTool(countyId: string, name: string, args: Record<string, unknown>): Promise<{ summary: string; data: unknown }> {
  if (name === "generate_digest") {
    const out = generateSmsDigest(countyId, {
      topic: String(args.topic ?? "overview"),
      language: String(args.language ?? "en"),
    });
    return { summary: out.summary, data: out.data };
  }
  if (name === "send_sms") {
    try {
      const result = await sendSms(String(args.phone ?? ""), String(args.message ?? ""));
      return {
        summary: result.demo
          ? `Demo-mode SMS to ${result.phone} (${result.characterCount} chars)`
          : `Sent SMS to ${result.phone} (${result.characterCount} chars)`,
        data: result,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send_sms failed";
      return { summary: msg, data: { error: msg } };
    }
  }
  return { summary: `Unknown tool ${name}`, data: null };
}

export async function askDigestGenerator(sessionId: string, query: string): Promise<string> {
  const session = getSession(sessionId);
  const countyId = session.countyId || "47";
  const countyName = getCountyName(countyId);

  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: MODEL,
    tools,
    systemInstruction: getSystemInstruction(countyName),
  });

  const chat = model.startChat({ history: [] });
  let result = await chat.sendMessage(query);

  let iterations = 0;
  const MAX = 4;
  while (result.response.functionCalls()?.length && iterations < MAX) {
    const calls = result.response.functionCalls()!;
    const responses: Part[] = await Promise.all(
      calls.map(async (call) => {
        const out = await runTool(countyId, call.name, (call.args || {}) as Record<string, unknown>);
        recordTool(sessionId, call.name, out.summary);
        return { functionResponse: { name: call.name, response: out.data as object } };
      }),
    );
    result = await chat.sendMessage(responses);
    iterations++;
  }

  return result.response.text();
}
