"use client";

import { SparkleIcon } from "./Icons";

export interface MessageProps {
  role: "user" | "model";
  content: string;
  pending?: boolean;
}

export function Message({ role, content, pending }: MessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-3xl rounded-br-md bg-zinc-100 px-4 py-2.5 text-[15px] leading-6 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570] text-white">
        <SparkleIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-[15px] leading-7 text-zinc-800 dark:text-zinc-200">
        {pending && !content ? (
          <PendingDots />
        ) : (
          <div className="whitespace-pre-wrap wrap-break-word">{content}</div>
        )}
      </div>
    </div>
  );
}

function PendingDots() {
  return (
    <div className="flex h-7 items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
    </div>
  );
}
