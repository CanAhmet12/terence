"use client";

import { Clock, Flame, Zap } from "lucide-react";

export function QuestionBankStudyModes({
  adaptiveHint,
  onQuick10,
  onWeakFocus,
  onTimedPractice,
  disabled,
}: {
  adaptiveHint: string | null;
  onQuick10: () => void;
  onWeakFocus: () => void;
  onTimedPractice: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-800">Çalışma modları</h2>
      {adaptiveHint && (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600" role="status">
          {adaptiveHint}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onQuick10}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-900 disabled:opacity-50"
        >
          <Zap className="h-4 w-4" aria-hidden />
          Hızlı 10
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onWeakFocus}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 disabled:opacity-50"
        >
          <Flame className="h-4 w-4" aria-hidden />
          Kazanım seti
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onTimedPractice}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-950 disabled:opacity-50"
        >
          <Clock className="h-4 w-4" aria-hidden />
          Süreli 5 dk
        </button>
      </div>
    </div>
  );
}
