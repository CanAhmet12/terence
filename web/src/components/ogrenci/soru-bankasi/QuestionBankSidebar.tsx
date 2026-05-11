"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, History } from "lucide-react";
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

function WeekStrip() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const days = labels.map((lab, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { lab, date: d.getDate(), isToday: d.toDateString() === now.toDateString() };
  });

  return (
    <ul className="flex justify-between gap-0.5">
      {days.map((d) => (
        <li key={d.lab} className="min-w-0 flex-1 text-center">
          <div
            className={cn(
              "rounded-lg border px-0.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide sm:rounded-xl sm:px-1 sm:py-2 sm:text-[10px]",
              d.isToday
                ? "border-violet-300 bg-violet-100 text-violet-900 shadow-sm"
                : "border-slate-200 bg-white text-slate-500"
            )}
          >
            <div>{d.lab}</div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-slate-800 sm:text-base">{d.date}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function QuestionBankSidebar({
  examHistory,
  planStats,
  loading,
  onPersonalTest,
  hidePersonalTestCard = false,
}: {
  examHistory: ExamSession[];
  planStats: PlanStats | null;
  loading: boolean;
  onPersonalTest: () => void;
  hidePersonalTestCard?: boolean;
}) {
  const done = planStats?.tasks_done_today ?? 0;
  const total = planStats?.tasks_total_today ?? 0;
  const pct =
    total > 0 ? Math.min(100, Math.round((done / Math.max(total, 1)) * 100)) : done > 0 ? 100 : 0;

  return (
    <aside aria-label="Yan bilgi" className="flex flex-col gap-4">
      {!hidePersonalTestCard && (
        <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-white shadow-sm">
              <ClipboardList className="h-5 w-5 text-violet-600" aria-hidden />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">Bana özel test</h2>
              <p className="text-xs text-slate-600">Zorluk ve adet senin elinde</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onPersonalTest}
            className="mt-4 w-full rounded-2xl bg-violet-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
          >
            Test oluştur
          </button>
        </section>
      )}

      <section
        aria-labelledby="qb-history-heading"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" aria-hidden />
            <h2 id="qb-history-heading" className="font-bold text-slate-900">
              Son denemeler
            </h2>
          </div>
          <Link href="/ogrenci/deneme" className="text-xs font-semibold text-violet-700 hover:text-violet-900">
            Tümü
          </Link>
        </div>
        {loading ? (
          <div className="mt-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : examHistory.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Henüz kayıtlı deneme yok.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {examHistory.slice(0, 5).map((ex) => {
              const progress = examProgressPct(ex);
              const answered = examAnswered(ex);
              const totalQ = ex.total_questions ?? answered;
              return (
                <li
                  key={ex.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 transition hover:border-violet-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="font-semibold text-slate-900">{ex.title ?? ex.exam_type ?? "Deneme"}</strong>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold tabular-nums text-violet-800">
                      {examScoreLabel(ex)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {answered}/{totalQ || "—"} soru
                    </span>
                    <span>%{progress}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
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
      </section>

      <section aria-labelledby="qb-cal-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />
            <h2 id="qb-cal-heading" className="font-bold text-slate-900">
              Çalışma haftası
            </h2>
          </div>
          <span className="flex gap-1 text-slate-300">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="mt-4">
          <WeekStrip />
        </div>
      </section>

      <section
        aria-labelledby="qb-goal-heading"
        className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="qb-goal-heading" className="font-bold text-slate-900">
            Günlük hedef
          </h2>
          <Link href="/ogrenci/plan" className="text-xs font-semibold text-violet-700 hover:text-violet-900">
            Düzenle
          </Link>
        </div>
        {loading && !planStats ? (
          <div className="mt-3 h-16 animate-pulse rounded-xl bg-slate-100" />
        ) : planStats && (planStats.tasks_total_today ?? 0) <= 0 ? (
          <p className="mt-3 text-sm text-slate-500">Bugün için planda görev yok.</p>
        ) : (
          <>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {done}{" "}
              <span className="text-lg font-semibold text-slate-400">/ {total > 0 ? total : 1}</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-600 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <Link
              href="/ogrenci/plan"
              className="mt-4 inline-flex text-sm font-semibold text-slate-600 hover:text-violet-700"
            >
              Plana git →
            </Link>
          </>
        )}
      </section>
    </aside>
  );
}
