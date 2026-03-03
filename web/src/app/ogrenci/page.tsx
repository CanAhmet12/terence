"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Clock, Target, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, DailyTask, GoalAnalysis, StudentStatistics } from "@/lib/api";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function secondsToHuman(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

function riskColor(level: "green" | "yellow" | "red") {
  if (level === "red") return { bg: "bg-red-50", border: "border-red-200", title: "text-red-900", body: "text-red-800", link: "text-red-700" };
  if (level === "yellow") return { bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-900", body: "text-amber-800", link: "text-amber-700" };
  return { bg: "bg-teal-50", border: "border-teal-200", title: "text-teal-900", body: "text-teal-800", link: "text-teal-700" };
}

export default function StudentDashboardPage() {
  const { user, token } = useAuth();

  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [stats, setStats] = useState<StudentStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [goalAnalysis, setGoalAnalysis] = useState<GoalAnalysis | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);

  const isDemo = token?.startsWith("demo-token-");

  const loadData = useCallback(async () => {
    if (!token || isDemo) {
      // Demo modda sahte veriyle göster
      setTasks([
        { id: 1, task_type: "question", title: "M.8.1.1 Üslü İfadeler — 10 soru", description: "", is_done: true, due_date: "" },
        { id: 2, task_type: "video", title: "Fizik Hareket — Video izle", description: "", is_done: true, due_date: "" },
        { id: 3, task_type: "exam", title: "TYT Deneme — 40 soru", description: "", is_done: false, due_date: "" },
        { id: 4, task_type: "question", title: "M.8.1.2 Tekrar — 5 soru", description: "", is_done: false, due_date: "" },
      ]);
      setStats({
        total_questions_answered: 1240,
        correct_count: 980,
        wrong_count: 260,
        net_score: 52,
        study_time_today_seconds: 9240,
        study_time_week_seconds: 64800,
        weekly_nets: [42, 45, 43, 48, 47, 49, 52],
        streak_days: 7,
      });
      setGoalAnalysis({
        target_net: 75,
        current_net: 52,
        days_remaining: 165,
        weekly_net_needed: 1,
        risk_level: "yellow",
        predicted_net: 68,
      });
      setTasksLoading(false);
      setStatsLoading(false);
      setGoalLoading(false);
      return;
    }

    // Paralel API çağrıları
    const [tasksResult, statsResult, goalResult] = await Promise.allSettled([
      api.getDailyTasks(token),
      api.getStatistics(token),
      api.getGoalAnalysis(token),
    ]);

    if (tasksResult.status === "fulfilled") setTasks(tasksResult.value);
    setTasksLoading(false);

    if (statsResult.status === "fulfilled") setStats(statsResult.value);
    setStatsLoading(false);

    if (goalResult.status === "fulfilled") setGoalAnalysis(goalResult.value);
    setGoalLoading(false);
  }, [token, isDemo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTask = async (task: DailyTask) => {
    if (task.is_done) return;
    // Optimistik güncelleme
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_done: true } : t)));
    if (token && !isDemo) {
      try {
        await api.completeDailyTask(token, task.id);
      } catch {
        // Hata durumunda geri al
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_done: false } : t)));
      }
    }
  };

  const doneCount = tasks.filter((t) => t.is_done).length;
  const weeklyNets = stats?.weekly_nets ?? [];
  const maxNet = weeklyNets.length > 0 ? Math.max(...weeklyNets, 1) : 1;
  const risk = goalAnalysis ? riskColor(goalAnalysis.risk_level) : riskColor("yellow");

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Merhaba, {user?.name || "Öğrenci"}
        </h1>
        <p className="text-slate-600 mt-1 text-lg">Bugünkü hedeflerini takip et</p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu — Veriler gerçek değil
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        {/* Görevler */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900 text-lg">Bugünkü Görevler</h2>
            {tasksLoading ? (
              <div className="w-24 h-7 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">
                {doneCount}/{tasks.length} tamamlandı
              </span>
            )}
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Check className="w-10 h-10 text-teal-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Bugün için görev yok</p>
              <p className="text-sm mt-1">Harika iş, tüm görevleri tamamladın!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    task.is_done
                      ? "bg-teal-50/80 border-teal-100"
                      : "bg-slate-50/80 border-slate-100 hover:bg-slate-100/80"
                  }`}
                  onClick={() => toggleTask(task)}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      task.is_done ? "bg-teal-500 text-white" : "bg-slate-200 hover:bg-slate-300"
                    }`}
                  >
                    {task.is_done ? <Check className="w-4 h-4" strokeWidth={2.5} /> : null}
                  </div>
                  <span className={`font-medium ${task.is_done ? "text-slate-500 line-through" : "text-slate-900"}`}>
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 text-sm text-slate-500">Görev bitince tikla. Sistem otomatik yeni görev ekler.</p>
        </div>

        {/* Sağ Sütun */}
        <div className="space-y-6">
          {/* Hedef Kartı */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="font-bold text-slate-900 mb-5">Hedef Durumu</h2>
            {goalLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : goalAnalysis ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                  <p className="text-sm text-slate-500 font-medium">Hedef Net</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-teal-600">{goalAnalysis.target_net}</p>
                    <p className="text-sm text-slate-500">/ Mevcut: {goalAnalysis.current_net}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">Sınava Kalan Gün</p>
                  <p className="text-2xl font-bold text-slate-900">{goalAnalysis.days_remaining}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-sm text-slate-500 font-medium">Haftalık Gerekli Net</p>
                  <p className="text-2xl font-bold text-amber-600">+{goalAnalysis.weekly_net_needed}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Henüz hedef belirlenmedi</p>
              </div>
            )}
            <Link
              href="/ogrenci/hedef"
              className="mt-5 block text-center py-3 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors"
            >
              Hedefi Düzenle
            </Link>
          </div>

          {/* Çalışma Süresi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="font-bold text-slate-900">Çalışma Süresi</h2>
            </div>
            {statsLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <>
                <p className="text-3xl font-bold text-slate-900">
                  {secondsToHuman(stats?.study_time_today_seconds ?? 0)}
                </p>
                <p className="text-sm text-slate-500 mt-1">Bugün</p>
              </>
            )}
          </div>

          {/* Seviye / Streak */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="font-bold text-slate-900">Seri</h2>
            </div>
            {statsLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <>
                <p className="text-3xl font-bold text-slate-900">{stats?.streak_days ?? 0} gün</p>
                <p className="text-sm text-slate-500 mt-1">Kesintisiz çalışma serisi</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Risk / Öneri Kartları */}
      <div className="mb-8 grid sm:grid-cols-2 gap-4">
        {goalAnalysis && goalAnalysis.risk_level !== "green" ? (
          <div className={`p-5 rounded-2xl border ${risk.bg} ${risk.border} hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${risk.title}`} />
              <p className={`font-bold ${risk.title}`}>
                {goalAnalysis.risk_level === "red" ? "Yüksek Hedef Riski" : "Orta Hedef Riski"}
              </p>
            </div>
            <p className={`text-sm mt-1 leading-relaxed ${risk.body}`}>
              Mevcut hızla hedef nete ulaşmak zor görünüyor.
              Tahmin edilen net: <strong>{goalAnalysis.predicted_net}</strong> (Hedef: {goalAnalysis.target_net})
            </p>
            <Link href="/ogrenci/hedef" className={`text-sm font-semibold mt-3 inline-flex items-center gap-1 hover:underline ${risk.link}`}>
              Planı güncelle →
            </Link>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200/80 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-teal-700" />
              <p className="font-bold text-teal-900">Hedefte İlerliyorsun</p>
            </div>
            <p className="text-sm text-teal-800 mt-1 leading-relaxed">
              Bu hızı korursan hedefine ulaşırsın. Harika gidiyorsun!
            </p>
            <Link href="/ogrenci/rapor" className="text-sm font-semibold text-teal-700 mt-3 inline-flex items-center gap-1 hover:underline">
              Detaylı rapor →
            </Link>
          </div>
        )}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <p className="font-bold text-slate-900">Paket Önerisi</p>
          </div>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Pro pakete geçersen tüm videolara, soru bankasına ve canlı derse erişirsin.
          </p>
          <Link href="/#paketler" className="text-sm font-semibold text-slate-700 mt-3 inline-flex items-center gap-1 hover:underline">
            Paketleri incele →
          </Link>
        </div>
      </div>

      {/* Haftalık Net Grafiği */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-slate-900 text-lg">Haftalık Net Artışı</h2>
          <Link href="/ogrenci/rapor" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Detaylı Rapor →
          </Link>
        </div>

        {statsLoading ? (
          <div className="flex items-end gap-2 h-36">
            {DAYS.map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-slate-100 animate-pulse" style={{ height: `${40 + Math.random() * 60}%` }} />
                <span className="text-xs font-medium text-slate-400">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        ) : weeklyNets.length > 0 ? (
          <>
            <div className="flex items-end gap-2 h-36">
              {weeklyNets.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-teal-600 to-teal-400 transition-all hover:from-teal-700 min-h-[20px] relative group"
                    style={{ height: `${(val / maxNet) * 100}%` }}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 whitespace-nowrap">
                      {val}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{DAYS[i] ?? ""}</span>
                </div>
              ))}
            </div>
            {weeklyNets.length >= 2 && (
              <p className="mt-5 text-sm text-slate-500">
                Bu hafta{" "}
                <span className={weeklyNets[weeklyNets.length - 1] >= weeklyNets[0] ? "text-teal-600 font-semibold" : "text-red-500 font-semibold"}>
                  {weeklyNets[weeklyNets.length - 1] >= weeklyNets[0] ? "+" : ""}
                  {weeklyNets[weeklyNets.length - 1] - weeklyNets[0]} net
                </span>{" "}
                artış.{" "}
                {weeklyNets[weeklyNets.length - 1] >= weeklyNets[0]
                  ? "Hedefine doğru ilerliyorsun."
                  : "Bu hafta biraz daha fazla çalışmayı dene."}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <p className="text-sm">Henüz veri yok. Soru çözdükçe grafiğin burada oluşacak.</p>
          </div>
        )}
      </div>
    </div>
  );
}
