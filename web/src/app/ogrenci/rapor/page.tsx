"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, StudentStatistics, GoalAnalysis, WeakAchievement } from "@/lib/api";
import {
  Clock, FileQuestion, TrendingUp, Zap, BarChart3, Target,
  Brain, AlertTriangle, CheckCircle, Bot, Download, RefreshCw,
  ChevronRight, ArrowUp, ArrowDown, Minus, Award
} from "lucide-react";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const PERIOD_OPTIONS = [
  { value: 7,  label: "7 Gün" },
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

// KPI Kart
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendValue,
  color,
  bg,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  color: string;
  bg: string;
  loading?: boolean;
}) {
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-slate-400";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
        </div>
        {trend && trendValue && !loading && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trendValue}
          </div>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-32" />
        </>
      ) : (
        <>
          <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
          <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  );
}

// Tahmin risk rengi
function getRiskStyle(risk: string | undefined) {
  if (risk === "red") return { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-100 text-red-700", icon: "text-red-600", label: "Yüksek Risk" };
  if (risk === "yellow") return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-700", icon: "text-amber-600", label: "Dikkat Gerekiyor" };
  return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700", icon: "text-emerald-600", label: "Hedefe Ulaşabilirsin" };
}

export default function RaporPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStatistics | null>(null);
  const [goal, setGoal] = useState<GoalAnalysis | null>(null);
  const [weakAchievements, setWeakAchievements] = useState<WeakAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState(7);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [statsRes, goalRes, weakRes] = await Promise.allSettled([
      api.getPlanStats(),
      api.getGoalAnalysis(),
      api.getWeakAchievements(),
    ]);
    if (statsRes.status === "fulfilled") setStats(statsRes.value as StudentStatistics);
    if (goalRes.status === "fulfilled") setGoal(goalRes.value as GoalAnalysis);
    if (weakRes.status === "fulfilled") {
      const wa = Array.isArray(weakRes.value) ? weakRes.value : [];
      setWeakAchievements((wa as WeakAchievement[]).slice(0, 5));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Grafik verileri
  const rawNets = Array.isArray((stats as Record<string, unknown>)?.weekly_nets)
    ? (stats as Record<string, unknown>).weekly_nets as number[]
    : [];
  const weeklyNets = rawNets;
  const chartNets = weeklyNets.slice(-chartPeriod);
  const maxNet = chartNets.length > 0 ? Math.max(...chartNets, 1) : 1;
  const netArts = weeklyNets.length >= 2 ? weeklyNets[weeklyNets.length - 1] - weeklyNets[0] : 0;

  const tasksDoneRatio = stats
    ? Math.round(((stats.tasks_done_today ?? 0) / Math.max(stats.tasks_total_today ?? 1, 1)) * 100)
    : 0;

  // Tahmin hesabı
  const weeksRemaining = goal ? Math.max(Math.floor((goal.days_remaining ?? 0) / 7), 0) : 0;
  const avgWeeklyIncrease = weeklyNets.length >= 2
    ? (weeklyNets[weeklyNets.length - 1] - weeklyNets[0]) / Math.max(weeklyNets.length - 1, 1)
    : 0;
  const predictedNet = goal
    ? Math.min(Math.round((goal.current_net ?? 0) + avgWeeklyIncrease * weeksRemaining), (goal.target_net ?? 0) + 20)
    : null;

  const riskLevel = goal
    ? predictedNet !== null && predictedNet >= (goal.target_net ?? 0) ? "green"
    : predictedNet !== null && predictedNet >= (goal.target_net ?? 0) * 0.8 ? "yellow"
    : "red"
    : "green";

  const riskStyle = getRiskStyle(riskLevel);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 print:px-0 print:py-4">

        {/* ── Başlık ── */}
        <div className="flex items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Performans Raporu</h1>
            <p className="text-slate-500 mt-1 font-medium">Çalışma süresi, soru istatistikleri ve hedef analizi</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <Link
              href="/ogrenci/koc"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/25"
            >
              <Bot className="w-4 h-4" />
              Koça Sor
            </Link>
          </div>
        </div>

        {/* ── KPI Kartları ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Clock}
            label="Bu Hafta Çalışma"
            value={loading ? "—" : secondsToHuman(stats?.study_time_weekly_seconds ?? 0)}
            sub={`Bugün: ${loading ? "—" : secondsToHuman(stats?.study_time_today_seconds ?? 0)}`}
            color="text-teal-600"
            bg="bg-teal-50"
            loading={loading}
          />
          <KpiCard
            icon={FileQuestion}
            label="Bugünkü Görevler"
            value={loading ? "—" : `${stats?.tasks_done_today ?? 0}/${stats?.tasks_total_today ?? 0}`}
            sub={`%${tasksDoneRatio} tamamlandı`}
            color="text-indigo-600"
            bg="bg-indigo-50"
            loading={loading}
          />
          <KpiCard
            icon={TrendingUp}
            label="Net Artışı (Hafta)"
            value={loading ? "—" : (netArts >= 0 ? `+${netArts}` : `${netArts}`)}
            sub={`Hedef: +${goal?.weekly_net_needed ?? "—"}/hafta`}
            trend={netArts > 0 ? "up" : netArts < 0 ? "down" : "flat"}
            trendValue={Math.abs(netArts).toString()}
            color="text-violet-600"
            bg="bg-violet-50"
            loading={loading}
          />
          <KpiCard
            icon={Zap}
            label="XP Puanı"
            value={loading ? "—" : (stats?.xp_points ?? 0).toLocaleString("tr")}
            sub={`Seviye ${stats?.level ?? 1}`}
            color="text-amber-600"
            bg="bg-amber-50"
            loading={loading}
          />
        </div>

        {/* ── Tahmin Bandı ── */}
        {!loading && goal && predictedNet !== null && (
          <div className={`flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-2xl border ${riskStyle.bg} ${riskStyle.border}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${riskStyle.bg} border ${riskStyle.border}`}>
              <Brain className={`w-7 h-7 ${riskStyle.icon}`} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold ${riskStyle.text}`}>Tahmini Sınav Neti</h3>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${riskStyle.badge}`}>
                  {riskStyle.label}
                </span>
              </div>
              <p className={`text-sm ${riskStyle.text} opacity-80`}>
                Mevcut çalışma hızında <strong>{weeksRemaining} hafta</strong> sonra yaklaşık{" "}
                <strong>{predictedNet} net</strong> yapabilirsin.{" "}
                Hedefin: <strong>{goal.target_net} net</strong>
              </p>
              {riskLevel !== "green" && (
                <p className={`text-xs mt-1 ${riskStyle.text} opacity-60`}>
                  Hedefe ulaşmak için haftada +{goal.weekly_net_needed ?? "—"} net artışı gerekiyor.
                </p>
              )}
            </div>
            <div className="text-center shrink-0">
              <p className={`text-5xl font-black ${riskStyle.icon}`}>{predictedNet}</p>
              <p className={`text-xs mt-1 ${riskStyle.text} opacity-60`}>tahmini net</p>
            </div>
          </div>
        )}

        {/* ── Grafik + Hedef Analizi ── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Net Grafiği */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-bold text-slate-900">Net Grafiği</h2>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setChartPeriod(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      chartPeriod === opt.value
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-end gap-2 h-44">
                {DAYS.map((d) => <Skeleton key={d} className="flex-1 h-full" />)}
              </div>
            ) : chartNets.length > 0 ? (
              <>
                <div className="flex items-end gap-1.5 h-44">
                  {chartNets.map((val, i) => {
                    const heightPct = Math.max((val / maxNet) * 100, 4);
                    const isLast = i === chartNets.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-700 relative cursor-default ${
                            isLast
                              ? "bg-gradient-to-t from-indigo-500 to-violet-500"
                              : "bg-gradient-to-t from-indigo-200 to-indigo-300"
                          }`}
                          style={{ height: `${heightPct}%` }}
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {val}
                          </div>
                        </div>
                        {chartPeriod === 7 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {DAYS[i] ?? ""}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {chartNets.length > 0 && (
                  <div className="flex justify-between mt-3 text-xs text-slate-400 font-medium">
                    <span>En düşük: <span className="font-bold text-red-500">{Math.min(...chartNets)}</span></span>
                    <span>En yüksek: <span className="font-bold text-emerald-600">{Math.max(...chartNets)}</span></span>
                    <span>Ortalama: <span className="font-bold text-indigo-600">{Math.round(chartNets.reduce((a, b) => a + b, 0) / chartNets.length)}</span></span>
                  </div>
                )}
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Henüz veri yok</p>
              </div>
            )}
          </div>

          {/* Hedef Analizi */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="font-bold text-slate-900">Hedef Analizi</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : goal ? (
              <div className="space-y-3">
                {[
                  { label: "Hedef Net", value: `${goal.target_net ?? "—"}`, color: "text-violet-600" },
                  { label: "Mevcut Net", value: `${goal.current_net ?? "—"}`, color: "text-slate-900" },
                  { label: "Tahmini Net", value: `${predictedNet ?? "—"}`, color: riskLevel === "red" ? "text-red-600" : riskLevel === "yellow" ? "text-amber-600" : "text-emerald-600" },
                  { label: "Kalan Gün", value: `${goal.days_remaining ?? "—"}`, color: "text-slate-900" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-sm text-slate-500 font-medium">{label}</span>
                    <span className={`text-base font-black ${color}`}>{value}</span>
                  </div>
                ))}
                <div className="px-1 pt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Hedefe İlerleme</span>
                    <span className="font-bold">
                      %{Math.round(((goal.current_net ?? 0) / Math.max(goal.target_net ?? 1, 1)) * 100)}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        riskLevel === "red" ? "bg-red-400"
                        : riskLevel === "yellow" ? "bg-amber-400"
                        : "bg-gradient-to-r from-violet-500 to-indigo-500"
                      }`}
                      style={{ width: `${Math.min(((goal.current_net ?? 0) / Math.max(goal.target_net ?? 1, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Henüz hedef belirlenmemiş</p>
                <Link
                  href="/ogrenci/hedef"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Hedef Belirle
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Zayıf Kazanımlar ── */}
        {!loading && weakAchievements.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Zayıf Kazanımlarım</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Acil çalışma gerektiren konular</p>
                </div>
              </div>
              <Link
                href="/ogrenci/zayif-kazanim"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Tümünü Gör <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {weakAchievements.map((wa) => {
                const pct = wa.accuracy_rate;
                const barColor = pct < 40 ? "bg-red-500" : pct < 70 ? "bg-amber-500" : "bg-teal-500";
                return (
                  <div key={wa.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg shrink-0">
                      {wa.kod}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-700 truncate">{wa.konu}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-10 text-right">%{pct}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href="/ogrenci/soru-bankasi"
              className="mt-4 flex items-center justify-center gap-2 py-3 bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-sm rounded-xl hover:bg-amber-100 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Zayıf Konuları Çalış
            </Link>
          </div>
        )}

        {/* ── Streak + Koç CTA ── */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Streak */}
          {!loading && (stats?.streak_days ?? 0) > 0 && (
            <div className="flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl shrink-0">
                🔥
              </div>
              <div>
                <p className="text-2xl font-black text-orange-700">{stats?.streak_days} Günlük Seri!</p>
                <p className="text-sm text-orange-600 mt-0.5">Kesintisiz çalışıyorsun. Devam et!</p>
              </div>
            </div>
          )}

          {/* Koç CTA */}
          <Link
            href="/ogrenci/koc"
            className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25 group-hover:bg-indigo-700 transition-colors">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-indigo-800">Raporu Koçuna Analiz Ettir</p>
              <p className="text-sm text-indigo-600 mt-0.5">Kişisel öneriler ve strateji için</p>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        </div>
      </div>

      {/* ── Print Stilleri ── */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          .bg-slate-50 { background: white !important; }
        }
      `}</style>
    </div>
  );
}
