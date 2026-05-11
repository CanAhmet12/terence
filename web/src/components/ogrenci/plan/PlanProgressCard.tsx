"use client";

import { PlanSkeleton, CircularProgress } from "./plan-ui";
import { CheckCircle2, Plus } from "lucide-react";

export function PlanProgressCard({
  loading,
  progress,
  doneCount,
  totalCount,
  onAddClick,
}: {
  loading: boolean;
  progress: number;
  doneCount: number;
  totalCount: number;
  onAddClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          {loading ? (
            <PlanSkeleton className="h-20 w-20 rounded-full" />
          ) : (
            <>
              <CircularProgress
                pct={progress}
                size={80}
                stroke={7}
                color={progress === 100 ? "#06b6d4" : "#6366f1"}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-slate-800">
                  {Math.round(progress)}%
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="space-y-2">
              <PlanSkeleton className="h-6 w-32" />
              <PlanSkeleton className="h-4 w-48" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-black text-slate-900">
                {doneCount}
                <span className="text-lg font-medium text-slate-400">
                  /{totalCount}
                </span>
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                {progress === 100
                  ? "🎉 Tüm görevler tamamlandı!"
                  : doneCount > 0
                    ? `${totalCount - doneCount} görev kaldı`
                    : "Henüz görev tamamlanmadı"}
              </p>
              {progress === 100 && (
                <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-cyan-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Harika iş! Bugünkü planı bitirdin.
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Görev Ekle
        </button>
      </div>

      {!loading && totalCount > 0 && (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              progress === 100
                ? "bg-gradient-to-r from-cyan-400 to-cyan-500"
                : "bg-gradient-to-r from-indigo-500 to-violet-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
