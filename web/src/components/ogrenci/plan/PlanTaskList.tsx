"use client";

import type { PlanTask } from "@/lib/plan-types";
import { canStudentDeleteTask } from "@/lib/plan-types";
import { PlanTaskRow } from "./PlanTaskRow";
import { Check, Plus, Calendar } from "lucide-react";

type StudyOpen = { taskId: number; sessionId: number; startedAt: number };

export type TaskSourceFilter = "all" | "teacher" | "student";

export function PlanTaskList({
  loading,
  tasks,
  taskFilter,
  onFilterChange,
  onOpenAddForm,
  completingId,
  deletingId,
  studyOpen,
  studyActionId,
  onComplete,
  onDelete,
  onStartStudy,
  onEndStudy,
}: {
  loading: boolean;
  tasks: PlanTask[];
  taskFilter: TaskSourceFilter;
  onFilterChange: (f: TaskSourceFilter) => void;
  onOpenAddForm: () => void;
  completingId: number | null;
  deletingId: number | null;
  studyOpen: StudyOpen | null;
  studyActionId: number | null;
  onComplete: (t: PlanTask) => void;
  onDelete: (t: PlanTask) => void;
  onStartStudy: (t: PlanTask) => void;
  onEndStudy: () => void;
}) {
  const filtered = tasks.filter((t) => {
    if (taskFilter === "teacher") return t.source === "teacher";
    if (taskFilter === "student")
      return t.source !== "teacher" && t.source !== "system";
    return true;
  });

  const pendingTasks = filtered.filter((t) => !t.is_completed);
  const doneTasks = filtered.filter((t) => t.is_completed);

  const chips: { key: TaskSourceFilter; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "teacher", label: "Öğretmen" },
    { key: "student", label: "Benim" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {!loading && tasks.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3">
          {chips.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                taskFilter === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3.5">
              <div className="h-6 w-6 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-5 flex-1 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-12 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Calendar className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700">Plan boş</h3>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500">
            Bugün ne çalışacaksın? Görev ekleyerek veya şablondan doldurarak
            başla.
          </p>
          <button
            type="button"
            onClick={() => onOpenAddForm()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            İlk Görevi Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-2 p-4">
          {pendingTasks.length === 0 && doneTasks.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              Bu filtrede görev yok.
            </p>
          )}
          {pendingTasks.map((task, idx) => (
            <PlanTaskRow
              key={task.id}
              task={task}
              idx={idx}
              pendingTotal={pendingTasks.length}
              completingId={completingId}
              deletingId={deletingId}
              studyOpen={studyOpen}
              studyActionId={studyActionId}
              onComplete={onComplete}
              onDelete={onDelete}
              onStartStudy={onStartStudy}
              onEndStudy={onEndStudy}
              canDelete={canStudentDeleteTask(task)}
            />
          ))}

          {doneTasks.length > 0 && (
            <div className="pb-1 pt-3">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tamamlananlar ({doneTasks.length})
              </p>
              {doneTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3.5 rounded-xl p-3.5 opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <Check className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <p className="flex-1 truncate text-sm font-medium text-slate-500 line-through">
                    {task.title}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenAddForm()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3.5 text-sm font-semibold text-slate-400 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600"
          >
            <Plus className="h-4 w-4" />
            Görev Ekle
          </button>
        </div>
      )}
    </div>
  );
}
