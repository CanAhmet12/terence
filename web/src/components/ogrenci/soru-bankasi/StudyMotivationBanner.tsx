"use client";

import { Flame, Play } from "lucide-react";

export function StudyMotivationBanner({
  tone = "exam",
  onStartQuick,
}: {
  tone?: "exam" | "school";
  onStartQuick: () => void;
}) {
  const school = tone === "school";
  return (
    <aside
      aria-label="Hızlı başlangıç"
      className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md shadow-orange-500/20">
          <Flame className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm font-semibold tracking-tight text-slate-800">
          {school ? "Kısa pratik turu" : "Bir set daha"}
        </p>
      </div>
      <button
        type="button"
        onClick={onStartQuick}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        <Play className="h-4 w-4 fill-current" aria-hidden />
        Başlat
      </button>
    </aside>
  );
}
