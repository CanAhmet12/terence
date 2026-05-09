"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  planApi,
  questionApi,
  DailyPlan,
  PlanTask,
  PlanTemplatePack,
  WeakAchievement,
} from "@/lib/api";
import { PlanProgressCard } from "./PlanProgressCard";
import { PlanTaskList, type TaskSourceFilter } from "./PlanTaskList";
import { PlanWeakSuggestions } from "./PlanWeakSuggestions";
import { PlanAddTaskDrawer } from "./PlanAddTaskDrawer";
import { PlanTemplatePicker } from "./PlanTemplatePicker";
import { PlanWeekSection } from "./PlanWeekSection";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

type StudyOpen = { taskId: number; sessionId: number; startedAt: number };

function errMessage(e: unknown, fallback: string) {
  if (e && typeof e === "object" && "response" in e) {
    const r = e as {
      response?: { data?: { message?: string; error?: string } };
    };
    const m = r.response?.data?.message ?? r.response?.data?.error;
    if (typeof m === "string") return m;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export default function GunlukPlanPageContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"today" | "week">("today");
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [weeklyPlans, setWeeklyPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSubmitting, setDrawerSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [weakAchievements, setWeakAchievements] = useState<WeakAchievement[]>(
    [],
  );
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [addingWeakId, setAddingWeakId] = useState<number | null>(null);
  const [addedWeakIds, setAddedWeakIds] = useState<Set<number>>(new Set());
  const [weakError, setWeakError] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskSourceFilter>("all");
  const [templates, setTemplates] = useState<PlanTemplatePack[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateApplying, setTemplateApplying] = useState(false);
  const [studyOpen, setStudyOpen] = useState<StudyOpen | null>(null);
  const [studyActionId, setStudyActionId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const today = new Date();
  const todayStr = today.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    if (!studyOpen) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [studyOpen]);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError("");
    setTemplatesLoading(true);
    try {
      const [p, tpl] = await Promise.all([
        planApi.getTodayPlan(),
        planApi.getPlanTemplates().catch(() => [] as PlanTemplatePack[]),
      ]);
      setPlan(p as DailyPlan);
      setTemplates(Array.isArray(tpl) ? tpl : []);

      try {
        const wa = await questionApi.getWeakAchievements();
        const arr = Array.isArray(wa) ? wa : [];
        setWeakAchievements((arr as WeakAchievement[]).slice(0, 5));
        setWeakError(null);
      } catch (we) {
        setWeakAchievements([]);
        setWeakError(errMessage(we, "Zayıf kazanımlar yüklenemedi."));
      }
    } catch (e) {
      setError(errMessage(e, "Plan yüklenemedi."));
    } finally {
      setLoading(false);
      setTemplatesLoading(false);
    }
  }, []);

  const loadWeekly = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const plans = await planApi.getWeeklyPlans();
      setWeeklyPlans(Array.isArray(plans) ? (plans as DailyPlan[]) : []);
    } catch (e) {
      setError(errMessage(e, "Haftalık plan yüklenemedi."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "today") void loadPlan();
    else void loadWeekly();
  }, [tab, loadPlan, loadWeekly]);

  const handleComplete = async (task: PlanTask) => {
    if (task.is_completed) return;
    setCompletingId(task.id);
    setPlan((p) =>
      p
        ? {
            ...p,
            completed_tasks: (p.completed_tasks ?? 0) + 1,
            tasks: p.tasks?.map((t) =>
              t.id === task.id ? { ...t, is_completed: true } : t,
            ),
          }
        : p,
    );
    try {
      await planApi.completeTask(task.id);
    } catch (e) {
      setError(errMessage(e, "Görev tamamlanamadı."));
      setPlan((p) =>
        p
          ? {
              ...p,
              completed_tasks: Math.max((p.completed_tasks ?? 1) - 1, 0),
              tasks: p.tasks?.map((t) =>
                t.id === task.id ? { ...t, is_completed: false } : t,
              ),
            }
          : p,
      );
    }
    setCompletingId(null);
  };

  const handleDelete = async (task: PlanTask) => {
    const prev = plan;
    setDeletingId(task.id);
    setPlan((p) =>
      p
        ? {
            ...p,
            total_tasks: Math.max((p.total_tasks ?? 1) - 1, 0),
            completed_tasks: task.is_completed
              ? Math.max((p.completed_tasks ?? 1) - 1, 0)
              : (p.completed_tasks ?? 0),
            tasks: p.tasks?.filter((t) => t.id !== task.id),
          }
        : p,
    );
    try {
      await planApi.deleteTask(task.id);
    } catch (e) {
      setError(errMessage(e, "Görev silinemedi."));
      setPlan(prev);
    }
    setDeletingId(null);
  };

  const handleDrawerSubmit = async (payload: {
    title: string;
    type: string;
    subject?: string;
    planned_minutes?: number;
  }) => {
    setDrawerSubmitting(true);
    const tmpId = Date.now();
    const tmpTask: PlanTask = {
      id: tmpId,
      title: payload.title,
      type: payload.type,
      subject: payload.subject,
      planned_minutes: payload.planned_minutes,
      is_completed: false,
      source: "student",
    };
    setPlan((p) =>
      p
        ? {
            ...p,
            total_tasks: (p.total_tasks ?? 0) + 1,
            tasks: [...(p.tasks ?? []), tmpTask],
          }
        : p,
    );
    try {
      const res = await planApi.addPlanTask({
        title: payload.title,
        type: payload.type,
        subject: payload.subject,
        planned_minutes: payload.planned_minutes,
      });
      const newTaskObj = res;
      setPlan((p) =>
        p
          ? {
              ...p,
              tasks: p.tasks?.map((t) =>
                t.id === tmpId ? newTaskObj : t,
              ),
            }
          : p,
      );
      setDrawerOpen(false);
    } catch (e) {
      setError(errMessage(e, "Görev eklenemedi."));
      setPlan((p) =>
        p
          ? {
              ...p,
              total_tasks: Math.max((p.total_tasks ?? 1) - 1, 0),
              tasks: p.tasks?.filter((t) => t.id !== tmpId),
            }
          : p,
      );
    }
    setDrawerSubmitting(false);
  };

  const handleAddWeak = async (wa: WeakAchievement) => {
    setAddingWeakId(wa.id);
    try {
      const res = await planApi.addPlanTask({
        title: `${wa.konu} — Tekrar Çalış`,
        type: "question",
        subject: wa.subject,
      });
      const newTaskObj = res;
      setPlan((p) =>
        p
          ? {
              ...p,
              total_tasks: (p.total_tasks ?? 0) + 1,
              tasks: [...(p.tasks ?? []), newTaskObj],
            }
          : p,
      );
      setAddedWeakIds((prev) => new Set([...prev, wa.id]));
    } catch (e) {
      setError(errMessage(e, "Öneri plana eklenemedi."));
    }
    setAddingWeakId(null);
  };

  const handleApplyTemplatePack = async (pack: PlanTemplatePack) => {
    setTemplateApplying(true);
    setError("");
    try {
      for (const t of pack.tasks) {
        await planApi.addPlanTask({
          title: t.title,
          type: t.type ?? "custom",
          subject: t.subject,
          planned_minutes: t.planned_minutes ?? 30,
          priority: t.priority,
        });
      }
      await loadPlan();
    } catch (e) {
      setError(errMessage(e, "Şablondan görevler eklenemedi."));
    }
    setTemplateApplying(false);
  };

  const handleStartStudy = async (task: PlanTask) => {
    if (studyOpen) return;
    setStudyActionId(task.id);
    try {
      const { session_id } = await planApi.startStudySession({
        plan_task_id: task.id,
        subject: task.subject,
      });
      setStudyOpen({
        taskId: task.id,
        sessionId: session_id,
        startedAt: Date.now(),
      });
    } catch (e) {
      setError(errMessage(e, "Çalışma seansı başlatılamadı."));
    }
    setStudyActionId(null);
  };

  const handleEndStudy = async () => {
    if (!studyOpen) return;
    setStudyActionId(studyOpen.taskId);
    try {
      await planApi.endStudySession(studyOpen.sessionId);
      setStudyOpen(null);
    } catch (e) {
      setError(errMessage(e, "Seans sonlandırılamadı."));
    }
    setStudyActionId(null);
  };

  const elapsedSec = useMemo(() => {
    if (!studyOpen) return 0;
    return Math.max(0, Math.floor((Date.now() - studyOpen.startedAt) / 1000));
  }, [studyOpen, tick]);
  const em = Math.floor(elapsedSec / 60);
  const es = elapsedSec % 60;

  const tasks = plan?.tasks ?? [];
  const doneCount = plan?.completed_tasks ?? 0;
  const totalCount = plan?.total_tasks ?? 0;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-full min-w-0 overflow-x-hidden bg-slate-50">
      <div className="w-full space-y-6 px-3 py-6 sm:space-y-6 sm:px-4 sm:py-8 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Günlük Plan
            </h1>
            <p className="mt-1 font-medium capitalize text-slate-500">
              {todayStr}
            </p>
            {user?.name && (
              <p className="mt-0.5 text-xs text-slate-400">{user.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => (tab === "today" ? void loadPlan() : void loadWeekly())}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-600"
            title="Yenile"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex w-fit gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
          {(
            [
              { key: "today" as const, label: "Bugün", icon: Calendar },
              { key: "week" as const, label: "Bu Hafta", icon: CalendarDays },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {studyOpen && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <span className="font-semibold">Aktif çalışma seansı</span>
            <span className="font-mono text-lg font-black">
              {String(em).padStart(2, "0")}:{String(es).padStart(2, "0")}
            </span>
          </div>
        )}

        {tab === "today" && (
          <div className="space-y-5">
            <PlanProgressCard
              loading={loading}
              progress={progress}
              doneCount={doneCount}
              totalCount={totalCount}
              onAddClick={() => setDrawerOpen(true)}
            />

            <PlanTemplatePicker
              templates={templates}
              loading={templatesLoading}
              applying={templateApplying}
              onApplyPack={handleApplyTemplatePack}
            />

            <PlanTaskList
              loading={loading}
              tasks={tasks}
              taskFilter={taskFilter}
              onFilterChange={setTaskFilter}
              onOpenAddForm={() => setDrawerOpen(true)}
              completingId={completingId}
              deletingId={deletingId}
              studyOpen={studyOpen}
              studyActionId={studyActionId}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onStartStudy={handleStartStudy}
              onEndStudy={handleEndStudy}
            />

            <PlanWeakSuggestions
              weakAchievements={weakAchievements}
              expanded={showAiSuggestions}
              onToggle={() => setShowAiSuggestions((v) => !v)}
              addedWeakIds={addedWeakIds}
              addingWeakId={addingWeakId}
              weakError={weakError}
              onAddWeak={handleAddWeak}
            />
          </div>
        )}

        {tab === "week" && (
          <PlanWeekSection
            loading={loading}
            weeklyPlans={weeklyPlans}
            today={today}
          />
        )}
      </div>

      <PlanAddTaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
        submitting={drawerSubmitting}
      />
    </div>
  );
}
