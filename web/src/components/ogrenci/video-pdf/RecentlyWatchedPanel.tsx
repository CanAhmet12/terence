"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { UnifiedMediaItem } from "./types";
import { readRecentWatches, type RecentWatchEntry } from "./utils";

type Props = {
  items: UnifiedMediaItem[];
  recentTick?: number;
  onPick: (item: UnifiedMediaItem) => void;
};

export function RecentlyWatchedPanel({ items, recentTick = 0, onPick }: Props) {
  const [recent, setRecent] = useState<RecentWatchEntry[]>([]);

  useEffect(() => {
    setRecent(readRecentWatches());
    const onStorage = () => setRecent(readRecentWatches());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [items, recentTick]);

  const resolved = recent
    .map((r) => {
      const item = items.find((i) => i.key === r.key);
      return item ? { entry: r, item } : null;
    })
    .filter(Boolean) as { entry: RecentWatchEntry; item: UnifiedMediaItem }[];

  if (resolved.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Clock className="h-4 w-4 text-indigo-600" aria-hidden />
          Son izlenenler
        </h2>
        <p className="mt-2 text-xs text-slate-500">Henüz kayıt yok; bir video veya PDF açtığınızda burada listelenir.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Clock className="h-4 w-4 text-indigo-600" aria-hidden />
        Son izlenenler
      </h2>
      <ul className="mt-3 space-y-2">
        {resolved.slice(0, 8).map(({ entry, item }) => (
          <li key={entry.key}>
            <button
              type="button"
              onClick={() => onPick(item)}
              className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs transition hover:border-indigo-200 hover:bg-white"
            >
              <span className="line-clamp-2 font-semibold text-slate-900">{entry.title}</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">{entry.subjectName}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
