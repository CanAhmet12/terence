"use client";

import type { MediaHubQuickFilter } from "./types";

const FILTERS: { id: MediaHubQuickFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "continue", label: "İzlemeye devam" },
  { id: "new", label: "Yeni" },
  { id: "pro", label: "PRO" },
];

type Props = {
  value: MediaHubQuickFilter;
  onChange: (v: MediaHubQuickFilter) => void;
};

export function MediaFilterTabs({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Hızlı filtreler"
      className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1"
    >
      {FILTERS.map((f) => {
        const selected = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              selected
                ? "bg-indigo-700 text-white shadow"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
            onClick={() => onChange(f.id)}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
