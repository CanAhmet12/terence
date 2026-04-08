"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, DailyPlan, PlanTask, WeakAchievement } from "@/lib/api";
import {
  Calendar, CalendarDays, Check, Plus, Trash2, X, Loader2,
  Sparkles, ChevronDown, ChevronUp, Clock, BookOpen, Video,
  FileText, Dumbbell, RefreshCw, Target, AlertTriangle, CheckCircle2
} from "lucide-react";

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

// Görev tipi renkleri (sol border + ikon renk)
const TASK_TYPE_CONFIG: Record<string, {
  border: string;
  bg: string;
  text: string;
  icon: React.ElementType;
  iconBg: string;
}> = {
  question: { border: "border-indigo-400", bg: "bg-indigo-50/60", text: "text-indigo-700", icon: Dumbbell,  iconBg: "bg-indigo-100" },
  video:    { border: "border-rose-400",   bg: "bg-rose-50/60",   text: "text-rose-700",   icon: Video,     iconBg: "bg-rose-100"   },
  exam:     { border: "border-violet-400", bg: "bg-violet-50/60", text: "text-violet-700", icon: FileText,  iconBg: "bg-violet-100" },
  read:     { border: "border-teal-400",   bg: "bg-teal-50/60",   text: "text-teal-700",   icon: BookOpen,  iconBg: "bg-teal-100"   },
  custom:   { border: "border-slate-300",  bg: "bg-slate-50/60",  text: "text-slate-600",  icon: CheckCircle2, iconBg: "bg-slate-100" },
};

function getTaskConfig(task: PlanTask) {
  const key = task.type?.toLowerCase() ?? "custom";
  return TASK_TYPE_CONFIG[key] ?? TASK_TYPE_CONFIG.custom;
}

// Zaman dilimi grupları
function getTimeGroup(idx: number, total: number): "morning" | "afternoon" | "evening" {
  const pct = idx / Math.max(total - 1, 1);
  if (pct < 0.4) return "morning";
  if (pct < 0.7) return "afternoon";
  return "evening";
}

