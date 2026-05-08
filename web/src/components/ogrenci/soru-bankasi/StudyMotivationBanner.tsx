"use client";

import { Trophy } from "lucide-react";

export function StudyMotivationBanner({
  onStartQuick,
}: {
  onStartQuick: () => void;
}) {
  return (
    <div className="qb-motivation-banner mt-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-[var(--qb-card-radius)] bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 p-4 text-white shadow-lg shadow-blue-900/20 sm:flex-row sm:items-center sm:p-5">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Trophy className="h-6 w-6 text-amber-200" aria-hidden />
        </div>
        <div>
          <p className="text-base font-bold leading-tight">Hedefe bir adım daha</p>
          <p className="mt-1 text-xs leading-snug text-white/90 sm:text-sm">
            Hızlı setle başla; netin arttıkça öneriler ve rozetler güncellenir.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStartQuick}
        className="w-full shrink-0 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-md transition-colors hover:bg-sky-50 sm:w-auto sm:text-sm"
      >
        Hemen Çözmeye Başla
      </button>
    </div>
  );
}
