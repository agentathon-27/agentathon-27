import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Message, type ToolCall } from "@/components/ui/Message";
import { ChatInput, type ChatInputHandle } from "@/components/ui/ChatInput";
import { SuggestionChip } from "@/components/ui/SuggestionChip";
import { counties } from "@/lib/budget/counties";
import { getCountyData, formatKES } from "@/lib/budget/data";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  toolsUsed?: ToolCall[];
  agentsCalled?: string[];
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36));
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [countyId, setCountyId] = useState("47"); // Default to Nairobi

  const countyData = useMemo(() => getCountyData(countyId), [countyId]);

  const QUICK_ACTIONS = useMemo(() => [
    { label: "Budget Overview", query: `Give me an overview of the ${countyData.info.name} budget`, hint: "🏛️ Overview" },
    { label: "Health Spending", query: "How much is allocated to health services?", hint: "🏥 Health" },
    { label: "Compare: Health vs Roads", query: "Compare health and transport infrastructure spending", hint: "📊 Compare" },
    { label: "Ward Summary", query: `Show me the budget breakdown for a ward in ${countyData.info.name}`, hint: "📍 Ward" },
    { label: "Recent Gazette Amendments", query: `What are the latest Kenya Gazette amendments to the ${countyData.info.name} budget?`, hint: "📰 Gazette" },
    { label: "Reallocations", query: "Find any gazette reallocations affecting Transport & Infrastructure", hint: "🔁 Track" },
    { label: "SMS Digest", query: "Generate an SMS digest about the overall budget", hint: "📱 SMS" },
    { label: "What is Equitable Share?", query: "Explain what equitable share means", hint: "📖 Terms" },
  ], [countyData]);

  const STATS = useMemo(() => [
    { label: "Total Budget", value: formatKES(countyData.info.totalBudget), icon: "💰", color: "var(--text-primary)" },
    { label: "Departments", value: countyData.info.totalDepartments.toString(), icon: "🏢", color: "var(--text-secondary)" },
    { label: "Wards Covered", value: countyData.info.totalWards.toString(), icon: "📍", color: "var(--text-secondary)" },
    { label: "Dev. Spending", value: `${((countyData.info.totalDevelopment / countyData.info.totalBudget) * 100).toFixed(0)}%`, icon: "🏗️", color: "var(--text-muted)" },
  ], [countyData]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), sessionId, countyId }),
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
        agentsCalled: data.agentsCalled,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMsg]);

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
  }, [isLoading, sessionId, countyId]);


  const uploadPdf = useCallback(async (file: File) => {
    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sessionId", sessionId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPdfName(file.name);
      const sysMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: `📄 **${file.name}** attached. Ask me anything about this budget PDF — I'll feed it to the BudgetAnalyst via Gemini 1.5 Pro's long context.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sysMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: `⚠️ Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setPdfUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [sessionId]);

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
              Multi-agent system • {countyData.info.name} {countyData.info.fiscalYear} • Gemini 1.5 Pro
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={countyId} 
            onChange={(e) => {
              setCountyId(e.target.value);
              setMessages([]); // Clear chat on county change
            }}
            className="quick-action text-xs bg-transparent cursor-pointer outline-none border-none pr-2"
          >
            {counties.map(c => (
              <option key={c.id} value={c.id} style={{ background: "var(--bg-secondary)" }}>
                📍 {c.name}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPdf(f);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={pdfUploading}
            className="quick-action text-xs"
            title="Upload a county budget PDF for the BudgetAnalyst to analyze"
          >
            {pdfUploading ? "⏳ Uploading…" : pdfName ? `📄 ${pdfName.slice(0, 18)}${pdfName.length > 18 ? "…" : ""}` : "📄 Upload Budget PDF"}
          </button>
          <button
            onClick={() => setShowSmsModal(true)}
            className="quick-action text-xs"
          >
            📱 Send SMS Digest
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
               style={{ background: "var(--bg-glass)", color: "var(--text-primary)", border: "1px solid var(--border-glass)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
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
                    I help you understand how <strong style={{ color: "var(--text-primary)" }}>{formatKES(countyData.info.totalBudget)}</strong> of{" "}
                    {countyData.info.name}&apos;s budget is allocated across <strong style={{ color: "var(--text-primary)" }}>{countyData.info.totalDepartments} departments</strong> and{" "}
                    <strong style={{ color: "var(--text-primary)" }}>{countyData.info.totalWards} wards</strong>. Ask me anything about
                    the budget — I&apos;ll search the real data and give you plain-language answers.
                  </p>
                  {countyId !== "47" && (
                    <p className="text-xs mb-4 italic" style={{ color: "var(--text-muted)" }}>
                      Note: Demo structured data is currently prioritized for Nairobi. For other counties, I will use placeholder structures or analyze your uploaded PDF.
                    </p>
                  )}
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    💡 I use AI tools to search budget data, compare allocations, and generate SMS digests. Try the quick actions below!
                  </p>
                </div>

            {/* Quick actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUICK_ACTIONS.map((action) => (
                    <SuggestionChip
                      key={action.label}
                      label={action.label}
                      hint={action.hint}
                      onClick={() => sendMessage(action.query)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="max-w-3xl mx-auto">
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  toolsUsed={msg.toolsUsed}
                  agentsCalled={msg.agentsCalled}
                />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <Message
                  role="agent"
                  content=""
                  pending={true}
                />
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
                      <span>{action.hint.split(' ')[0]}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="px-6 py-4" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-glass)" }}>
            <div className="max-w-3xl mx-auto">
              <ChatInput
                ref={inputRef}
                onSubmit={sendMessage}
                disabled={isLoading}
                isStreaming={isLoading}
              />
            </div>
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
              <p className="text-sm mb-3 font-medium" style={{ color: smsStatus.startsWith("✅") ? "var(--text-primary)" : smsStatus.startsWith("❌") ? "var(--text-muted)" : "var(--text-secondary)" }}>
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
    </div>
  );
}
