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
      aria-label="Çalışma hatırlatması"
      className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-5 shadow-sm sm:p-6"
    >
      <div className="pointer-events-none absolute -left-8 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-orange-200/40 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-white shadow-sm">
            <Flame className="h-6 w-6 text-orange-500" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900 sm:text-xl">
              {school ? "Bugün bir pratik turu" : "Bugün bir set daha"}
            </p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
              {school
                ? "Düzenli tekrar, okul derslerinde fark yaratır. Kısa setle ısın, sonra zayıf konuna odaklan."
                : "Netini yükselten şey düzenli tekrar. Hızlı set ile ısın, sonra zayıf konuya dal."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartQuick}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-stretch rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 sm:self-center"
        >
          <Play className="h-5 w-5 fill-current" aria-hidden />
          Hızlı set ile başla
        </button>
      </div>
    </aside>
  );
}
