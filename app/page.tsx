<<<<<<< HEAD
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ToolCall {
  name: string;
  summary: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  toolsUsed?: ToolCall[];
  timestamp: Date;
}

const TOOL_LABELS: Record<string, string> = {
  search_budget_data: "🔍 Searched budget data",
  compare_allocations: "📊 Compared allocations",
  get_ward_summary: "📍 Retrieved ward summary",
  explain_budget_term: "📖 Explained budget term",
  generate_sms_digest: "📱 Generated SMS digest",
  get_budget_overview: "🏛️ Retrieved budget overview",
};

const QUICK_ACTIONS = [
  { label: "Budget Overview", query: "Give me an overview of the Nairobi County budget", icon: "🏛️" },
  { label: "Health Spending", query: "How much is allocated to health services?", icon: "🏥" },
  { label: "Compare: Health vs Roads", query: "Compare health and transport infrastructure spending", icon: "📊" },
  { label: "Kibra Ward", query: "Show me the budget breakdown for Kibra ward", icon: "📍" },
  { label: "Education Budget", query: "What's the education and youth budget?", icon: "📚" },
  { label: "SMS Digest", query: "Generate an SMS digest about the overall budget", icon: "📱" },
  { label: "What is Equitable Share?", query: "Explain what equitable share means", icon: "📖" },
  { label: "Mathare Ward", query: "What projects are planned for Mathare ward?", icon: "🏗️" },
];

const STATS = [
  { label: "Total Budget", value: "KES 37.4B", icon: "💰", color: "var(--accent-green)" },
  { label: "Departments", value: "13", icon: "🏢", color: "var(--accent-amber)" },
  { label: "Wards Covered", value: "85", icon: "📍", color: "var(--accent-blue)" },
  { label: "Dev. Spending", value: "35%", icon: "🏗️", color: "var(--accent-red)" },
];

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
=======
import { Chat } from "@/components/dashboard/Chat";
>>>>>>> 1a82f0f1a1831c172a5fd0ac0eaf907983b9f4ca

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36));
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const agentMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: data.response,
        toolsUsed: data.toolsUsed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMsg]);

      // If the response contains an SMS digest, offer to send it
      if (data.toolsUsed?.some((t: ToolCall) => t.name === "generate_sms_digest")) {
        const digestMatch = data.response.match(/[🏛🏥🛣📚].*#BudgetWatch/);
        if (digestMatch) {
          setSmsMessage(digestMatch[0]);
        }
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const sendSms = async () => {
    if (!smsPhone || !smsMessage) return;
    setSmsStatus("Sending...");
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: smsPhone, message: smsMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsStatus(data.demo ? "✅ Demo: SMS simulated successfully!" : "✅ SMS sent successfully!");
        setTimeout(() => { setShowSmsModal(false); setSmsStatus(null); }, 2000);
      } else {
        setSmsStatus(`❌ ${data.error}`);
      }
    } catch {
      setSmsStatus("❌ Failed to send SMS");
    }
  };

  return (
<<<<<<< HEAD
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Kenyan gradient line */}
      <div className="header-line" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-glass)" }}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">🐕</div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              County Budget Watchdog
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Nairobi City County • FY 2025/2026 • Powered by Gemini 1.5 Pro
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSmsModal(true)}
            className="quick-action text-xs"
          >
            📱 Send SMS Digest
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
               style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Agent Online
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4" id="chat-messages">
            {/* Welcome state */}
            {messages.length === 0 && (
              <div className="max-w-3xl mx-auto animate-fade-in-up">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {STATS.map((stat) => (
                    <div key={stat.label} className="stat-card">
                      <div className="text-lg mb-1">{stat.icon}</div>
                      <div className="text-xl font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Welcome message */}
                <div className="glass-card p-6 mb-6">
                  <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    🐕 Habari! I&apos;m the Budget Watchdog
                  </h2>
                  <p className="text-sm mb-4" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    I help you understand how <strong style={{ color: "var(--accent-green)" }}>KES 37.4 billion</strong> of
                    Nairobi County&apos;s budget is allocated across <strong style={{ color: "var(--accent-amber)" }}>13 departments</strong> and{" "}
                    <strong style={{ color: "var(--accent-blue)" }}>85 wards</strong>. Ask me anything about
                    the budget — I&apos;ll search the real data and give you plain-language answers.
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    💡 I use AI tools to search budget data, compare allocations, and generate SMS digests. Try the quick actions below!
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.query)}
                      className="quick-action"
                    >
                      <span>{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`mb-4 animate-fade-in-up flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className={`max-w-[85%] ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"} px-5 py-3.5`}>
                    {/* Tool call badges */}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {msg.toolsUsed.map((tool, j) => (
                          <span key={j} className="tool-badge">
                            {TOOL_LABELS[tool.name] || tool.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Message content */}
                    {msg.role === "agent" ? (
                      <div
                        className="agent-text text-sm"
                        style={{ color: "var(--text-primary)", lineHeight: 1.7 }}
                        dangerouslySetInnerHTML={{ __html: formatAgentText(msg.content) }}
                      />
                    ) : (
                      <p className="text-sm" style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>
                        {msg.content}
                      </p>
                    )}
                    <div className="mt-2 text-right">
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="mb-4 flex justify-start animate-fade-in">
                  <div className="chat-bubble-agent px-5 py-4 flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Analyzing budget data...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions after messages */}
            {messages.length > 0 && !isLoading && (
              <div className="max-w-3xl mx-auto mt-2 mb-4 animate-fade-in">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.slice(0, 4).map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.query)}
                      className="quick-action text-xs"
                    >
                      <span>{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="px-6 py-4" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-glass)" }}>
            <div className="max-w-3xl mx-auto flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the Nairobi County budget..."
                rows={1}
                className="chat-input flex-1 px-5 py-3 resize-none"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="send-btn"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                ) : (
                  <>
                    Send
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <p className="max-w-3xl mx-auto text-[10px] mt-2 text-center" style={{ color: "var(--text-muted)" }}>
              County Budget Watchdog analyzes Nairobi City County FY 2025/2026 budget data using Gemini 1.5 Pro. Built for GDG Nairobi Agentathon 2026.
            </p>
          </div>
        </main>
      </div>

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="modal-overlay" onClick={() => setShowSmsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              📱 Send Budget Digest via SMS
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Send a budget summary to any Kenyan phone number
            </p>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="chat-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Message ({smsMessage.length}/160 chars)
              </label>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value.slice(0, 160))}
                placeholder="Enter budget digest message..."
                rows={3}
                className="chat-input w-full px-4 py-2.5 text-sm resize-none"
              />
            </div>

            {smsStatus && (
              <p className="text-sm mb-3 font-medium" style={{ color: smsStatus.startsWith("✅") ? "var(--accent-green)" : smsStatus.startsWith("❌") ? "var(--accent-red)" : "var(--text-secondary)" }}>
                {smsStatus}
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowSmsModal(false)} className="quick-action flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={sendSms}
                disabled={!smsPhone || !smsMessage}
                className="send-btn flex-1 justify-center"
              >
                Send SMS
              </button>
            </div>
          </div>
        </div>
      )}
=======
    <div className="flex h-dvh w-full flex-col bg-white dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-linear-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570]" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Budget Watchdog
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Chat greeting="Karibu" />
      </main>
>>>>>>> 1a82f0f1a1831c172a5fd0ac0eaf907983b9f4ca
    </div>
  );
}
