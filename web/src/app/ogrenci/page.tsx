"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, PlanStats, DailyPlan, PlanTask } from "@/lib/api";
import { PushPermissionBanner } from "@/components/dashboard/PushPermissionBanner";
import {
  Target, Calendar, Zap, TrendingUp, BookOpen, FileQuestion,
  Library, BarChart3, Trophy, Bot, CheckCircle2, Circle,
  Flame, Star, ArrowRight, ChevronRight, Loader2, AlertCircle,
  Clock, Video, RefreshCw, Sparkles
} from "lucide-react";

// ─── Yardımcı bileşenler ─────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bgColor,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bgColor: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
        </div>
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-4 w-24" />
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

// Hızlı erişim linkleri
const QUICK_LINKS = [
  { href: "/ogrenci/soru-bankasi", icon: Library, label: "Soru Bankası", color: "text-indigo-600", bg: "bg-indigo-50" },
  { href: "/ogrenci/deneme", icon: FileQuestion, label: "Deneme Başlat", color: "text-violet-600", bg: "bg-violet-50" },
  { href: "/ogrenci/video", icon: Video, label: "Video İzle", color: "text-rose-600", bg: "bg-rose-50" },
  { href: "/ogrenci/koc", icon: Bot, label: "Koça Sor", color: "text-teal-600", bg: "bg-teal-50" },
  { href: "/ogrenci/rapor", icon: BarChart3, label: "Raporlarım", color: "text-amber-600", bg: "bg-amber-50" },
  { href: "/ogrenci/rozet", icon: Trophy, label: "Rozetlerim", color: "text-yellow-600", bg: "bg-yellow-50" },
];

const TASK_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  matematik:     { border: "border-indigo-400", bg: "bg-indigo-50", text: "text-indigo-700" },
  turkce:        { border: "border-rose-400",   bg: "bg-rose-50",   text: "text-rose-700" },
  fizik:         { border: "border-violet-400", bg: "bg-violet-50", text: "text-violet-700" },
  kimya:         { border: "border-amber-400",  bg: "bg-amber-50",  text: "text-amber-700" },
  biyoloji:      { border: "border-emerald-400",bg: "bg-emerald-50",text: "text-emerald-700" },
  question:      { border: "border-indigo-400", bg: "bg-indigo-50", text: "text-indigo-700" },
  video:         { border: "border-rose-400",   bg: "bg-rose-50",   text: "text-rose-700" },
  read:          { border: "border-teal-400",   bg: "bg-teal-50",   text: "text-teal-700" },
  exam:          { border: "border-violet-400", bg: "bg-violet-50", text: "text-violet-700" },
  custom:        { border: "border-slate-300",  bg: "bg-slate-50",  text: "text-slate-600" },
};

function getTaskColor(task: PlanTask) {
  const key = (task.subject ?? task.type ?? "custom").toLowerCase();
  for (const [k, v] of Object.entries(TASK_COLORS)) {
    if (key.includes(k)) return v;
  }
  return TASK_COLORS.custom;
}

// Selamlama mesajı
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return "Gece geç saate kadar";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  if (h < 22) return "İyi akşamlar";
  return "Gece çalışması";
}

