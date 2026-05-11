"use client";

import type { WeakAchievement } from "@/lib/api";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";

export function PlanWeakSuggestions({
  weakAchievements,
  expanded,
  onToggle,
  addedWeakIds,
  addingWeakId,
  weakError,
  onAddWeak,
}: {
  weakAchievements: WeakAchievement[];
  expanded: boolean;
  onToggle: () => void;
  addedWeakIds: Set<number>;
  addingWeakId: number | null;
  weakError: string | null;
  onAddWeak: (wa: WeakAchievement) => void;
}) {
  if (weakAchievements.length === 0 && !weakError) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle()}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-violet-50/50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <Sparkles className="h-4 w-4 text-violet-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">
            AI Destekli Görev Önerileri
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {weakError
              ? weakError
              : `${weakAchievements.length} zayıf kazanım tespit edildi`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && weakAchievements.length > 0 && (
        <div className="divide-y divide-violet-50 border-t border-violet-50">
          {weakAchievements.map((wa) => {
            const isAdded = addedWeakIds.has(wa.id);
            const riskColor =
              wa.accuracy_rate < 40 ? "text-red-500" : "text-amber-500";
            return (
              <div
                key={wa.id}
                className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-violet-50/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="rounded-md bg-cyan-50 px-2 py-0.5 font-mono text-xs font-bold text-cyan-600">
                      {wa.kod}
                    </span>
                    <AlertTriangle className={`h-3.5 w-3.5 ${riskColor}`} />
                  </div>
                  <p className="truncate text-sm font-medium text-slate-700">
                    {wa.konu}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    %{wa.accuracy_rate} doğruluk · {wa.wrong_count} hata
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddWeak(wa)}
                  disabled={isAdded || addingWeakId === wa.id}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    isAdded
                      ? "cursor-default border-cyan-200 bg-cyan-50 text-cyan-600"
                      : "border-violet-200 bg-violet-100 text-violet-700 hover:bg-violet-200"
                  }`}
                >
                  {addingWeakId === wa.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isAdded ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {isAdded ? "Eklendi" : "Plana Ekle"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
