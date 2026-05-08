"use client";

import { Trophy } from "lucide-react";

export function StudyMotivationBanner({
  onStartQuick,
}: {
  onStartQuick: () => void;
}) {
  return (
    <div className="mt-10 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[var(--qb-card-radius)] bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-900/25 sm:flex-row sm:items-center">
      <div className="flex gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <Trophy className="h-7 w-7 text-amber-300" aria-hidden />
        </div>
        <div>
          <p className="text-lg font-bold">Hemen çözmeye başla</p>
          <p className="mt-1 text-sm text-white/85">
            On soruluk hızlı set ile başla; doğruluk yükseldikçe öneriler güncellenir.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStartQuick}
        className="w-full shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-lg transition-colors hover:bg-indigo-50 sm:w-auto"
      >
        Hemen Çözmeye Başla
      </button>
    </div>
  );
}
