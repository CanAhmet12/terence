"use client";

import Link from "next/link";
import { ClipboardList, History, ListChecks } from "lucide-react";
import type { ExamSession, StudyPlan, WeakAchievement } from "@/lib/api";

export function QuestionBankSidebar({
  weakPreview,
  examHistory,
  todayPlan,
  loading,
}: {
  weakPreview: WeakAchievement[];
  examHistory: ExamSession[];
  todayPlan: StudyPlan | null;
  loading: boolean;
}) {
  const tasks = todayPlan?.tasks ?? [];
        const open = tasks.filter((t) => !(t.completed || t.is_completed)).length;

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-slate-800">
          <ListChecks className="h-4 w-4 text-teal-600" aria-hidden />
          <h2 className="text-sm font-bold">Bugünkü plan</h2>
        </div>
        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
        ) : todayPlan ? (
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              {todayPlan.plan_date ?? todayPlan.date ?? "Bugün"}
            </p>
            <p className="mt-1 text-xs">
              {open > 0 ? `${open} açık görev` : "Tüm görevler tamamlanmış görünüyor."}
            </p>
            <Link
              href="/ogrenci/plan"
              className="mt-3 inline-flex text-xs font-semibold text-teal-700 underline-offset-2 hover:underline"
            >
              Plana git
            </Link>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Plan yüklenemedi veya boş.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-slate-800">
          <History className="h-4 w-4 text-indigo-600" aria-hidden />
          <h2 className="text-sm font-bold">Son denemeler</h2>
        </div>
        {loading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : examHistory.length === 0 ? (
          <p className="text-xs text-slate-500">Henüz kayıtlı deneme yok.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {examHistory.slice(0, 4).map((ex) => (
              <li key={ex.id} className="flex justify-between gap-2 rounded-lg bg-slate-50 px-2 py-2">
                <span className="font-medium text-slate-800">{ex.exam_type ?? "Deneme"}</span>
                <span className="shrink-0 text-slate-600">
                  {ex.score != null ? `${ex.score} puan` : ex.status ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/ogrenci/deneme"
          className="mt-3 inline-flex text-xs font-semibold text-indigo-700 underline-offset-2 hover:underline"
        >
          Tüm geçmiş
        </Link>
      </div>

      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
        <div className="mb-2 flex items-center gap-2 text-amber-900">
          <ClipboardList className="h-4 w-4" aria-hidden />
          <h2 className="text-sm font-bold">Zayıf kazanımlar</h2>
        </div>
        {weakPreview.length === 0 ? (
          <p className="text-xs text-amber-900/80">Henüz yeterli veri yok; çözmeye devam.</p>
        ) : (
          <ul className="space-y-2 text-xs text-amber-950">
            {weakPreview.slice(0, 4).map((w) => (
              <li key={w.kod}>
                <Link
                  href={`/ogrenci/soru-bankasi?kazanim_code=${encodeURIComponent(w.kod)}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {w.konu ?? w.kod}
                </Link>
                <span className="text-amber-800/90"> · %{w.accuracy_rate}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
