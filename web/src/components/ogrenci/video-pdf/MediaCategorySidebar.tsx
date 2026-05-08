"use client";

import type { MediaHubSubjectSummary } from "./types";

type Props = {
  rows: MediaHubSubjectSummary[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
};

export function MediaCategorySidebar({ rows, selectedSlug, onSelect }: Props) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">Dersler</h2>
      <p className="mt-1 text-xs text-slate-500">Müfredat ve medya sayıları</p>
      <ul className="mt-4 space-y-1">
        <li>
          <button
            type="button"
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              selectedSlug === null
                ? "bg-indigo-50 text-indigo-900"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => onSelect(null)}
          >
            <span>Tümü</span>
          </button>
        </li>
        {rows.map((r) => (
          <li key={r.slug}>
            <button
              type="button"
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                selectedSlug === r.slug
                  ? "bg-indigo-50 text-indigo-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => onSelect(r.slug)}
            >
              <span className="truncate pr-2">{r.name}</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {r.media_count}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
