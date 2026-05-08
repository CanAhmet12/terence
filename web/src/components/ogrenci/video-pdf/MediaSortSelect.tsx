"use client";

import type { MediaHubSort } from "./types";

const OPTIONS: { value: MediaHubSort; label: string }[] = [
  { value: "order", label: "Sıra (müfredat)" },
  { value: "title_asc", label: "Başlık A→Z" },
  { value: "title_desc", label: "Başlık Z→A" },
  { value: "progress_desc", label: "İlerleme (yüksek)" },
];

type Props = {
  value: MediaHubSort;
  onChange: (v: MediaHubSort) => void;
};

export function MediaSortSelect({ value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden font-medium sm:inline">Sırala</span>
      <select
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as MediaHubSort)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
