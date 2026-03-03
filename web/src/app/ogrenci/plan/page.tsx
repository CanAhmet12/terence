"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, DailyPlan, PlanTask } from "@/lib/api";
import {
  Calendar, Check, Plus, Loader2, BookOpen,
  Video as VideoIcon, FileText, Dumbbell, RefreshCw,
  TrendingUp, Clock, Target, AlertTriangle, ChevronRight
} from "lucide-react";
import Link from "next/link";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

const DEMO_PLAN: DailyPlan = {
  date: new Date().toISOString().slice(0, 10),
  tasks: [
    { id: 1, text: "M.8.1.1 Üslü İfadeler — 10 soru", type: "question", subject: "Matematik", kazanim_code: "M.8.1.1", is_done: true, xp: 20 },
    { id: 2, text: "Fizik: Hareket — Video izle", type: "video", subject: "Fizik", is_done: true, xp: 15 },
    { id: 3, text: "TYT Deneme — 40 soru", type: "exam", is_done: false, xp: 50 },
    { id: 4, text: "Kimya: Bağlar — 15 soru", type: "question", subject: "Kimya", is_done: false, xp: 25 },
  ],
  completed_count: 2,
  total_count: 4,
  weekly_summary: { completed: 18, total: 25, study_minutes: 765, questions_solved: 156 },
  risk_message: "Bu hızla devam edersen hedef bölüm risk altında. Pro pakete geçiş önerilir.",
};

const TASK_ICONS: Record<PlanTask["type"], React.ElementType> = {
  question: Dumbbell,
  video: VideoIcon,
  exam: FileText,
  custom: BookOpen,
};

const TASK_COLORS: Record<PlanTask["type"], string> = {
  question: "bg-blue-50 text-blue-600",
  video: "bg-purple-50 text-purple-600",
  exam: "bg-amber-50 text-amber-600",
  custom: "bg-slate-100 text-slate-600",
};

function minutesToHuman(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

export default function PlanPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });

  const loadPlan = useCallback(async () => {
    if (isDemo || !token) {
      setPlan(DEMO_PLAN);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getDailyPlan(token);
      setPlan(res);
    } catch {
      setPlan(DEMO_PLAN);
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const handleComplete = async (task: PlanTask) => {
    if (task.is_done) return;
    setCompleting(task.id);
    if (plan) {
      const updated: DailyPlan = {
        ...plan,
        tasks: plan.tasks.map((t) => t.id === task.id ? { ...t, is_done: true } : t),
        completed_count: plan.completed_count + 1,
      };
      setPlan(updated);
    }
    if (!isDemo && token) {
      try {
        await api.completeTask(token, task.id);
      } catch {}
    }
    setCompleting(null);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    const tempTask: PlanTask = { id: Date.now(), text: newTask, type: "custom", is_done: false, xp: 5 };
    setPlan((prev) => prev ? { ...prev, tasks: [...prev.tasks, tempTask], total_count: prev.total_count + 1 } : prev);
    if (!isDemo && token) {
      try {
        const created = await api.addCustomTask(token, newTask);
        setPlan((prev) => prev ? {
          ...prev,
          tasks: prev.tasks.map((t) => t.id === tempTask.id ? created : t),
        } : prev);
      } catch {}
    }
    setNewTask("");
    setShowAddForm(false);
    setAdding(false);
  };

  const completionPct = plan ? Math.round((plan.completed_count / Math.max(plan.total_count, 1)) * 100) : 0;

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Günlük Çalışma Planı</h1>
          <p className="text-slate-600 mt-1">
            {today} — Görevleri tamamla, XP kazan, seviye atla.
          </p>
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              Demo Modu
            </span>
          )}
        </div>
        <button onClick={loadPlan} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors mt-1">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Ana görev listesi */}
        <div className="lg:col-span-2 space-y-5">
          {/* İlerleme barı */}
          {!loading && plan && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <h2 className="font-bold text-slate-900">Bugünkü Görevler</h2>
                </div>
                <span className="text-teal-600 font-bold">{plan.completed_count}/{plan.total_count}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">%{completionPct} tamamlandı</p>
            </div>
          )}

          {/* Görevler */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {(plan?.tasks ?? []).map((task) => {
                    const Icon = TASK_ICONS[task.type];
                    const colorCls = TASK_COLORS[task.type];
                    return (
                      <li
                        key={task.id}
                        className={`flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors ${task.is_done ? "opacity-70" : ""}`}
                      >
                        {/* Tamamla butonu */}
                        <button
                          onClick={() => handleComplete(task)}
                          disabled={task.is_done || completing === task.id}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            task.is_done
                              ? "bg-teal-500 text-white"
                              : "bg-slate-100 hover:bg-teal-100 hover:text-teal-600 border-2 border-slate-200 hover:border-teal-300"
                          }`}
                        >
                          {completing === task.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : task.is_done ? (
                            <Check className="w-4 h-4" />
                          ) : null}
                        </button>

                        {/* İkon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* İçerik */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${task.is_done ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {task.text}
                          </p>
                          {task.subject && (
                            <p className="text-xs text-slate-400 mt-0.5">{task.subject}{task.kazanim_code ? ` · ${task.kazanim_code}` : ""}</p>
                          )}
                        </div>

                        {/* XP */}
                        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                          task.is_done ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500"
                        }`}>
                          +{task.xp} XP
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Görev ekle */}
                <div className="p-4 border-t border-slate-100">
                  {showAddForm ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Görev metni yaz..."
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                        onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                        autoFocus
                      />
                      <button
                        onClick={handleAddTask}
                        disabled={adding || !newTask.trim()}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle"}
                      </button>
                      <button onClick={() => setShowAddForm(false)} className="px-3 py-2 text-slate-500 hover:text-slate-700 text-sm">
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-2 text-teal-600 font-medium hover:text-teal-700 text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Özel görev ekle
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sağ panel */}
        <div className="space-y-5">
          {/* Haftalık özet */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Haftalık Özet
            </h3>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : plan ? (
              <div className="space-y-3">
                {[
                  { label: "Tamamlanan görev", value: `${plan.weekly_summary.completed}/${plan.weekly_summary.total}`, icon: Check },
                  { label: "Çalışma süresi", value: minutesToHuman(plan.weekly_summary.study_minutes), icon: Clock },
                  { label: "Çözülen soru", value: String(plan.weekly_summary.questions_solved), icon: Target },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-teal-500" />
                      {label}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Risk uyarısı */}
          {plan?.risk_message && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Dikkat</p>
                  <p className="text-sm text-amber-700">{plan.risk_message}</p>
                  <Link
                    href="/paketler"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                  >
                    Paketleri İncele <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Hızlı linkler */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Hızlı Erişim</h3>
            <div className="space-y-2">
              {[
                { href: "/ogrenci/soru-bankasi", label: "Soru Bankası", icon: Dumbbell },
                { href: "/ogrenci/video", label: "Video Dersler", icon: VideoIcon },
                { href: "/ogrenci/deneme", label: "Denemeler", icon: FileText },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Icon className="w-4 h-4 text-teal-500" />
                    {label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
