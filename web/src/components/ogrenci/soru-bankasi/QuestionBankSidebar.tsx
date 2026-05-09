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
    <ul className="flex justify-between gap-1">
      {days.map((d) => (
        <li key={d.lab} className="flex-1 text-center">
          <div
            className={cn(
              "rounded-xl border px-1 py-2 text-[10px] font-semibold uppercase tracking-wide sm:text-xs",
              d.isToday
                ? "border-violet-500/50 bg-violet-500/20 text-white shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                : "border-white/[0.06] bg-white/[0.03] text-slate-500"
            )}
          >
            <div>{d.lab}</div>
            <div className="mt-1 text-base font-bold tabular-nums text-slate-200">{d.date}</div>
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
    <aside aria-label="Yan bilgi" className="flex flex-col gap-6">
      {!hidePersonalTestCard && (
        <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-violet-950/60 to-slate-950/95 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/40">
              <ClipboardList className="h-5 w-5 text-violet-300" aria-hidden />
            </span>
            <div>
              <h2 className="font-bold text-white">Bana özel test</h2>
              <p className="text-xs text-slate-400">Zorluk ve adet senin elinde</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onPersonalTest}
            className="mt-5 w-full rounded-2xl bg-white py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-violet-100"
          >
            Test oluştur
          </button>
        </section>
      )}

      <section
        aria-labelledby="qb-history-heading"
        className="rounded-3xl border border-white/[0.07] bg-slate-950/80 p-6 shadow-xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" aria-hidden />
            <h2 id="qb-history-heading" className="font-bold text-white">
              Son denemeler
            </h2>
          </div>
          <Link
            href="/ogrenci/deneme"
            className="text-xs font-semibold text-violet-400 hover:text-violet-300"
          >
            Tümü
          </Link>
        </div>
        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : examHistory.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Henüz kayıtlı deneme yok.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {examHistory.slice(0, 5).map((ex) => {
              const progress = examProgressPct(ex);
              const answered = examAnswered(ex);
              const totalQ = ex.total_questions ?? answered;
              return (
                <li
                  key={ex.id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition hover:border-violet-500/25"
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="font-semibold text-slate-100">{ex.title ?? ex.exam_type ?? "Deneme"}</strong>
                    <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-bold tabular-nums text-violet-200">
                      {examScoreLabel(ex)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {answered}/{totalQ || "—"} soru
                    </span>
                    <span>%{progress}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
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

      <section
        aria-labelledby="qb-cal-heading"
        className="rounded-3xl border border-white/[0.07] bg-slate-950/80 p-6 shadow-xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden />
            <h2 id="qb-cal-heading" className="font-bold text-white">
              Çalışma haftası
            </h2>
          </div>
          <span className="flex gap-1 opacity-40">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="mt-5">
          <WeekStrip />
        </div>
      </section>

      <section
        aria-labelledby="qb-goal-heading"
        className="rounded-3xl border border-white/[0.07] bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="qb-goal-heading" className="font-bold text-white">
            Günlük hedef
          </h2>
          <Link href="/ogrenci/plan" className="text-xs font-semibold text-violet-400 hover:text-violet-300">
            Düzenle
          </Link>
        </div>
        {loading && !planStats ? (
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-white/5" />
        ) : planStats && (planStats.tasks_total_today ?? 0) <= 0 ? (
          <p className="mt-4 text-sm text-slate-500">Bugün için planda görev yok.</p>
        ) : (
          <>
            <p className="mt-3 text-3xl font-bold tabular-nums text-white">
              {done}{" "}
              <span className="text-lg font-semibold text-slate-500">
                / {total > 0 ? total : 1}
              </span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <Link
              href="/ogrenci/plan"
              className="mt-5 inline-flex text-sm font-semibold text-slate-400 hover:text-white"
            >
              Plana git →
            </Link>
          </>
        )}
      </section>
    </aside>
  );
}
