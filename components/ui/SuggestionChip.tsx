"use client";

export interface SuggestionChipProps {
  label: string;
  hint?: string;
  onClick: () => void;
}

export function SuggestionChip({ label, hint, onClick }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-32 w-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900 stat-card"
    >
      <span className="line-clamp-3 text-sm text-secondary group-hover:text-primary font-medium">{label}</span>
      {hint && (
        <span className="text-xs text-muted group-hover:text-secondary">{hint}</span>
      )}
    </button>
  );
}
