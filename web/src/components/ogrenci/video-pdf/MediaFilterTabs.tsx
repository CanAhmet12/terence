"use client";

import type { MediaHubQuickFilter } from "./types";

const FILTERS: { id: MediaHubQuickFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "continue", label: "İzlemeye Devam Et" },
  { id: "new", label: "Yeni Eklenenler" },
  { id: "pro", label: "PRO İçerikler" },
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
      className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-slate-50/90 p-1.5 shadow-sm"
    >
      {FILTERS.map((f) => {
        const selected = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
              selected
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
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
