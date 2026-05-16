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
      className="group stat-card flex h-32 w-full flex-col justify-between text-left"
    >
      {hint && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)", border: "1px solid color-mix(in oklab, var(--accent-green) 25%, transparent)" }}>
          {hint}
        </span>
      )}
      <span className="line-clamp-3 text-sm font-medium leading-snug transition-colors"
            style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
      <span className="flex items-center gap-1 text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: "var(--accent-green)" }}>
        Ask now
        <span aria-hidden>→</span>
      </span>
    </button>
  );
}
