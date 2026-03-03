"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, DailyPlan, PlanTask } from "@/lib/api";
import {
  Check, Plus, Loader2, BookOpen, Video as VideoIcon,
  FileText, Dumbbell, RefreshCw, Clock, Target, Trash2, X
} from "lucide-react";

function Skeleton({ cls }: { cls?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${cls ?? ""}`} />;
}

const TASK_ICONS: Record<string, React.ElementType> = {
  question: Dumbbell, video: VideoIcon, exam: FileText,
  read: BookOpen, repeat: RefreshCw, custom: BookOpen,
};

const TASK_COLORS: Record<string, string> = {
  question: "bg-blue-50 text-blue-600",
  video: "bg-purple-50 text-purple-600",
  exam: "bg-amber-50 text-amber-600",
  read: "bg-teal-50 text-teal-600",
  custom: "bg-slate-100 text-slate-600",
};

export default function GunlukPlanPage() {
  const { token } = useAuth();
    const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadPlan = useCallback(async () => {
    try {
      const p = await api.getTodayPlan(token!);
      setPlan(p);
    } catch {
      setPlan({ id: 0, plan_date: new Date().toISOString(), status: "active", total_tasks: 0, completed_tasks: 0, tasks: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const handleComplete = async (task: PlanTask) => {
    if (task.is_completed) return;
    setCompletingId(task.id);
    // Optimistik
    setPlan((p) => p ? { ...p, completed_tasks: p.completed_tasks + 1, tasks: p.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: true } : t) } : p);
    if (token) {
      try {
        await api.completeTask(token, task.id);
      } catch {
        setPlan((p) => p ? { ...p, completed_tasks: p.completed_tasks - 1, tasks: p.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: false } : t) } : p);
      }
    }
    setCompletingId(null);
  };

  const handleDelete = async (task: PlanTask) => {
    setDeletingId(task.id);
    setPlan((p) => p ? {
      ...p,
      total_tasks: p.total_tasks - 1,
      completed_tasks: task.is_completed ? p.completed_tasks - 1 : p.completed_tasks,
      tasks: p.tasks?.filter((t) => t.id !== task.id),
    } : p);
    if (token) {
      try { await api.deleteTask(token, task.id); } catch {}
    }
    setDeletingId(null);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    const tmpId = Date.now();
    const tmpTask: PlanTask = { id: tmpId, title: newTask.trim(), type: "custom", is_completed: false };
    setPlan((p) => p ? { ...p, total_tasks: p.total_tasks + 1, tasks: [...(p.tasks ?? []), tmpTask] } : p);

    if (token) {
      try {
        const res = await api.addPlanTask(token, { title: newTask.trim(), type: "custom" });
        setPlan((p) => p ? { ...p, tasks: p.tasks?.map((t) => t.id === tmpId ? res.task : t) } : p);
      } catch {
        setPlan((p) => p ? { ...p, total_tasks: p.total_tasks - 1, tasks: p.tasks?.filter((t) => t.id !== tmpId) } : p);
      }
    }
    setNewTask("");
    setShowAddForm(false);
    setAdding(false);
  };

  const tasks = plan?.tasks ?? [];
  const doneCount = plan?.completed_tasks ?? 0;
  const totalCount = plan?.total_tasks ?? 0;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Günlük Plan</h1>
          <p className="text-slate-500 mt-0.5 capitalize">{today}</p>
        </div>
        <button
          onClick={loadPlan}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Yenile"
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* İlerleme */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{doneCount}/{totalCount} tamamlandı</p>
              <p className="text-xs text-slate-500">{Math.round(progress)}% ilerleme</p>
            </div>
          </div>
          {plan?.study_minutes_actual !== undefined && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>{plan.study_minutes_actual}dk çalışma</span>
            </div>
          )}
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Görevler */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} cls="h-14" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 text-center">
            <Check className="w-10 h-10 text-teal-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Plan boş</p>
            <p className="text-sm text-slate-500 mt-1">Aşağıdan yeni görev ekle.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const Icon = TASK_ICONS[task.type] ?? BookOpen;
              const colorCls = TASK_COLORS[task.type] ?? TASK_COLORS.custom;
              return (
                <li key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${task.is_completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                      {task.title}
                    </span>
                    {task.subject && <span className="ml-2 text-xs text-slate-400">{task.subject}</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!task.is_completed && (
                      <button
                        onClick={() => handleComplete(task)}
                        disabled={completingId === task.id}
                        className="w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-600 flex items-center justify-center transition-colors"
                        title="Tamamla"
                      >
                        {completingId === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                    )}
                    {task.is_completed && (
                      <span className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(task)}
                      disabled={deletingId === task.id}
                      className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Görev Ekle */}
      {showAddForm ? (
        <div className="bg-white rounded-2xl border border-teal-200 p-4 shadow-sm flex gap-3">
          <input
            autoFocus
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="Görev başlığı..."
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          />
          <button
            onClick={handleAddTask}
            disabled={adding || !newTask.trim()}
            className="px-4 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ekle
          </button>
          <button
            onClick={() => { setShowAddForm(false); setNewTask(""); }}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/30 text-slate-500 hover:text-teal-600 font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Görev Ekle
        </button>
      )}
    </div>
  );
}


