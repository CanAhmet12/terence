"use client";

import type { PlanTask } from "@/lib/plan-types";
import { taskMinutes, isTeacherAssignedTask } from "@/lib/plan-types";
import { getTaskConfig, getTimeGroup, TIME_GROUP_CONFIG } from "./plan-styles";
import { Check, Clock, Loader2, Play, Square, Trash2 } from "lucide-react";

type StudyOpen = { taskId: number; sessionId: number; startedAt: number };

export function PlanTaskRow({
  task,
  idx,
  pendingTotal,
  completingId,
  deletingId,
  studyOpen,
  studyActionId,
  onComplete,
  onDelete,
  onStartStudy,
  onEndStudy,
  canDelete,
}: {
  task: PlanTask;
  idx: number;
  pendingTotal: number;
  completingId: number | null;
  deletingId: number | null;
  studyOpen: StudyOpen | null;
  studyActionId: number | null;
  onComplete: (t: PlanTask) => void;
  onDelete: (t: PlanTask) => void;
  onStartStudy: (t: PlanTask) => void;
  onEndStudy: () => void;
  canDelete: boolean;
}) {
  const tc = getTaskConfig(task);
  const Icon = tc.icon;
  const timeGroup = getTimeGroup(idx, pendingTotal);
  const tg = TIME_GROUP_CONFIG[timeGroup];
  const minutes = taskMinutes(task);
  const teacher = isTeacherAssignedTask(task);
  const sessionHere = studyOpen?.taskId === task.id;

  return (
    <div
      className={`flex items-center gap-3.5 p-4 rounded-xl border-l-[3px] ${tc.border} ${tc.bg} group transition-all hover:shadow-sm`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tc.iconBg}`}
      >
        <Icon className={`h-4 w-4 ${tc.text}`} strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-800">
            {task.title}
          </p>
          {teacher && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              Öğretmen
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {task.subject && (
            <span className={`text-[11px] font-medium ${tc.text}`}>
              {task.subject}
            </span>
          )}
          {minutes != null && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Clock className="h-3 w-3" />
              {minutes}dk
            </span>
          )}
          <span
            className={`hidden text-[11px] font-medium sm:inline ${tg.bg} ${tg.color} rounded-md px-1.5 py-0.5`}
          >
            {tg.label}
          </span>
        </div>

        {sessionHere && studyOpen && (
          <p className="mt-1 text-[11px] font-medium text-indigo-600">
            Çalışma seansı açık — bitirdiğinde süre günlüğe işlenir.
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        {!task.is_completed && (
          <div className="flex items-center gap-1.5">
            {sessionHere ? (
              <button
                type="button"
                onClick={() => onEndStudy()}
                disabled={studyActionId != null}
                className="flex h-8 items-center gap-1 rounded-xl border border-rose-200 bg-white/90 px-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                title="Seansı bitir"
              >
                {studyActionId === task.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Square className="h-3 w-3 fill-current" />
                )}
                Bitir
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartStudy(task)}
                disabled={studyOpen != null || studyActionId != null}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white/80 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40"
                title={
                  studyOpen != null
                    ? "Önce açık seansı bitirin"
                    : "Çalışmaya başla"
                }
              >
                {studyActionId === task.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-indigo-500" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => onComplete(task)}
              disabled={completingId === task.id}
              className="group/btn flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white/80 transition-all hover:border-emerald-300 hover:bg-emerald-50"
              title="Tamamla"
            >
              {completingId === task.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              ) : (
                <Check className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover/btn:text-emerald-500" />
              )}
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                disabled={deletingId === task.id}
                className="group/btn flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white/80 opacity-0 transition-all hover:border-red-200 hover:bg-red-50 group-hover:opacity-100"
                title="Sil"
              >
                {deletingId === task.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover/btn:text-red-500" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
