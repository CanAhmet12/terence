"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Target } from "lucide-react";
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
    <div className="flex justify-between gap-1.5">
      {days.map((d) => (
        <div
          key={d.lab}
          className={`flex flex-1 flex-col items-center rounded-xl py-2.5 text-xs font-semibold ${
            d.isToday
              ? "bg-[#6d28d9] text-white shadow-md shadow-violet-500/25"
              : "bg-slate-50 text-slate-600"
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
      <p className="text-center text-[13px] leading-relaxed text-slate-600">
        Bugün için planında görev görünmüyor. Günlük planına görev ekleyerek takip edebilirsin.
      </p>
    );
  }
  const t = Math.max(total, 1);
  const pct = Math.min(100, Math.round((done / t) * 100));
  const left = Math.max(0, t - done);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div
        className="relative mx-auto h-[120px] w-[120px] shrink-0 rounded-full p-1 sm:mx-0"
        style={{
          background: `conic-gradient(#6d28d9 ${pct * 3.6}deg, #e2e8f0 0deg)`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
          <span className="text-3xl font-bold tabular-nums text-violet-700">{pct}%</span>
          <span className="mt-0.5 text-[11px] font-medium text-slate-500">
            {done} / {t} görev
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-[13px] font-medium text-slate-700">
          Bugünkü hedefin{" "}
          <span className="font-bold text-slate-900">
            {done} / {t} görev
          </span>
        </p>
        <p className="mt-2 text-[12px] text-slate-500">
          {left > 0 ? `${left} görev kaldı` : "Bugünkü hedef tamam görünüyor"}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
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
  hidePersonalTestCard?: boolean;
}) {
  const done = planStats?.tasks_done_today ?? 0;
  const total = planStats?.tasks_total_today ?? 0;

  return (
    <aside className="qb-sidebar-rail flex flex-col gap-6 lg:sticky lg:top-24">
      {!hidePersonalTestCard && (
        <div className="rounded-[18px] border border-indigo-200/80 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-[var(--qb-card-pad)] text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Target className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-[15px] font-bold">Bana Özel Test</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-white/90">
                Kendi seviyene uygun özel test oluştur ve hemen çözmeye başla!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onPersonalTest}
            className="mt-5 w-full rounded-xl bg-white py-3 text-[13px] font-bold text-indigo-700 shadow-md transition-colors hover:bg-indigo-50"
          >
            Test Oluştur
          </button>
        </div>
      )}

      <div className="rounded-[18px] border border-slate-200/90 bg-white p-[var(--qb-card-pad)] shadow-[var(--qb-card-shadow)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-slate-900">Son Çözdüğün Testler</h2>
          <Link href="/ogrenci/deneme" className="text-[12px] font-bold text-indigo-600 hover:underline">
            Tümü
          </Link>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        ) : examHistory.length === 0 ? (
          <p className="text-[13px] text-slate-500">Henüz kayıtlı deneme yok.</p>
        ) : (
          <ul className="space-y-4">
            {examHistory.slice(0, 5).map((ex) => {
              const pct = examProgressPct(ex);
              const answered = examAnswered(ex);
              const totalQ = ex.total_questions ?? answered;
              return (
                <li key={ex.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-slate-900">
                      {ex.title ?? ex.exam_type ?? "Deneme"}
                    </p>
                    <span className="shrink-0 text-[12px] font-bold tabular-nums text-indigo-600">
                      {examScoreLabel(ex)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {answered}/{totalQ || "—"} soru
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
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
      </div>

      <div className="rounded-[18px] border border-slate-200/90 bg-white p-[var(--qb-card-pad)] shadow-[var(--qb-card-shadow)]">
        <div className="mb-4 flex items-center justify-between text-slate-800">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-600" aria-hidden />
            <h2 className="text-[15px] font-bold">Çalışma Takvimi</h2>
          </div>
          <div className="flex items-center gap-0.5 text-slate-400">
            <span className="sr-only">Hafta</span>
            <button type="button" className="rounded-lg p-1 hover:bg-slate-50" aria-label="Önceki hafta">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg p-1 hover:bg-slate-50" aria-label="Sonraki hafta">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <WeekStrip />
      </div>

      <div className="rounded-[18px] border border-slate-200/90 bg-white p-[var(--qb-card-pad)] shadow-[var(--qb-card-shadow)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">Günlük Hedef</h2>
          <Link href="/ogrenci/plan" className="text-[12px] font-bold text-indigo-600 hover:underline">
            Düzenle
          </Link>
        </div>
        {loading && !planStats ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ) : planStats && (planStats.tasks_total_today ?? 0) <= 0 ? (
          <DailyGoalRing done={0} total={0} />
        ) : (
          <DailyGoalRing done={done} total={total > 0 ? total : 1} />
        )}
        <Link
          href="/ogrenci/plan"
          className="mt-5 block text-center text-[12px] font-bold text-indigo-600 hover:underline"
        >
          Plana git →
        </Link>
      </div>
    </aside>
  );
}
