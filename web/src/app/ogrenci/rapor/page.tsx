"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, StudentStatistics, GoalAnalysis } from "@/lib/api";
import { Clock, FileQuestion, TrendingUp, AlertTriangle, BarChart3, Zap, Target } from "lucide-react";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function secondsToHuman(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function RaporPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [stats, setStats] = useState<StudentStatistics | null>(null);
  const [goal, setGoal] = useState<GoalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token || isDemo) {
      setStats({
        tasks_done_today: 5,
        tasks_total_today: 8,
        study_time_today_seconds: 9240,
        study_time_weekly_seconds: 45900,
        xp_points: 1240,
        level: 5,
        current_net: 52,
        target_net: 75,
        weekly_nets: [42, 45, 43, 48, 47, 49, 52],
      });
      setGoal({
        target_net: 75,
        current_net: 52,
        days_remaining: 165,
        weekly_net_needed: 1,
        risk_level: "yellow",
        predicted_net: 61,
      });
      setLoading(false);
      return;
    }
    const [statsRes, goalRes] = await Promise.allSettled([
      api.getPlanStats(token),
      api.getGoalAnalysis(token),
    ]);
    if (statsRes.status === "fulfilled") setStats(statsRes.value);
    if (goalRes.status === "fulfilled") setGoal(goalRes.value);
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  const weeklyNets = stats?.weekly_nets ?? [];
  const maxNet = weeklyNets.length > 0 ? Math.max(...weeklyNets, 1) : 1;
  const netArtis = weeklyNets.length >= 2 ? weeklyNets[weeklyNets.length - 1] - weeklyNets[0] : 0;
  const tasksDoneRatio = stats ? Math.round((stats.tasks_done_today / Math.max(stats.tasks_total_today, 1)) * 100) : 0;

  const summaryCards = [
    {
      icon: Clock,
      color: "text-teal-600",
      bg: "bg-teal-50",
      label: "Çalışma (Bu Hafta)",
      value: loading ? null : secondsToHuman(stats?.study_time_weekly_seconds ?? 0),
      sub: loading ? null : `Bugün: ${secondsToHuman(stats?.study_time_today_seconds ?? 0)}`,
    },
    {
      icon: FileQuestion,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      label: "Bugünkü Görevler",
      value: loading ? null : `${stats?.tasks_done_today ?? 0}/${stats?.tasks_total_today ?? 0}`,
      sub: loading ? null : `%${tasksDoneRatio} tamamlandı`,
    },
    {
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
      label: "Net Artışı (Hafta)",
      value: loading ? null : (netArtis >= 0 ? `+${netArtis}` : `${netArtis}`),
      sub: loading ? null : `Hedef: +${goal?.weekly_net_needed ?? "—"}`,
      valueColor: netArtis >= 0 ? "text-teal-600" : "text-red-600",
    },
    {
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      label: "XP Puanı",
      value: loading ? null : `${(stats?.xp_points ?? 0).toLocaleString("tr")}`,
      sub: loading ? null : `Seviye ${stats?.level ?? 1}`,
    },
  ];

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Performans Raporu</h1>
        <p className="text-slate-600 mt-1">Çalışma süresi, soru istatistikleri, net artışı ve hedef analizi</p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
      </div>

      {/* Özet kartlar */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map(({ icon: Icon, color, bg, label, value, sub, valueColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`flex items-center gap-2 ${color} mb-3`}>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm text-slate-700">{label}</span>
            </div>
            {value === null ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <p className={`text-2xl font-bold ${valueColor ?? "text-slate-900"}`}>{value}</p>
            )}
            {sub === null ? (
              <Skeleton className="h-4 w-32 mt-1" />
            ) : (
              <p className="text-sm text-slate-500 mt-1">{sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Net grafiği */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            7 Günlük Net Grafiği
          </h2>
          {loading ? (
            <div className="flex items-end gap-2 h-48">
              {DAYS.map((d) => <Skeleton key={d} className="flex-1 h-full" />)}
            </div>
          ) : weeklyNets.length > 0 ? (
            <>
              <div className="flex items-end gap-2 h-48">
                {weeklyNets.map((val: number, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-teal-500 min-h-[4px] transition-all hover:bg-teal-600 relative group"
                      style={{ height: `${Math.max((val / maxNet) * 100, 5)}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 whitespace-nowrap">
                        {val}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{DAYS[i] ?? ""}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                En yüksek: <span className="font-bold text-teal-600">{Math.max(...weeklyNets)}</span> ·
                En düşük: <span className="font-bold text-red-500">{Math.min(...weeklyNets)}</span>
              </p>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Henüz veri yok
            </div>
          )}
        </div>

        {/* Hedef analizi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-teal-600" />
            Hedef Analizi
          </h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : goal ? (
            <div className="space-y-3">
              {[
                { label: "Hedef Net", value: `${goal.target_net}`, color: "text-teal-600" },
                { label: "Mevcut Net", value: `${goal.current_net}`, color: "text-slate-900" },
                { label: "Tahmin Edilen Net", value: `${goal.predicted_net}`, color: goal.risk_level === "red" ? "text-red-600" : goal.risk_level === "yellow" ? "text-amber-600" : "text-teal-600" },
                { label: "Kalan Gün", value: `${goal.days_remaining}`, color: "text-slate-900" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
              {/* İlerleme çubuğu */}
              <div className="px-1 pt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Hedefe İlerleme</span>
                  <span>{Math.round((goal.current_net / Math.max(goal.target_net, 1)) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      goal.risk_level === "red" ? "bg-red-400" : goal.risk_level === "yellow" ? "bg-amber-400" : "bg-teal-500"
                    }`}
                    style={{ width: `${Math.min((goal.current_net / Math.max(goal.target_net, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Hedef belirlenmemiş
            </div>
          )}
        </div>
      </div>

      {/* Çalışma serisi */}
      {!loading && stats && (stats.streak_days ?? 0) > 0 && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl">{stats.streak_days ?? 0} Günlük Seri!</h3>
              <p className="text-teal-100 text-sm mt-0.5">
                Kesintisiz çalışıyorsun. Devam et, seriyi kırma!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
