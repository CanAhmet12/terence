"use client";

import Link from "next/link";
import { ClipboardList, History, Target } from "lucide-react";
import type { ExamSession } from "@/lib/api";
import type { PlanStats } from "@/lib/api";
import { cn } from "@/lib/utils";

function examAnswered(ex: ExamSession): number {
  const c = ex.correct_count ?? 0;
  const w = ex.wrong_count ?? 0;
  const e = ex.empty_count ?? 0;
  const sum = c + w + e;
  if (sum > 0) return sum;
  return ex.total_questions ?? 0;
}

function examProgressPct(ex: ExamSession): number {
  const total = ex.total_questions ?? 0;
  const answered = examAnswered(ex);
  if (total > 0) return Math.min(100, Math.round((answered / total) * 100));
  if (typeof ex.score === "number" && ex.score <= 100 && ex.score >= 0) return Math.round(ex.score);
  return 0;
}

function examScoreLabel(ex: ExamSession): string {
  if (ex.net_score != null && ex.net_score !== undefined) return `%${Math.round(Number(ex.net_score))}`;
  if (typeof ex.score === "number") return `%${Math.round(ex.score)}`;
  const total = ex.total_questions ?? 0;
  const c = ex.correct_count ?? 0;
  if (total > 0) return `%${Math.round((c / total) * 100)}`;
  return "—";
}

export function QuestionBankSidebar({
  examHistory,
  planStats,
  loading,
  onPersonalTest,
  hidePersonalTestCard = false,
  compact = false,
}: {
  examHistory: ExamSession[];
  planStats: PlanStats | null;
  loading: boolean;
  onPersonalTest: () => void;
  hidePersonalTestCard?: boolean;
  /** Soru bankası sayfası: hafta şeridi yok, daha sıkı düzen */
  compact?: boolean;
}) {
  const done = planStats?.tasks_done_today ?? 0;
  const total = planStats?.tasks_total_today ?? 0;
  const pct =
    total > 0 ? Math.min(100, Math.round((done / Math.max(total, 1)) * 100)) : done > 0 ? 100 : 0;

  const historyLimit = compact ? 3 : 5;
  const sectionClass = compact
    ? "rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-sm"
    : "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <aside aria-label="Özet" className={cn("flex flex-col gap-3", compact && "gap-3")}>
      {!hidePersonalTestCard && (
        <section className={sectionClass}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 shadow-sm">
              <ClipboardList className="h-5 w-5 text-violet-600" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Bana özel test</h2>
              <p className="text-xs text-slate-500">Zorluk ve adet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onPersonalTest}
            className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Oluştur
          </button>
        </section>
      )}

      <section aria-labelledby="qb-side-heading" className={sectionClass}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" aria-hidden />
            <h2 id="qb-side-heading" className="text-sm font-semibold text-slate-900">
              Son denemeler
            </h2>
          </div>
          <Link href="/ogrenci/deneme" className="text-[11px] font-semibold text-violet-600 hover:text-violet-800">
            Tümü
          </Link>
        </div>
        {loading ? (
          <div className="mt-3 space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className={cn("animate-pulse rounded-xl bg-slate-100", compact ? "h-12" : "h-14")} />
            ))}
          </div>
        ) : examHistory.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">Kayıt yok.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {examHistory.slice(0, historyLimit).map((ex) => {
              const progress = examProgressPct(ex);
              const answered = examAnswered(ex);
              const totalQ = ex.total_questions ?? answered;
              return (
                <li
                  key={ex.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 transition hover:border-violet-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="line-clamp-1 text-xs font-semibold text-slate-900">
                      {ex.title ?? ex.exam_type ?? "Deneme"}
                    </strong>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-violet-800">
                      {examScoreLabel(ex)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {answered}/{totalQ || "—"}
                    </span>
                    <span>%{progress}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && planStats && (planStats.tasks_total_today ?? 0) > 0 && (
          <div className={cn("mt-4 border-t border-slate-100 pt-4", compact && "mt-3 pt-3")}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Target className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bugün</span>
              </div>
              <Link href="/ogrenci/plan" className="text-[11px] font-semibold text-violet-600 hover:text-violet-800">
                Plan
              </Link>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums text-slate-900">{done}</span>
              <span className="text-xs font-medium text-slate-400">/ {total}</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {!loading && planStats && (planStats.tasks_total_today ?? 0) <= 0 && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">Bugün planda görev yok.</p>
        )}
      </section>
    </aside>
  );
}