// ─── Ana sayfa ───────────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, statsRes] = await Promise.allSettled([
        api.getTodayPlan(),
        api.getPlanStats(),
      ]);
      if (planRes.status === "fulfilled") setPlan(planRes.value as DailyPlan);
      if (statsRes.status === "fulfilled") setStats(statsRes.value as PlanStats);
      if (planRes.status === "rejected" && statsRes.status === "rejected") {
        setError("Veriler yüklenemedi.");
      }
    } catch {
      setError("Beklenmedik bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleTask = async (task: PlanTask) => {
    if (task.is_completed || !plan) return;
    setPlan((prev) => prev ? {
      ...prev,
      completed_tasks: (prev.completed_tasks ?? 0) + 1,
      tasks: prev.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: true } : t),
    } : prev);
    try {
      await api.completeTask(task.id);
    } catch {
      setPlan((prev) => prev ? {
        ...prev,
        completed_tasks: Math.max((prev.completed_tasks ?? 1) - 1, 0),
        tasks: prev.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: false } : t),
      } : prev);
    }
  };

  const tasks = plan?.tasks ?? [];
  const doneCount = plan?.completed_tasks ?? 0;
  const totalCount = plan?.total_tasks ?? 0;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const xp = user?.xp_points ?? stats?.xp_points ?? 0;
  const streak = user?.streak_days ?? stats?.streak_days ?? 0;
  const level = user?.level ?? stats?.level ?? 1;
  const currentNet = user?.current_net ?? (stats as Record<string, unknown>)?.current_net ?? 0;
  const targetNet = user?.target_net ?? (stats as Record<string, unknown>)?.target_net ?? 0;

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full px-6 py-8 space-y-8">

        {/* ── Push Banner ── */}
        <PushPermissionBanner />

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-xl shadow-indigo-500/25">
          {/* Dekoratif daireler */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-20 bottom-0 w-32 h-32 bg-violet-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute left-1/2 top-0 w-64 h-1 bg-white/10 rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Sol: Selamlama */}
            <div className="flex-1">
              <p className="text-indigo-200 text-sm font-medium capitalize">{getGreeting()},</p>
              <h1 className="text-2xl lg:text-3xl font-black mt-1 leading-tight">
                {user?.name?.split(" ")[0] ?? "Öğrenci"} 👋
              </h1>
              <p className="text-indigo-200 text-sm mt-2 font-medium capitalize">{today}</p>

              {/* Hedef bilgisi */}
              {user?.target_exam && (
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold">
                    <Target className="w-3.5 h-3.5" />
                    {user.target_exam} Hedefi
                  </div>
                  {targetNet > 0 && (
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {currentNet} / {targetNet} net
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sağ: XP + Streak + Seviye */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Ateş / Streak */}
              <div className="text-center">
                <div className="text-4xl font-black leading-none">
                  {streak > 0 ? "🔥" : "⭐"}
                </div>
                <p className="text-white font-black text-xl mt-1 leading-none">{streak}</p>
                <p className="text-indigo-200 text-[11px] font-medium mt-0.5">gün seri</p>
              </div>

              <div className="w-px h-14 bg-white/20" />

              {/* XP / Seviye */}
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto">
                  <span className="text-2xl font-black text-white">{level}</span>
                </div>
                <p className="text-indigo-200 text-[11px] font-medium mt-1.5">Seviye</p>
                <p className="text-white text-xs font-bold">{xp.toLocaleString("tr")} XP</p>
              </div>

              <div className="w-px h-14 bg-white/20 hidden sm:block" />

              {/* Bugün Görev */}
              <div className="text-center hidden sm:block">
                <div className="text-4xl font-black leading-none">
                  {progress === 100 ? "✅" : progress > 0 ? "📚" : "📋"}
                </div>
                <p className="text-white font-black text-xl mt-1 leading-none">{doneCount}/{totalCount}</p>
                <p className="text-indigo-200 text-[11px] font-medium mt-0.5">görev bugün</p>
              </div>
            </div>
          </div>

          {/* Genel ilerleme çubuğu */}
          {totalCount > 0 && (
            <div className="relative z-10 mt-5">
              <div className="flex items-center justify-between text-xs text-indigo-200 mb-1.5">
                <span>Bugünkü ilerleme</span>
                <span className="font-bold text-white">%{progress}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── İstatistik Kartları ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Flame}
            label="Günlük Seri"
            value={streak > 0 ? `${streak} Gün` : "Başlat!"}
            sub="Kesintisiz çalışma"
            color="text-orange-500"
            bgColor="bg-orange-50"
            loading={loading}
          />
          <StatCard
            icon={Star}
            label="XP Puanı"
            value={xp.toLocaleString("tr")}
            sub={`Seviye ${level}`}
            color="text-amber-500"
            bgColor="bg-amber-50"
            loading={loading}
          />
          <StatCard
            icon={CheckCircle2}
            label="Bugün Tamamlanan"
            value={`${doneCount} / ${totalCount}`}
            sub={totalCount > 0 ? `%${progress} ilerleme` : "Plan yok"}
            color="text-emerald-500"
            bgColor="bg-emerald-50"
            loading={loading}
          />
          <StatCard
            icon={TrendingUp}
            label="Mevcut Net"
            value={currentNet > 0 ? `${currentNet}` : "—"}
            sub={targetNet > 0 ? `Hedef: ${targetNet}` : "Hedef belirlenmedi"}
            color="text-indigo-500"
            bgColor="bg-indigo-50"
            loading={loading}
          />
        </div>

        {/* ── Ana Grid: Plan + Sağ panel ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ─ Bugünün Planı (2 kolon) ─ */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Başlık */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Bugünün Planı</h2>
                    {!loading && totalCount > 0 && (
                      <p className="text-xs text-slate-500">{doneCount}/{totalCount} görev tamamlandı</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <Link
                    href="/ogrenci/plan"
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Tümünü Gör
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Progress bar */}
              {!loading && totalCount > 0 && (
                <div className="px-6 pt-4">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Görev listesi */}
              <div className="px-4 py-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="h-5 flex-1" />
                        <Skeleton className="w-16 h-5 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-semibold text-slate-700">Bugün için plan yok</p>
                    <p className="text-sm text-slate-500 mt-1">Görev ekleyerek çalışmana başla</p>
                    <Link
                      href="/ogrenci/plan"
                      className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Plan Oluştur
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.slice(0, 6).map((task) => {
                      const tc = getTaskColor(task);
                      return (
                        <button
                          key={task.id}
                          onClick={() => toggleTask(task)}
                          disabled={task.is_completed}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-l-[3px] transition-all group text-left
                            ${task.is_completed
                              ? "bg-slate-50 border-slate-200 opacity-60"
                              : `${tc.bg} ${tc.border} hover:shadow-sm`
                            }`}
                        >
                          {/* Checkbox */}
                          <div className="shrink-0">
                            {task.is_completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className={`w-5 h-5 ${tc.text} opacity-60 group-hover:opacity-100 transition-opacity`} />
                            )}
                          </div>

                          {/* İçerik */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${task.is_completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                              {task.title}
                            </p>
                            {task.subject && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">{task.subject}</p>
                            )}
                          </div>

                          {/* Süre */}
                          {task.duration_minutes && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs text-slate-400 font-medium">{task.duration_minutes}dk</span>
                            </div>
                          )}

                          {/* Tamamla */}
                          {!task.is_completed && (
                            <div className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg text-[11px] font-bold ${tc.bg} ${tc.text} border border-current/20`}>
                              Tamamla
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {tasks.length > 6 && (
                      <Link
                        href="/ogrenci/plan"
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 text-sm font-medium transition-all"
                      >
                        +{tasks.length - 6} görev daha
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─ Sağ Panel ─ */}
          <div className="space-y-5">

            {/* Hedef Özeti */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-violet-600" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-slate-900">Hedefim</h3>
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ) : user?.target_exam ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-lg">
                      {user.target_exam}
                    </span>
                    {user.target_school && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg truncate max-w-[140px]">
                        {user.target_school}
                      </span>
                    )}
                  </div>

                  {targetNet > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Net İlerlemesi</span>
                        <span className="font-bold text-slate-700">{currentNet} / {targetNet}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min((Number(currentNet) / Number(targetNet)) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Hedefe {Math.max(Number(targetNet) - Number(currentNet), 0)} net kaldı
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/ogrenci/hedef"
                  className="flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Hedef Belirle
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              )}

              <Link
                href="/ogrenci/hedef"
                className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Hedefi Güncelle
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hızlı Erişim */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-500" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-slate-900">Hızlı Başla</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${link.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <link.icon className={`w-4.5 h-4.5 ${link.color}`} strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900 text-center leading-tight">
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Öğrenmeye devam */}
            <Link
              href="/ogrenci/dersler"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-200 transition-colors">
                <BookOpen className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-teal-800 text-sm">Derslerime Git</p>
                <p className="text-xs text-teal-600 truncate">Kaldığın yerden devam et</p>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>
          </div>
        </div>

        {/* ── Risk Uyarısı (varsa) ── */}
        {!loading && user?.target_exam && targetNet > 0 && Number(currentNet) < Number(targetNet) * 0.6 && (
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800">Dikkat: Hedefine uzaksın!</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Mevcut net ({currentNet}) hedefinin ({targetNet}) altında. Çalışma planını düzenlemeni ve zayıf konulara odaklanmanı öneririz.
              </p>
            </div>
            <Link
              href="/ogrenci/rapor"
              className="shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors"
            >
              Analiz Et
            </Link>
          </div>
        )}

        {/* ── Haftalık Net Trendi ── */}
        {!loading && stats && Array.isArray((stats as Record<string, unknown>).weekly_nets) && ((stats as Record<string, unknown>).weekly_nets as number[]).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Haftalık Net Trendi</h3>
                  <p className="text-xs text-slate-500">Son 7 gün</p>
                </div>
              </div>
              <Link href="/ogrenci/rapor" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Detaylı Rapor <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <WeeklyNetChart nets={((stats as Record<string, unknown>).weekly_nets as number[])} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mini sparkline chart ─────────────────────────────────────────────────────
function WeeklyNetChart({ nets }: { nets: number[] }) {
  const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const safeNets = Array.isArray(nets) ? nets.slice(-7) : [];
  const maxNet = Math.max(...safeNets, 1);

  return (
    <div className="flex items-end gap-2 h-28">
      {safeNets.map((val, i) => {
        const heightPct = Math.max((val / maxNet) * 100, 4);
        const isLast = i === safeNets.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">{val}</span>
            <div className="w-full flex items-end" style={{ height: "80px" }}>
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ${
                  isLast
                    ? "bg-gradient-to-t from-indigo-500 to-violet-500"
                    : "bg-gradient-to-t from-indigo-200 to-indigo-300"
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {DAYS[i] ?? ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
