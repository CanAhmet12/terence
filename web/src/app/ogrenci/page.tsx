"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Clock, Target, TrendingUp, AlertTriangle, Zap, BookOpen, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, PlanStats, DailyPlan, PlanTask } from "@/lib/api";

const WEEK_LABELS = ["H1", "H2", "H3", "H4", "H5", "H6"];

function secondsToHuman(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

const DEMO_PLAN: DailyPlan = {
  id: 1, plan_date: new Date().toISOString(), status: "active",
  total_tasks: 4, completed_tasks: 2,
  tasks: [
    { id: 1, title: "M.8.1.1 Üslü İfadeler — 10 soru", type: "question", is_completed: true, subject: "Matematik" },
    { id: 2, title: "Fizik Hareket — Video izle", type: "video", is_completed: true, subject: "Fizik" },
    { id: 3, title: "TYT Deneme — 40 soru", type: "exam", is_completed: false },
    { id: 4, title: "M.8.1.2 Tekrar — 5 soru", type: "question", is_completed: false, subject: "Matematik" },
  ],
};

const DEMO_STATS: PlanStats = {
  tasks_done_today: 2, tasks_total_today: 4,
  study_time_today_seconds: 9240, study_time_weekly_seconds: 64800,
  xp_points: 1240, level: 5,
  current_net: 52, target_net: 75,
  weekly_nets: [42, 45, 43, 48, 47, 49],
};

export default function StudentDashboardPage() {
  const { user, token } = useAuth();
  const isDemo = !token || token.startsWith("demo-token-");

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isDemo) {
      setPlan(DEMO_PLAN);
      setStats(DEMO_STATS);
      setLoading(false);
      return;
    }
    try {
      const [planRes, statsRes] = await Promise.allSettled([
        api.getTodayPlan(token!),
        api.getPlanStats(token!),
      ]);
      if (planRes.status === "fulfilled") setPlan(planRes.value);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
    } catch {
      // sessizce geç
    } finally {
      setLoading(false);
    }
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleTask = async (task: PlanTask) => {
    if (task.is_completed || !plan) return;
    // Optimistik güncelleme
    setPlan((prev) => prev ? {
      ...prev,
      completed_tasks: prev.completed_tasks + 1,
      tasks: prev.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: true } : t),
    } : prev);
    if (!isDemo && token) {
      try {
        await api.completeTask(token, task.id);
      } catch {
        // geri al
        setPlan((prev) => prev ? {
          ...prev,
          completed_tasks: prev.completed_tasks - 1,
          tasks: prev.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: false } : t),
        } : prev);
      }
    }
  };

  const tasks = plan?.tasks ?? [];
  const doneCount = plan?.completed_tasks ?? 0;
  const totalCount = plan?.total_tasks ?? 0;
  const weeklyNets = stats?.weekly_nets ?? [];
  const maxNet = weeklyNets.length > 0 ? Math.max(...weeklyNets, 1) : 1;

  const riskLevel = stats && stats.target_net > 0
    ? (stats.current_net / stats.target_net) >= 0.85 ? "green"
    : (stats.current_net / stats.target_net) >= 0.6 ? "yellow" : "red"
    : "green";

  const riskColors = {
    green: { bg: "bg-teal-50", border: "border-teal-200", title: "text-teal-900", body: "text-teal-800" },
    yellow: { bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-900", body: "text-amber-800" },
    red: { bg: "bg-red-50", border: "border-red-200", title: "text-red-900", body: "text-red-800" },
  };
  const risk = riskColors[riskLevel];

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Merhaba, {user?.name?.split(" ")[0] || "Öğrenci"} 👋
        </h1>
        <p className="text-slate-600 mt-1 text-lg">Bugünkü hedeflerini takip et</p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu — Veriler gerçek değil
          </span>
        )}
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Bugün Çalışma", value: secondsToHuman(stats?.study_time_today_seconds ?? 0), icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "XP Puanı", value: (stats?.xp_points ?? 0).toLocaleString("tr"), icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Mevcut Net", value: stats?.current_net ?? 0, icon: BarChart3, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Seviye", value: `Seviye ${stats?.level ?? 1}`, icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            {loading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-7 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Bugünkü Plan */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900 text-lg">Bugünkü Plan</h2>
            {loading ? (
              <div className="w-24 h-7 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">
                  {doneCount}/{totalCount} tamamlandı
                </span>
                <Link href="/ogrenci/plan" className="text-sm text-slate-500 hover:text-slate-700">
                  Tümü →
                </Link>
              </div>
            )}
          </div>

          {/* İlerleme çubuğu */}
          {!loading && totalCount > 0 && (
            <div className="mb-5">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(doneCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Check className="w-10 h-10 text-teal-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Bugün için görev yok</p>
              <Link href="/ogrenci/plan" className="text-sm text-teal-600 mt-2 inline-block hover:underline">
                Plan ekle →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    task.is_completed
                      ? "bg-teal-50/80 border-teal-100"
                      : "bg-slate-50/80 border-slate-100 hover:bg-slate-100/80"
                  }`}
                  onClick={() => toggleTask(task)}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    task.is_completed ? "bg-teal-500 text-white" : "bg-slate-200 hover:bg-slate-300"
                  }`}>
                    {task.is_completed && <Check className="w-4 h-4" strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium text-sm ${task.is_completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {task.title}
                    </span>
                    {task.subject && (
                      <span className="ml-2 text-xs text-slate-400">{task.subject}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${
                    task.type === "video" ? "bg-blue-50 text-blue-600"
                    : task.type === "exam" ? "bg-purple-50 text-purple-600"
                    : "bg-slate-100 text-slate-500"
                  }`}>
                    {task.type === "video" ? "Video" : task.type === "exam" ? "Deneme" : "Soru"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sağ sütun */}
        <div className="space-y-6">
          {/* Hedef */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" /> Hedef
            </h2>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <p className="text-xs text-slate-500">Mevcut / Hedef Net</p>
                  <p className="text-xl font-bold text-teal-700">
                    {stats?.current_net ?? 0} / {stats?.target_net ?? "?"}
                  </p>
                </div>
                {stats?.target_net && stats.target_net > 0 && (
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                      style={{ width: `${Math.min((stats.current_net / stats.target_net) * 100, 100)}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  {user?.goal?.exam_type ?? "TYT"} hedefi
                  {user?.goal?.target_school ? ` • ${user.goal.target_school}` : ""}
                </p>
              </div>
            )}
            <Link href="/profil" className="mt-4 block text-center py-2.5 bg-teal-50 text-teal-700 font-semibold text-sm rounded-xl hover:bg-teal-100 transition-colors">
              Hedef Düzenle
            </Link>
          </div>

          {/* Hızlı Erişim */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">Hızlı Başla</h2>
            <div className="space-y-2">
              {[
                { href: "/ogrenci/soru-bankasi", label: "Soru Çöz", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
                { href: "/ogrenci/deneme", label: "Deneme Sınavı", icon: Target, color: "text-purple-600 bg-purple-50" },
                { href: "/ogrenci/dersler", label: "Ders İzle", icon: TrendingUp, color: "text-teal-600 bg-teal-50" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk kartı */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className={`p-5 rounded-2xl border ${risk.bg} ${risk.border}`}>
          <div className="flex items-center gap-2 mb-1">
            {riskLevel !== "green" && <AlertTriangle className={`w-4 h-4 ${risk.title}`} />}
            {riskLevel === "green" && <Check className="w-4 h-4 text-teal-700" />}
            <p className={`font-bold ${risk.title}`}>
              {riskLevel === "green" ? "Hedefte İlerliyorsun" : riskLevel === "yellow" ? "Orta Hedef Riski" : "Yüksek Hedef Riski"}
            </p>
          </div>
          <p className={`text-sm mt-1 leading-relaxed ${risk.body}`}>
            {riskLevel === "green"
              ? "Bu hızı korursan hedefine ulaşırsın. Harika gidiyorsun!"
              : "Net hızını artırman gerekiyor. Zayıf konularına odaklan."}
          </p>
          <Link href="/ogrenci/zayif-kazanim" className={`text-sm font-semibold mt-3 inline-flex items-center gap-1 hover:underline ${risk.title}`}>
            Zayıf kazanımları gör →
          </Link>
        </div>

        {/* Haftalık Net Grafiği */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Haftalık Net Trendi</h3>
            <Link href="/ogrenci/rapor" className="text-xs text-teal-600 hover:underline">Detay →</Link>
          </div>
          {loading ? (
            <div className="flex items-end gap-1 h-20">{[1,2,3,4,5,6].map(i => <div key={i} className="flex-1 bg-slate-100 rounded-t animate-pulse" style={{height:`${30+i*10}%`}}/>)}</div>
          ) : weeklyNets.length > 0 ? (
            <div className="flex items-end gap-1 h-20">
              {weeklyNets.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-teal-600 to-teal-400 min-h-[4px] relative group cursor-default"
                    style={{ height: `${(val / maxNet) * 100}%` }}
                    title={`${val} net`}
                  />
                  <span className="text-[10px] text-slate-400">{WEEK_LABELS[i]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-400">Deneme çözdükçe burada görünür</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
