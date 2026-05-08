"use client";

import { Target } from "lucide-react";

export function StudyMotivationBanner({
  onStartQuick,
}: {
  onStartQuick: () => void;
}) {
  return (
    <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-5 sm:flex-row sm:items-center">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
          <Target className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="font-bold text-slate-900">Bugün küçük bir hedef koy</p>
          <p className="mt-0.5 text-sm text-slate-600">
            On soruluk hızlı set ile başla; doğruluk yükseldikçe zorluk önerisi güncellenir.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStartQuick}
        className="w-full shrink-0 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-purple-700 sm:w-auto"
      >
        Hızlı 10 başlat
      </button>
    </div>
  );
}
