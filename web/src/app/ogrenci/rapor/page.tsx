"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, StudentStatistics, GoalAnalysis, WeakAchievement } from "@/lib/api";
import {
  Clock, FileQuestion, TrendingUp, Zap, BarChart3,
  Target, Brain, AlertTriangle, CheckCircle, ChevronRight,
  Bot, Download, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const PERIOD_OPTIONS = [
  { value: 7, label: "7 Gün" },
  { value: 30, label: "30 Gün" },
  { value: 90, label: "3 Ay" },
];

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
  const router = useRouter();

  const [stats, setStats] = useState<StudentStatistics | null>(null);
  const [goal, setGoal] = useState<GoalAnalysis | null>(null);
  const [weakAchievements, setWeakAchievements] = useState<WeakAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState(7);

  const loadData = useCallback(async () => {
    if (!token) return;
    const [statsRes, goalRes, weakRes] = await Promise.allSettled([
      api.getPlanStats(token),
      api.getGoalAnalysis(token),
      api.getWeakAchievements(token),
    ]);
    if (statsRes.status === "fulfilled") setStats(statsRes.value);
    if (goalRes.status === "fulfilled") setGoal(goalRes.value);
    if (weakRes.status === "fulfilled") setWeakAchievements(weakRes.value.slice(0, 5));
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const weeklyNets = stats?.weekly_nets ?? [];
  const chartNets = weeklyNets.slice(-chartPeriod);
  const chartLabels = chartPeriod === 7
    ? DAYS.slice(-chartNets.length)
    : chartNets.map((_, i) => `G${chartNets.length - i}`).reverse();
  const maxNet = chartNets.length > 0 ? Math.max(...chartNets, 1) : 1;
  const netArtis = weeklyNets.length >= 2 ? weeklyNets[weeklyNets.length - 1] - weeklyNets[0] : 0;
  const tasksDoneRatio = stats ? Math.round((stats.tasks_done_today / Math.max(stats.tasks_total_today, 1)) * 100) : 0;

  const weeksRemaining = goal ? Math.max(Math.floor(goal.days_remaining / 7), 0) : 0;
  const avgWeeklyIncrease = weeklyNets.length >= 2
    ? (weeklyNets[weeklyNets.length - 1] - weeklyNets[0]) / Math.max(weeklyNets.length - 1, 1)
    : 0;
  const predictedNet = goal
    ? Math.min(Math.round(goal.current_net + avgWeeklyIncrease * weeksRemaining), goal.target_net + 20)
    : null;
  const predictionRisk = goal && predictedNet !== null
    ? predictedNet >= goal.target_net ? "green"
    : predictedNet >= goal.target_net * 0.8 ? "yellow" : "red"
    : "green";

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
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
      label: "XP Puanı",
      value: loading ? null : `${(stats?.xp_points ?? 0).toLocaleString("tr")}`,
      sub: loading ? null : `Seviye ${stats?.level ?? 1}`,
    },
  ];

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { window.print(); return; }
    printWindow.document.write(`
      <html><head><title>Performans Raporu</title>
      <style>body{font-family:sans-serif;padding:24px;color:#1e293b}h1{color:#0f766e}table{width:100%;border-collapse:collapse}td,th{padding:8px 12px;border:1px solid #e2e8f0;text-align:left}</style>
      </head><body>
      <h1>Performans Raporu</h1>
      <p>Tarih: ${new Date().toLocaleDateString("tr-TR")}</p>
      <table><tr><th>Metrik</th><th>Değer</th></tr>
      <tr><td>Bu Hafta Çalışma Süresi</td><td>${secondsToHuman(stats?.study_time_weekly_seconds ?? 0)}</td></tr>
      <tr><td>Bugün Tamamlanan Görev</td><td>${stats?.tasks_done_today ?? 0} / ${stats?.tasks_total_today ?? 0}</td></tr>
      <tr><td>XP Puanı</td><td>${stats?.xp_points ?? 0}</td></tr>
      <tr><td>Seviye</td><td>${stats?.level ?? 1}</td></tr>
      <tr><td>Mevcut Net</td><td>${stats?.current_net ?? 0}</td></tr>
      <tr><td>Hedef Net</td><td>${stats?.target_net ?? 0}</td></tr>
      ${goal ? `<tr><td>Kalan Gün</td><td>${goal.days_remaining}</td></tr>` : ""}
      </table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-8 lg:p-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performans Raporu</h1>
          <p className="text-slate-600 mt-1">Çalışma süresi, soru istatistikleri, net artışı ve hedef analizi</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors print:hidden"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => router.push("/ogrenci/koc")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-teal-500/20"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Koça Sor</span>
          </button>
        </div>
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

      {/* Tahmini Sınav Neti Kartı */}
      {!loading && goal && predictedNet !== null && (
        <div className={`mb-8 rounded-2xl p-6 border flex flex-col sm:flex-row sm:items-center gap-6 ${
          predictionRisk === "green" ? "bg-emerald-50 border-emerald-100" :
          predictionRisk === "yellow" ? "bg-amber-50 border-amber-100" :
          "bg-red-50 border-red-100"
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
            predictionRisk === "green" ? "bg-emerald-100" :
            predictionRisk === "yellow" ? "bg-amber-100" : "bg-red-100"
          }`}>
            <Brain className={`w-7 h-7 ${
              predictionRisk === "green" ? "text-emerald-600" :
              predictionRisk === "yellow" ? "text-amber-600" : "text-red-600"
            }`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900">Tahmini Sınav Neti</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                predictionRisk === "green" ? "bg-emerald-100 text-emerald-700" :
                predictionRisk === "yellow" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {predictionRisk === "green" ? "Hedefe Ulaşabilirsin" :
                predictionRisk === "yellow" ? "Dikkat — Sınır Durumda" : "Yüksek Risk"}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Mevcut çalışma hızında <strong>{weeksRemaining} hafta</strong> sonra yaklaşık{" "}
              <strong className={predictionRisk === "red" ? "text-red-600" : "text-slate-900"}>{predictedNet} net</strong>{" "}
              yapabilirsin. Hedefin: <strong>{goal.target_net} net</strong>.
            </p>
            {predictionRisk !== "green" && (
              <p className="text-xs text-slate-500 mt-1">
                Hedefe ulaşmak için haftada <strong>+{goal.weekly_net_needed}</strong> net artışı gerekiyor. Şu an: <strong>{netArtis >= 0 ? "+" : ""}{netArtis}</strong>.
              </p>
            )}
          </div>
          <div className="text-center shrink-0">
            <p className={`text-4xl font-black ${
              predictionRisk === "green" ? "text-emerald-600" :
              predictionRisk === "yellow" ? "text-amber-600" : "text-red-600"
            }`}>{predictedNet}</p>
            <p className="text-xs text-slate-500 mt-0.5">tahmini net</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Net grafiği */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Net Grafiği
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setChartPeriod(opt.value)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    chartPeriod === opt.value
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="flex items-end gap-2 h-48">
              {DAYS.map((d) => <Skeleton key={d} className="flex-1 h-full" />)}
            </div>
          ) : chartNets.length > 0 ? (
            <>
              <div className="flex items-end gap-1 h-48">
                {chartNets.map((val: number, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-lg bg-teal-500 min-h-[4px] transition-all hover:bg-teal-600 relative group"
                      style={{ height: `${Math.max((val / maxNet) * 100, 5)}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 whitespace-nowrap">
                        {val}
                      </span>
                    </div>
                    {chartPeriod === 7 && (
                      <span className="text-xs text-slate-500">{chartLabels[i] ?? ""}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                En yüksek: <span className="font-bold text-teal-600">{Math.max(...chartNets)}</span> ·
                En düşük: <span className="font-bold text-red-500">{Math.min(...chartNets)}</span>
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
                { label: "Tahmin Edilen Net", value: `${predictedNet ?? goal.predicted_net}`, color: predictionRisk === "red" ? "text-red-600" : predictionRisk === "yellow" ? "text-amber-600" : "text-teal-600" },
                { label: "Kalan Gün", value: `${goal.days_remaining}`, color: "text-slate-900" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
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

      {/* Zayıf Kazanımlar */}
      {!loading && weakAchievements.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Zayıf Kazanımlarım
            </h2>
            <Link
              href="/ogrenci/zayif-kazanim"
              className="text-sm font-semibold text-teal-600 hover:underline flex items-center gap-1"
            >
              Tümü <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {weakAchievements.map((wa) => {
              const accuracyColor = wa.accuracy_rate < 40 ? "bg-red-500" : wa.accuracy_rate < 70 ? "bg-amber-500" : "bg-teal-500";
              return (
                <div key={wa.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg shrink-0">
                    {wa.kod}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">{wa.konu}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${accuracyColor}`} style={{ width: `${wa.accuracy_rate}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">%{wa.accuracy_rate}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/ogrenci/soru-bankasi"
            className="mt-4 flex items-center justify-center gap-2 py-2.5 bg-amber-50 border border-amber-100 text-amber-700 font-semibold text-sm rounded-xl hover:bg-amber-100 transition-colors"
          >
            <CheckCircle className="w-4 h-4" /> Zayıf Konuları Çalış
          </Link>
        </div>
      )}

      {/* Çalışma serisi */}
      {!loading && stats && (stats.streak_days ?? 0) > 0 && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-6 text-white mb-8">
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

      {/* Koça Sor Kartı */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">Raporunu Dijital Koçunla Analiz Et</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            İlerleme verilerine dayanarak kişisel öneriler al, zayıf noktaları keşfet.
          </p>
        </div>
        <button
          onClick={() => router.push("/ogrenci/koc")}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-colors shrink-0 shadow-sm"
        >
          Koça Sor
        </button>
      </div>
    </div>
  );
}
