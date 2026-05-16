"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { PlusIcon, SendIcon, StopIcon } from "./Icons";

export interface ChatInputProps {
  onSubmit: (value: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface ChatInputHandle {
  focus: () => void;
  setValue: (value: string) => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  { onSubmit, onStop, isStreaming = false, placeholder = "Ask the Budget Watchdog…", disabled, autoFocus },
  ref,
) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    setValue: (v: string) => {
      setValue(v);
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
  }));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const hasText = value.trim().length > 0;

  return (
    <div className="w-full">
      <div className="relative flex items-end gap-2 rounded-3xl border border-zinc-200 bg-white px-3 py-2 shadow-[0_2px_24px_-12px_rgba(0,0,0,0.18)] transition focus-within:border-zinc-300 focus-within:shadow-[0_4px_32px_-12px_rgba(0,0,0,0.22)] dark:border-zinc-800 dark:bg-zinc-900/80 dark:focus-within:border-zinc-700">
        <button
          type="button"
          aria-label="Attach"
          className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className="max-h-60 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:text-zinc-100"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-900 text-white transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <StopIcon className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!hasText || disabled}
            aria-label="Send"
            className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-30 enabled:bg-linear-to-br enabled:from-[#4285f4] enabled:via-[#9b72cb] enabled:to-[#d96570] enabled:hover:brightness-110"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-500">
        Budget Watchdog can be inaccurate. Verify against the source gazette.
      </p>
    </div>
  );
});
