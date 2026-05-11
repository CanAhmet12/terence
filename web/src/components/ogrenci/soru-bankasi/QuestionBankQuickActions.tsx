"use client";

import { Crosshair, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuestionBankQuickActions({
  onQuick10,
  onWeakFocus,
  disabled,
}: {
  onQuick10: () => void;
  onWeakFocus: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <button
        type="button"
        disabled={disabled}
        onClick={onQuick10}
        title="Rastgele 10 soruluk set"
        className={cn(
          "group flex flex-1 items-center gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 text-left shadow-sm transition",
          "hover:border-amber-200/80 hover:shadow-md",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]",
          "disabled:pointer-events-none disabled:opacity-45"
        )}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25">
          <Zap className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <span className="block text-base font-semibold tracking-tight text-slate-900">Hızlı 10</span>
          <span className="mt-0.5 block text-xs font-medium text-slate-500">Akışa gir</span>
        </div>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onWeakFocus}
        title="İlk zayıf kazanımdan set yükle"
        className={cn(
          "group flex flex-1 items-center gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 text-left shadow-sm transition",
          "hover:border-violet-200/90 hover:shadow-md",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]",
          "disabled:pointer-events-none disabled:opacity-45"
        )}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/30">
          <Crosshair className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <span className="block text-base font-semibold tracking-tight text-slate-900">Zayıf konu</span>
          <span className="mt-0.5 block text-xs font-medium text-slate-500">Otomatik set</span>
        </div>
      </button>
    </div>
  );
}
