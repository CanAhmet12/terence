"use client";

import type { MediaHubSubjectSummary } from "./types";

type Props = {
  rows: MediaHubSubjectSummary[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
};

export function MediaSubjectChips({ rows, selectedSlug, onSelect }: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Ders filtresi"
    >
      <button
        type="button"
        role="tab"
        aria-selected={selectedSlug === null}
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
          selectedSlug === null
            ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
            : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/50"
        }`}
      >
        Tüm dersler
      </button>
      {rows.map((r) => (
        <button
          key={r.slug}
          type="button"
          role="tab"
          aria-selected={selectedSlug === r.slug}
          onClick={() => onSelect(r.slug)}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
            selectedSlug === r.slug
              ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
              : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/50"
          }`}
        >
          <span className="max-w-[10rem] truncate">{r.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              selectedSlug === r.slug ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {r.media_count ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
