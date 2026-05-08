"use client";

import Link from "next/link";
import { CalendarDays, Target } from "lucide-react";
import type { ExamSession } from "@/lib/api";
import type { PlanStats } from "@/lib/api";

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
    <div className="flex justify-between gap-1">
      {days.map((d) => (
        <div
          key={d.lab}
          className={`flex flex-1 flex-col items-center rounded-xl py-2 text-xs font-semibold ${
            d.isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-slate-50 text-slate-600"
          }`}
        >
          <span className="text-[10px] opacity-90">{d.lab}</span>
          <span className="mt-1 text-sm tabular-nums">{d.date}</span>
        </div>
      ))}
    </div>
  );
}

function DailyGoalRing({ done, total }: { done: number; total: number }) {
  if (total <= 0) {
    return (
      <p className="text-center text-sm leading-relaxed text-slate-600">
        Bugün için planında görev görünmüyor. Günlük planına görev ekleyerek takip edebilirsin.
      </p>
    );
  }
  const t = Math.max(total, 1);
  const pct = Math.min(100, Math.round((done / t) * 100));
  const left = Math.max(0, t - done);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative h-28 w-28 rounded-full p-1 sm:h-32 sm:w-32"
        style={{
          background: `conic-gradient(#6366f1 ${pct * 3.6}deg, #e2e8f0 0deg)`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-bold tabular-nums text-indigo-600 sm:text-3xl">{pct}%</span>
          <span className="mt-1 text-xs font-medium text-slate-500">
            {done} / {t} görev
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-slate-600">
        {left > 0 ? `${left} görev kaldı` : "Bugünkü görevler tamam görünüyor"}
      </p>
      <p className="text-center text-[10px] text-slate-400">Günlük plan görevlerinden hesaplanır</p>
    </div>
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
  /** Üst hero’da mor CTA varsa sağ kolonda tekrar gösterme */
  hidePersonalTestCard?: boolean;
}) {
  const done = planStats?.tasks_done_today ?? 0;
  const total = planStats?.tasks_total_today ?? 0;

  return (
    <aside className="qb-sidebar-rail space-y-4 lg:sticky lg:top-24">
      {!hidePersonalTestCard && (
        <div className="rounded-[var(--qb-card-radius)] border border-indigo-200/80 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-4 text-white shadow-lg shadow-indigo-500/25">
          <div className="flex items-start gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Target className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-bold">Bana Özel Test</h2>
              <p className="mt-1 text-xs text-white/85">Konu ve zorluk seç, anında test oluştur.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onPersonalTest}
            className="mt-3 w-full rounded-lg bg-white py-2.5 text-xs font-bold text-indigo-700 shadow-md transition-colors hover:bg-indigo-50 sm:text-sm"
          >
            Test Oluştur
          </button>
        </div>
      )}

      <div className="rounded-[var(--qb-card-radius)] border border-slate-200/90 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Son Çözdüğün Testler</h2>
        {loading ? (
          <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ) : examHistory.length === 0 ? (
          <p className="text-xs text-slate-500">Henüz kayıtlı deneme yok.</p>
        ) : (
          <ul className="space-y-3">
            {examHistory.slice(0, 5).map((ex) => {
              const pct = examProgressPct(ex);
              const answered = examAnswered(ex);
              const totalQ = ex.total_questions ?? answered;
              return (
                <li key={ex.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{ex.title ?? ex.exam_type ?? "Deneme"}</p>
                    <span className="shrink-0 text-xs font-bold text-indigo-600">{examScoreLabel(ex)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {answered}/{totalQ || "—"} soru
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/ogrenci/deneme" className="mt-3 inline-flex text-xs font-bold text-indigo-700 hover:underline">
          Tüm denemeler →
        </Link>
      </div>

      <div className="rounded-[var(--qb-card-radius)] border border-slate-200/90 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-slate-800">
          <CalendarDays className="h-4 w-4 text-indigo-600" aria-hidden />
          <h2 className="text-sm font-bold">Çalışma Takvimi</h2>
        </div>
        <WeekStrip />
      </div>

      <div className="rounded-[var(--qb-card-radius)] border border-slate-200/90 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-center text-sm font-bold text-slate-900">Günlük Hedef</h2>
        {loading && !planStats ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ) : planStats && (planStats.tasks_total_today ?? 0) <= 0 ? (
          <DailyGoalRing done={0} total={0} />
        ) : (
          <DailyGoalRing done={done} total={total > 0 ? total : 1} />
        )}
        <Link href="/ogrenci/plan" className="mt-4 block text-center text-xs font-bold text-indigo-600 hover:underline">
          Plana git →
        </Link>
      </div>
    </aside>
  );
}
