"use client";

export function QuestionBankQuickActions({
  onQuick10,
  onWeakFocus,
  onTimedPractice,
  disabled,
}: {
  onQuick10: () => void;
  onWeakFocus: () => void;
  onTimedPractice: () => void;
  disabled: boolean;
}) {
  const btn =
    "rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-indigo-100/80 pt-4">
      <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:w-auto">Hızlı modlar</span>
      <button type="button" className={btn} disabled={disabled} onClick={onQuick10}>
        Hızlı 10
      </button>
      <button type="button" className={btn} disabled={disabled} onClick={onWeakFocus}>
        Kazanım seti
      </button>
      <button type="button" className={btn} disabled={disabled} onClick={onTimedPractice}>
        Süreli 5 dk
      </button>
    </div>
  );
}
