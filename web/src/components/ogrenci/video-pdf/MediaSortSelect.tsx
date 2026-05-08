"use client";

import { ListFilter } from "lucide-react";
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
    <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
      <ListFilter className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
      <span className="hidden font-semibold sm:inline">Sıralama</span>
      <select
        className="max-w-[11rem] cursor-pointer border-0 bg-transparent py-0.5 text-sm font-bold text-slate-900 focus:ring-0 sm:max-w-none"
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
