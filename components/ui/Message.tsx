"use client";

import { SparkleIcon } from "./Icons";

export interface ToolCall {
  name: string;
  summary: string;
}

export interface MessageProps {
  role: "user" | "model" | "agent";
  content: string;
  pending?: boolean;
  toolsUsed?: ToolCall[];
  agentsCalled?: string[];
  timestamp?: Date;
}

const TOOL_LABELS: Record<string, string> = {
  search_budget_data: "🔍 Searched budget data",
  compare_allocations: "📊 Compared allocations",
  get_ward_summary: "📍 Retrieved ward summary",
  explain_budget_term: "📖 Explained budget term",
  generate_sms_digest: "📱 Generated SMS digest",
  generate_digest: "📱 Generated SMS digest",
  get_budget_overview: "🏛️ Retrieved budget overview",
  search_gazette: "📰 Searched Kenya Gazette",
  summarize_amendment: "📰 Summarized amendment",
  send_sms: "📤 Sent SMS",
  delegate_to_budget_analyst: "🧭 → BudgetAnalyst",
  delegate_to_gazette_monitor: "🧭 → GazetteMonitor",
  delegate_to_digest_generator: "🧭 → DigestGenerator",
};

const AGENT_BADGE_COLOR: Record<string, string> = {
  BudgetAnalyst: "var(--text-primary)",
  GazetteMonitor: "var(--text-secondary)",
  DigestGenerator: "var(--text-muted)",
};

function formatAgentText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n- /g, "\n• ")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
    .replace(/#{3}\s*(.*?)(?:<br\/>|$)/g, "<h3>$1</h3>")
    .replace(/#{2}\s*(.*?)(?:<br\/>|$)/g, "<h3>$1</h3>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function Message({ role, content, pending, toolsUsed, agentsCalled, timestamp }: MessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] chat-bubble-user px-5 py-3.5 text-sm leading-6">
          {content}
          {timestamp && (
            <div className="mt-2 text-right">
              <span className="text-[10px] text-muted">
                {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start mb-4">
      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-background">
        <SparkleIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 chat-bubble-agent px-5 py-3.5">
        {/* Agent delegation chain */}
        {agentsCalled && agentsCalled.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted">
              Orchestrator →
            </span>
            {agentsCalled.map((a, j) => (
              <span
                key={j}
                className="tool-badge"
                style={{ color: AGENT_BADGE_COLOR[a] || "var(--text-primary)", borderColor: AGENT_BADGE_COLOR[a] || undefined }}
              >
                {a}
              </span>
            ))}
          </div>
        )}
        {/* Tool call badges */}
        {toolsUsed && toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {toolsUsed.map((tool, j) => (
              <span key={j} className="tool-badge">
                {TOOL_LABELS[tool.name] || tool.name}
              </span>
            ))}
          </div>
        )}

        {pending && !content ? (
          <PendingDots />
        ) : (
          <div
            className="agent-text text-sm leading-7"
            dangerouslySetInnerHTML={{ __html: formatAgentText(content) }}
          />
        )}

        <div className="mt-2 text-right">
          <span className="text-[10px] text-muted">
            {timestamp ? timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}

function PendingDots() {
  return (
    <div className="flex h-7 items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
    </div>
  );
}
