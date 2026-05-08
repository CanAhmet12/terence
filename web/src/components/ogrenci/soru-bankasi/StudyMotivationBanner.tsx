"use client";

import { Trophy } from "lucide-react";

export function StudyMotivationBanner({
  onStartQuick,
}: {
  onStartQuick: () => void;
}) {
  return (
    <div className="qb-motivation-banner flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[18px] bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-6 py-6 text-white shadow-[0_12px_40px_rgba(37,99,235,0.25)] sm:flex-row sm:items-center sm:px-8 sm:py-7">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <Trophy className="h-7 w-7 text-amber-200" aria-hidden />
        </div>
        <div className="max-w-xl">
          <p className="text-[15px] font-bold leading-snug">
            Hedeflerine ulaşmak için düzenli çalışmaya devam et!
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/95">
            Bugün 20 soru çözerek hedefini tamamlayabilirsin; hızlı set ile başla.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStartQuick}
        className="w-full shrink-0 rounded-xl bg-white px-6 py-3 text-[13px] font-bold text-blue-700 shadow-lg transition-colors hover:bg-sky-50 sm:w-auto"
      >
        Hemen Çözmeye Başla →
      </button>
    </div>
  );
}