const TIME_GROUP_CONFIG = {
  morning:   { label: "Sabah Seansı",    color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  afternoon: { label: "Öğle Seansı",     color: "text-sky-600",    bg: "bg-sky-50",    border: "border-sky-200"    },
  evening:   { label: "Akşam Seansı",    color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
};

// 7 gün adları
const DAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// Dairesel progress ring
function CircularProgress({ pct, size = 80, stroke = 7, color = "#6366f1" }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s ease" }}
      />
    </svg>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function GunlukPlanPage() {
  const { user } = useAuth();
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

  const today = new Date();
  const todayStr = today.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = await api.getTodayPlan();
      setPlan(p as DailyPlan);
    } catch {
      setError("Plan yüklenemedi.");
    } finally {
      setLoading(false);
    }
    // Zayıf kazanımlar
    try {
      const wa = await api.getWeakAchievements();
      const arr = Array.isArray(wa) ? wa : [];
      setWeakAchievements((arr as WeakAchievement[]).slice(0, 5));
    } catch {}
  }, []);

  const loadWeekly = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const plans = await api.getWeeklyPlans();
      setWeeklyPlans(Array.isArray(plans) ? plans as DailyPlan[] : []);
    } catch {
      setError("Haftalık plan yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "today") loadPlan();
    else loadWeekly();
  }, [tab, loadPlan, loadWeekly]);

  const handleComplete = async (task: PlanTask) => {
    if (task.is_completed) return;
    setCompletingId(task.id);
    setPlan((p) => p ? {
      ...p,
      completed_tasks: (p.completed_tasks ?? 0) + 1,
      tasks: p.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: true } : t),
    } : p);
    try {
      await api.completeTask(task.id);
    } catch {
      setPlan((p) => p ? {
        ...p,
        completed_tasks: Math.max((p.completed_tasks ?? 1) - 1, 0),
        tasks: p.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: false } : t),
      } : p);
    }
    setCompletingId(null);
  };

  const handleDelete = async (task: PlanTask) => {
    const prev = plan;
    setDeletingId(task.id);
    setPlan((p) => p ? {
      ...p,
      total_tasks: Math.max((p.total_tasks ?? 1) - 1, 0),
      completed_tasks: task.is_completed ? Math.max((p.completed_tasks ?? 1) - 1, 0) : (p.completed_tasks ?? 0),
      tasks: p.tasks?.filter((t) => t.id !== task.id),
    } : p);
    try {
      await api.deleteTask(task.id);
    } catch {
      setPlan(prev);
    }
    setDeletingId(null);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    const tmpId = Date.now();
    const tmpTask: PlanTask = { id: tmpId, title: newTask.trim(), type: "custom", is_completed: false };
    setPlan((p) => p ? {
      ...p,
      total_tasks: (p.total_tasks ?? 0) + 1,
      tasks: [...(p.tasks ?? []), tmpTask],
    } : p);
    try {
      const res = await api.addPlanTask({ title: newTask.trim(), type: "custom" } as Parameters<typeof api.addPlanTask>[0]);
      const newTaskObj = ((res as Record<string, unknown>).task ?? res) as PlanTask;
      setPlan((p) => p ? { ...p, tasks: p.tasks?.map((t) => t.id === tmpId ? newTaskObj : t) } : p);
    } catch {
      setPlan((p) => p ? {
        ...p,
        total_tasks: Math.max((p.total_tasks ?? 1) - 1, 0),
        tasks: p.tasks?.filter((t) => t.id !== tmpId),
      } : p);
    }
    setNewTask("");
    setShowAddForm(false);
    setAdding(false);
  };

  const handleAddWeak = async (wa: WeakAchievement) => {
    setAddingWeakId(wa.id);
    try {
      const res = await api.addPlanTask({
        title: `${wa.konu} — Tekrar Çalış`,
        type: "question",
        subject: wa.subject,
      } as Parameters<typeof api.addPlanTask>[0]);
      const newTaskObj = ((res as Record<string, unknown>).task ?? res) as PlanTask;
      setPlan((p) => p ? {
        ...p,
        total_tasks: (p.total_tasks ?? 0) + 1,
        tasks: [...(p.tasks ?? []), newTaskObj],
      } : p);
      setAddedWeakIds((prev) => new Set([...prev, wa.id]));
    } catch {}
    setAddingWeakId(null);
  };

  const tasks = plan?.tasks ?? [];
  const doneCount = plan?.completed_tasks ?? 0;
  const totalCount = plan?.total_tasks ?? 0;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  // Görevleri gruplara böl
  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const doneTasks = tasks.filter((t) => t.is_completed);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Başlık ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Günlük Plan</h1>
            <p className="text-slate-500 mt-1 font-medium capitalize">{todayStr}</p>
          </div>
          <button
            onClick={() => tab === "today" ? loadPlan() : loadWeekly()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all shadow-sm"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Sekmeler ── */}
        <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit">
          {[
            { key: "today" as const, label: "Bugün", icon: Calendar },
            { key: "week" as const, label: "Bu Hafta", icon: CalendarDays },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Hata ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* ════ BUGÜN SEKMESİ ════ */}
        {tab === "today" && (
          <div className="space-y-5">

            {/* ── İlerleme Özeti ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-6">
                {/* Dairesel progress */}
                <div className="relative shrink-0">
                  {loading ? (
                    <Skeleton className="w-20 h-20 rounded-full" />
                  ) : (
                    <>
                      <CircularProgress pct={progress} size={80} stroke={7} color={progress === 100 ? "#22c55e" : "#6366f1"} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-black text-slate-800">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Metin bilgi */}
                <div className="flex-1">
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-black text-slate-900">
                        {doneCount}<span className="text-slate-400 font-medium text-lg">/{totalCount}</span>
                      </p>
                      <p className="text-sm text-slate-500 font-medium mt-0.5">
                        {progress === 100
                          ? "🎉 Tüm görevler tamamlandı!"
                          : doneCount > 0
                          ? `${totalCount - doneCount} görev kaldı`
                          : "Henüz görev tamamlanmadı"
                        }
                      </p>
                      {progress === 100 && (
                        <div className="flex items-center gap-1.5 mt-2 text-emerald-600 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Harika iş! Bugünkü planı bitirdin.
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Görev ekle butonu */}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Görev Ekle
                </button>
              </div>

              {/* Düz progress bar */}
              {!loading && totalCount > 0 && (
                <div className="mt-5 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      progress === 100
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : "bg-gradient-to-r from-indigo-500 to-violet-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* ── Görev Listesi ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5">
                      <Skeleton className="w-6 h-6 rounded-lg" />
                      <Skeleton className="h-5 flex-1" />
                      <Skeleton className="w-12 h-5 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 && !showAddForm ? (
                <div className="text-center py-14 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-700">Plan boş</h3>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
                    Bugün ne çalışacaksın? Görev ekleyerek başla.
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    İlk Görevi Ekle
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {/* Bekleyen görevler */}
                  {pendingTasks.map((task, idx) => {
                    const tc = getTaskConfig(task);
                    const Icon = tc.icon;
                    const timeGroup = getTimeGroup(idx, pendingTasks.length);
                    const tg = TIME_GROUP_CONFIG[timeGroup];

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border-l-[3px] ${tc.border} ${tc.bg} group transition-all hover:shadow-sm`}
                      >
                        {/* İkon */}
                        <div className={`w-9 h-9 rounded-xl ${tc.iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4.5 h-4.5 ${tc.text}`} strokeWidth={2} />
                        </div>

                        {/* İçerik */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {task.subject && (
                              <span className={`text-[11px] font-medium ${tc.text}`}>{task.subject}</span>
                            )}
                            {task.duration_minutes && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                <Clock className="w-3 h-3" />
                                {task.duration_minutes}dk
                              </span>
                            )}
                            <span className={`hidden sm:inline text-[11px] font-medium px-1.5 py-0.5 rounded-md ${tg.bg} ${tg.color}`}>
                              {tg.label}
                            </span>
                          </div>
                        </div>

                        {/* Aksiyonlar */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleComplete(task)}
                            disabled={completingId === task.id}
                            className="w-8 h-8 rounded-xl bg-white/80 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 flex items-center justify-center transition-all group/btn"
                            title="Tamamla"
                          >
                            {completingId === task.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                              : <Check className="w-3.5 h-3.5 text-slate-300 group-hover/btn:text-emerald-500 transition-colors" />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(task)}
                            disabled={deletingId === task.id}
                            className="w-8 h-8 rounded-xl bg-white/80 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 group/btn"
                            title="Sil"
                          >
                            {deletingId === task.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                              : <Trash2 className="w-3.5 h-3.5 text-slate-300 group-hover/btn:text-red-500 transition-colors" />
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tamamlanan görevler (varsa) */}
                  {doneTasks.length > 0 && (
                    <div className="pt-3 pb-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
                        Tamamlananlar ({doneTasks.length})
                      </p>
                      {doneTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3.5 p-3.5 rounded-xl opacity-50"
                        >
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check className="w-4.5 h-4.5 text-emerald-500" strokeWidth={2.5} />
                          </div>
                          <p className="text-sm font-medium text-slate-500 line-through truncate flex-1">
                            {task.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Görev ekleme formu */}
                  {showAddForm && (
                    <div className="flex gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <input
                        autoFocus
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                        placeholder="Görev başlığını yaz..."
                        className="flex-1 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        onClick={handleAddTask}
                        disabled={adding || !newTask.trim()}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Ekle
                      </button>
                      <button
                        onClick={() => { setShowAddForm(false); setNewTask(""); }}
                        className="w-10 h-10 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Görev ekle dashed butonu */}
                  {!showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-400 hover:text-indigo-600 text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Görev Ekle
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── AI Önerilen Görevler ── */}
            {weakAchievements.length > 0 && (
              <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-violet-50/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">AI Destekli Görev Önerileri</p>
                    <p className="text-xs text-slate-500 mt-0.5">{weakAchievements.length} zayıf kazanım tespit edildi</p>
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
                      const riskColor = wa.accuracy_rate < 40 ? "text-red-500" : "text-amber-500";
                      return (
                        <div key={wa.id} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-violet-50/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                                {wa.kod}
                              </span>
                              <AlertTriangle className={`w-3.5 h-3.5 ${riskColor}`} />
                            </div>
                            <p className="text-sm font-medium text-slate-700 truncate">{wa.konu}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              %{wa.accuracy_rate} doğruluk · {wa.wrong_count} hata
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddWeak(wa)}
                            disabled={isAdded || addingWeakId === wa.id}
                            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                              isAdded
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                                : "bg-violet-100 text-violet-700 hover:bg-violet-200 border border-violet-200"
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
          </div>
        )}

        {/* ════ BU HAFTA SEKMESİ ════ */}
        {tab === "week" && (
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-20" />)
            ) : weeklyPlans.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">Bu hafta için plan yok</p>
                <p className="text-sm text-slate-500 mt-1">Bugün sekmesini kullanarak görev ekle</p>
              </div>
            ) : (
              weeklyPlans.map((dayPlan) => {
                const date = new Date(dayPlan.plan_date ?? dayPlan.date ?? "");
                const isToday = date.toDateString() === today.toDateString();
                const dayName = DAYS_TR[date.getDay()];
                const pct = (dayPlan.total_tasks ?? 0) > 0
                  ? Math.round(((dayPlan.completed_tasks ?? 0) / (dayPlan.total_tasks ?? 1)) * 100)
                  : 0;

                return (
                  <div
                    key={String(dayPlan.id ?? dayPlan.plan_date)}
                    className={`bg-white rounded-2xl border p-5 transition-all ${
                      isToday
                        ? "border-indigo-300 ring-2 ring-indigo-100 shadow-sm"
                        : "border-slate-100 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          isToday ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          {date.getDate()}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isToday ? "text-indigo-700" : "text-slate-800"}`}>
                            {dayName}
                            {isToday && <span className="ml-2 text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Bugün</span>}
                          </p>
                          <p className="text-xs text-slate-400">{(dayPlan.completed_tasks ?? 0)}/{dayPlan.total_tasks ?? 0} görev</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${pct === 100 ? "text-emerald-600" : pct >= 50 ? "text-indigo-600" : "text-slate-400"}`}>
                          %{pct}
                        </p>
                      </div>
                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct === 100 ? "bg-emerald-500"
                          : pct >= 50 ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                          : "bg-amber-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Görev chip'leri */}
                    {dayPlan.tasks && dayPlan.tasks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {dayPlan.tasks.slice(0, 4).map((t) => (
                          <span
                            key={t.id}
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${
                              t.is_completed
                                ? "bg-emerald-50 text-emerald-600 line-through"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.title.length > 22 ? t.title.slice(0, 22) + "…" : t.title}
                          </span>
                        ))}
                        {(dayPlan.tasks?.length ?? 0) > 4 && (
                          <span className="text-[11px] text-slate-400 px-2 py-1">
                            +{(dayPlan.tasks?.length ?? 0) - 4} daha
                          </span>
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
    </div>
  );
}
