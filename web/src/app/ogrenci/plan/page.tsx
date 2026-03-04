"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, DailyPlan, PlanTask, WeakAchievement } from "@/lib/api";
import {
  Check, Plus, Loader2, BookOpen, Video as VideoIcon,
  FileText, Dumbbell, RefreshCw, Clock, Target, Trash2, X, Sparkles, CalendarDays, Calendar,
  AlertTriangle, ChevronDown, ChevronUp
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

function getWeekBounds(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(mon), to: fmt(sun) };
}

export default function GunlukPlanPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"today" | "week">("today");
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [weeklyPlans, setWeeklyPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [weakAchievements, setWeakAchievements] = useState<WeakAchievement[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [addingWeakId, setAddingWeakId] = useState<number | null>(null);
  const [addedWeakIds, setAddedWeakIds] = useState<Set<number>>(new Set());

  const loadPlan = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const p = await api.getTodayPlan(token);
      setPlan(p);
    } catch {
      setError("Plan yüklenemedi. Yenile butonuna tıklayın.");
    } finally {
      setLoading(false);
    }
    // Zayıf kazanımları da yükle
    try {
      const wa = await api.getWeakAchievements(token);
      setWeakAchievements(wa.slice(0, 5));
    } catch {}
  }, [token]);

  const loadWeeklyPlans = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const { from, to } = getWeekBounds();
      const plans = await api.getWeeklyPlans(token, from, to);
      setWeeklyPlans(plans);
    } catch {
      setError("Haftalık plan yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "today") loadPlan();
    else loadWeeklyPlans();
  }, [tab, loadPlan, loadWeeklyPlans]);

  const handleComplete = async (task: PlanTask) => {
    if (task.is_completed || !token) return;
    setCompletingId(task.id);
    setPlan((p) => p ? { ...p, completed_tasks: p.completed_tasks + 1, tasks: p.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: true } : t) } : p);
    try {
      await api.completeTask(token, task.id);
    } catch {
      setPlan((p) => p ? { ...p, completed_tasks: p.completed_tasks - 1, tasks: p.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: false } : t) } : p);
    }
    setCompletingId(null);
  };

  const handleDelete = async (task: PlanTask) => {
    if (!token) return;
    setDeletingId(task.id);
    const prev = plan;
    setPlan((p) => p ? {
      ...p,
      total_tasks: p.total_tasks - 1,
      completed_tasks: task.is_completed ? p.completed_tasks - 1 : p.completed_tasks,
      tasks: p.tasks?.filter((t) => t.id !== task.id),
    } : p);
    try {
      await api.deleteTask(token, task.id);
    } catch {
      setPlan(prev);
    }
    setDeletingId(null);
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !token) return;
    setAdding(true);
    const tmpId = Date.now();
    const tmpTask: PlanTask = { id: tmpId, title: newTask.trim(), type: "custom", is_completed: false };
    setPlan((p) => p ? { ...p, total_tasks: p.total_tasks + 1, tasks: [...(p.tasks ?? []), tmpTask] } : p);
    try {
      const res = await api.addPlanTask(token, { title: newTask.trim(), type: "custom" });
      setPlan((p) => p ? { ...p, tasks: p.tasks?.map((t) => t.id === tmpId ? res.task : t) } : p);
    } catch {
      setPlan((p) => p ? { ...p, total_tasks: p.total_tasks - 1, tasks: p.tasks?.filter((t) => t.id !== tmpId) } : p);
    }
    setNewTask("");
    setShowAddForm(false);
    setAdding(false);
  };

  const handleAddWeakToplan = async (wa: WeakAchievement) => {
    if (!token) return;
    setAddingWeakId(wa.id);
    try {
      const res = await api.addPlanTask(token, {
        title: `${wa.konu} — Tekrar Çalış (${wa.kod})`,
        type: "question",
        subject: wa.subject,
        kazanim_code: wa.kod,
      });
      setPlan((p) => p ? {
        ...p,
        total_tasks: p.total_tasks + 1,
        tasks: [...(p.tasks ?? []), res.task],
      } : p);
      setAddedWeakIds((prev) => new Set([...prev, wa.id]));
    } catch {}
    setAddingWeakId(null);
  };

  const tasks = plan?.tasks ?? [];
  const doneCount = plan?.completed_tasks ?? 0;
  const totalCount = plan?.total_tasks ?? 0;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  const DAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Günlük Plan</h1>
          <p className="text-slate-500 mt-0.5 capitalize">{today}</p>
        </div>
        <button
          onClick={() => tab === "today" ? loadPlan() : loadWeeklyPlans()}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Yenile"
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setTab("today")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "today" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Bugün
        </button>
        <button
          onClick={() => setTab("week")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "week" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Bu Hafta
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-sm font-medium">
          {error}
        </div>
      )}

      {tab === "today" ? (
        <>
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
                className="h-full from-teal-500 to-emerald-500 bg-gradient-to-r rounded-full transition-all duration-500"
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
                  const isAI = (task as PlanTask & { is_ai_suggested?: boolean }).is_ai_suggested;
                  return (
                    <li key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 group">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${task.is_completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {task.title}
                          </span>
                          {isAI && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 text-[10px] font-semibold">
                              <Sparkles className="w-3 h-3" /> AI
                            </span>
                          )}
                        </div>
                        {task.subject && <span className="text-xs text-slate-400">{task.subject}</span>}
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

          {/* AI Önerilen Görevler — Zayıf Kazanımlar */}
          {weakAchievements.length > 0 && (
            <div className="mb-4 bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowAiSuggestions((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-violet-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">AI Önerilen Görevler</p>
                    <p className="text-xs text-slate-500">{weakAchievements.length} zayıf kazanımdan oluşturuldu</p>
                  </div>
                </div>
                {showAiSuggestions
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />
                }
              </button>

              {showAiSuggestions && (
                <div className="border-t border-violet-50 divide-y divide-violet-50">
                  {weakAchievements.map((wa) => {
                    const isAdded = addedWeakIds.has(wa.id);
                    return (
                      <div key={wa.id} className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                              {wa.kod}
                            </span>
                            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
                              wa.accuracy_rate < 40 ? "text-red-500" : "text-amber-500"
                            }`} />
                          </div>
                          <p className="text-sm text-slate-800 truncate mt-0.5">{wa.konu}</p>
                          <p className="text-xs text-slate-400">%{wa.accuracy_rate} doğruluk · {wa.wrong_count} hata</p>
                        </div>
                        <button
                          onClick={() => handleAddWeakToplan(wa)}
                          disabled={isAdded || addingWeakId === wa.id}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            isAdded
                              ? "bg-teal-50 text-teal-600 cursor-default"
                              : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                          }`}
                        >
                          {addingWeakId === wa.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isAdded ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          {isAdded ? "Eklendi" : "Plana Ekle"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
        </>
      ) : (
        /* Haftalık görünüm */
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} cls="h-20" />)
          ) : weeklyPlans.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-500">Bu hafta için plan yok</p>
            </div>
          ) : (
            weeklyPlans.map((dayPlan) => {
              const date = new Date(dayPlan.plan_date);
              const isToday = date.toDateString() === new Date().toDateString();
              const pct = dayPlan.total_tasks > 0
                ? Math.round((dayPlan.completed_tasks / dayPlan.total_tasks) * 100) : 0;
              return (
                <div
                  key={dayPlan.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm ${isToday ? "border-teal-300 ring-1 ring-teal-200" : "border-slate-200"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isToday ? "text-teal-600" : "text-slate-700"}`}>
                        {DAYS_TR[date.getDay()]} {date.getDate()}
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">Bugün</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-500">
                      {dayPlan.completed_tasks}/{dayPlan.total_tasks}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-teal-500" : "bg-amber-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {dayPlan.tasks && dayPlan.tasks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {dayPlan.tasks.slice(0, 4).map((t) => (
                        <span
                          key={t.id}
                          className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                            t.is_completed ? "bg-teal-50 text-teal-600 line-through" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.title.length > 25 ? t.title.slice(0, 25) + "…" : t.title}
                        </span>
                      ))}
                      {(dayPlan.tasks?.length ?? 0) > 4 && (
                        <span className="text-xs text-slate-400 px-2 py-0.5">+{(dayPlan.tasks?.length ?? 0) - 4} daha</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
