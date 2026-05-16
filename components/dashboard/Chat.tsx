"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatInput, type ChatInputHandle } from "@/components/ui/ChatInput";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { Message } from "@/components/ui/Message";
import { SuggestionChip } from "@/components/ui/SuggestionChip";
import type { ChatMessage } from "@/types/chat";

const SUGGESTIONS: { label: string; hint: string }[] = [
  { label: "Where did the KES 50M for our ward's water project go?", hint: "Trace allocation" },
  { label: "Summarize the latest county budget in plain Swahili.", hint: "Plain language" },
  { label: "What changed in the most recent gazette amendment?", hint: "Track amendments" },
  { label: "Compare health vs roads spending in Nairobi County.", hint: "Sector compare" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function Chat({ greeting = "Hello" }: { greeting?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
      const modelMsg: ChatMessage = { id: uid(), role: "model", content: "", pending: true };
      const next = [...messages, userMsg, modelMsg];
      setMessages(next);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next
              .filter((m) => m.role === "user" || (m.role === "model" && m.content))
              .map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === modelMsg.id ? { ...m, content: acc, pending: false } : m)),
          );
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsg.id ? { ...m, content: `⚠ ${message}`, pending: false } : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.pending ? { ...m, pending: false, content: m.content || "(stopped)" } : m)),
    );
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full w-full flex-col">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col justify-center px-4 pb-12 pt-24">
            <GradientHeading>{greeting}, ward resident.</GradientHeading>
            <p className="mt-2 text-2xl text-zinc-500">
              How can I help you read the county budget today?
            </p>
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <SuggestionChip
                  key={s.label}
                  label={s.label}
                  hint={s.hint}
                  onClick={() => send(s.label)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
            {messages.map((m) => (
              <Message key={m.id} role={m.role} content={m.content} pending={m.pending} />
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
        <ChatInput
          ref={inputRef}
          onSubmit={send}
          onStop={stop}
          isStreaming={isStreaming}
          autoFocus
        />
      </div>
    </div>
  );
}
