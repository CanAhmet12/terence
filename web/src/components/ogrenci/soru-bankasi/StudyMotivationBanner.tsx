"use client";

import { Trophy } from "lucide-react";

export function StudyMotivationBanner({
  onStartQuick,
}: {
  onStartQuick: () => void;
}) {
  return (
    <div className="qb-motivation-banner mt-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-[var(--qb-card-radius)] bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-700 p-4 text-white shadow-lg shadow-indigo-900/20 sm:flex-row sm:items-center sm:p-5">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Trophy className="h-6 w-6 text-amber-300" aria-hidden />
        </div>
        <div>
          <p className="text-base font-bold leading-tight">Hemen çözmeye başla</p>
          <p className="mt-1 text-xs leading-snug text-white/85 sm:text-sm">
            On soruluk hızlı set ile başla; doğruluk yükseldikçe öneriler güncellenir.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStartQuick}
        className="w-full shrink-0 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-md transition-colors hover:bg-indigo-50 sm:w-auto sm:text-sm"
      >
        Hemen Çözmeye Başla
      </button>
    </div>
  );
}
