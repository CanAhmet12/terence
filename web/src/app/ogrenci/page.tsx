"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Clock, Target, TrendingUp, AlertTriangle, Zap, BookOpen, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, PlanStats, DailyPlan, PlanTask } from "@/lib/api";
import { PushPermissionBanner } from "@/components/dashboard/PushPermissionBanner";

const WEEK_LABELS = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];

function secondsToHuman(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return h + "s " + m + "dk";
  return m + "dk";
}

export default function StudentDashboardPage() {
  const { user, token } = useAuth();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [planRes, statsRes] = await Promise.allSettled([
        api.getTodayPlan(),
        api.getPlanStats(),
      ]);
      if (planRes.status === "fulfilled") setPlan(planRes.value as DailyPlan);
      if (statsRes.status === "fulfilled") setStats(statsRes.value as PlanStats);
      if (planRes.status === "rejected" && statsRes.status === "rejected") {
        setError("Veriler yuklenemedi. Sayfayi yenileyebilirsiniz.");
      }
    } catch {
      setError("Veriler yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleTask = async (task: PlanTask) => {
    if (task.is_completed || !plan || !token) return;
    setPlan((prev) => prev ? {
      ...prev, completed_tasks: prev.completed_tasks + 1,
      tasks: prev.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: true } : t),
    } : prev);
    try {
      await api.completeTask(task.id);
    } catch {
      setPlan((prev) => prev ? {
        ...prev, completed_tasks: prev.completed_tasks - 1,
        tasks: prev.tasks?.map((t) => t.id === task.id ? { ...t, is_completed: false } : t),
      } : prev);
    }
  };

  const tasks = plan?.tasks ?? [];
  const doneCount = plan?.completed_tasks ?? 0;
  const totalCount = plan?.total_tasks ?? 0;
  const weeklyNets = stats?.weekly_nets ?? [];
  const maxNet = weeklyNets.length > 0 ? Math.max(...weeklyNets, 1) : 1;
  const allDone = totalCount > 0 && doneCount >= totalCount;

  const riskLevel = stats && stats.target_net > 0
    ? (stats.current_net / Math.max(stats.target_net, 1)) >= 0.85 ? "green"
    : (stats.current_net / Math.max(stats.target_net, 1)) >= 0.6 ? "yellow" : "red"
    : "none";

  const riskColors = {
    green: { bg: "bg-teal-50", border: "border-teal-200", title: "text-teal-900", body: "text-teal-800" },
    yellow: { bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-900", body: "text-amber-800" },
    red: { bg: "bg-red-50", border: "border-red-200", title: "text-red-900", body: "text-red-800" },
    none: { bg: "bg-slate-50", border: "border-slate-200", title: "text-slate-700", body: "text-slate-600" },
  };
  const risk = riskColors[riskLevel];

  return (
    <div className="p-6 lg:p-10">
      <PushPermissionBanner token={token} />

      {/* Karşılama bandı */}
      {!loading && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 p-5 text-white shadow-lg shadow-teal-500/25 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-24 w-32 h-32 rounded-full bg-white/5 translate-y-12" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-teal-100 text-sm font-medium mb-0.5">
                {new Date().getHours() < 12 ? "Günaydın" : new Date().getHours() < 18 ? "İyi günler" : "İyi akşamlar"},
              </p>
              <h1 className="text-2xl font-extrabold">
                {user?.name?.split(" ")[0] || "Öğrenci"} 👋
              </h1>
              {user?.goal?.exam_type && (
                <p className="text-teal-100 text-sm mt-1">
                  {user.goal.exam_type} hedefinde
                  {user.goal.target_school ? ` — ${user.goal.target_school}` : ""} başarılar!
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Streak */}
              {(stats?.streak_days ?? 0) > 0 && (
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-sm ${
                  (stats?.streak_days ?? 0) >= 30 ? "bg-purple-500/30" :
                  (stats?.streak_days ?? 0) >= 7 ? "bg-orange-400/30" : "bg-white/20"
                }`}>
                  <span className="text-lg">{(stats?.streak_days ?? 0) >= 30 ? "💜" : (stats?.streak_days ?? 0) >= 7 ? "🔥" : "⚡"}</span>
                  <span>{stats?.streak_days ?? 0} gün seri</span>
                </div>
              )}
              {/* XP */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/20 font-bold text-sm">
                <span className="text-lg">⚡</span>
                <span>{(stats?.xp_points ?? 0).toLocaleString("tr")} XP</span>
              </div>
              {/* Hedef oran */}
              {(stats?.target_net ?? 0) > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/20 font-bold text-sm">
                  <span className="text-lg">🎯</span>
                  <span>%{Math.round(((stats?.current_net ?? 0) / Math.max(stats?.target_net ?? 1, 1)) * 100)} hedefte</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium flex items-center justify-between">
          {error}
          <button onClick={loadData} className="text-red-600 font-semibold hover:underline">Yenile</button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Bugün Çalışma", value: secondsToHuman(stats?.study_time_today_seconds ?? 0), icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "XP Puanı", value: (stats?.xp_points ?? 0).toLocaleString("tr"), icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Mevcut Net", value: stats?.current_net ?? 0, icon: BarChart3, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Seviye", value: "Seviye " + (stats?.level ?? 1), icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            {loading ? (
              <div className="space-y-2"><div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse" /><div className="h-7 bg-slate-100 rounded animate-pulse" /></div>
            ) : (
              <>
                <div className={"w-9 h-9 rounded-xl " + card.bg + " flex items-center justify-center mb-3"}>
                  <card.icon className={"w-5 h-5 " + card.color} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900 text-lg">Bugünün Planı</h2>
            {!loading && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">{doneCount}/{totalCount} tamamlandı</span>
                <Link href="/ogrenci/plan" className="text-sm text-slate-500 hover:text-slate-700">Tümü</Link>
              </div>
            )}
          </div>
          {!loading && totalCount > 0 && (
            <div className="mb-5">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: ((doneCount / totalCount) * 100) + "%" }} />
              </div>
            </div>
          )}
          {allDone && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-emerald-800">Günü tamamladın!</p>
                <p className="text-sm text-emerald-700">Harika iş! Bugünün tüm görevleri bitti.</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Check className="w-10 h-10 text-teal-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Bugün için görev yok</p>
              <Link href="/ogrenci/plan" className="text-sm text-teal-600 mt-2 inline-block hover:underline">Plan ekle</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className={"flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 " + (task.is_completed ? "bg-teal-50/80 border-teal-100" : "bg-slate-50/80 border-slate-100 hover:bg-slate-100/80")} onClick={() => toggleTask(task)}>
                  <div className={"w-7 h-7 rounded-lg flex items-center justify-center shrink-0 " + (task.is_completed ? "bg-teal-500 text-white" : "bg-slate-200")}>
                    {task.is_completed && <Check className="w-4 h-4" strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={"font-medium text-sm " + (task.is_completed ? "text-slate-400 line-through" : "text-slate-900")}>{task.title}</span>
                    {task.subject && <span className="ml-2 text-xs text-slate-400">{task.subject}</span>}
                    {task.is_ai_suggested && <span className="ml-2 text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">AI</span>}
                  </div>
                  <span className={"text-xs px-2 py-1 rounded-lg font-medium shrink-0 " + (task.type === "video" ? "bg-blue-50 text-blue-600" : task.type === "exam" ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-500")}>
                    {task.type === "video" ? "Video" : task.type === "exam" ? "Deneme" : "Soru"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-teal-600" /> Hedefim</h2>
            {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"/>)}</div> : (
              <div className="space-y-3">
                {/* Sınav türü ve sınıf */}
                {(user?.goal?.exam_type || user?.goal?.grade) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {user?.goal?.exam_type && (
                      <span className="px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-lg">{user.goal.exam_type}</span>
                    )}
                    {user?.goal?.grade && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">{user.goal.grade}. Sınıf</span>
                    )}
                  </div>
                )}
                {/* Net ilerleme */}
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <p className="text-xs text-slate-500">Mevcut / Hedef Net</p>
                  <p className="text-xl font-bold text-teal-700">{stats?.current_net ?? 0} / {stats?.target_net ?? user?.goal?.target_net ?? "?"}</p>
                </div>
                {(stats?.target_net || user?.goal?.target_net) && (
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: Math.min(((stats?.current_net ?? 0) / Math.max(stats?.target_net ?? user?.goal?.target_net ?? 1, 1)) * 100, 100) + "%" }} />
                  </div>
                )}
                {/* Hedef okul */}
                {user?.goal?.target_school && (
                  <p className="text-xs text-slate-600 font-medium truncate">🎯 {user.goal.target_school}{user?.goal?.target_department ? " — " + user.goal.target_department : ""}</p>
                )}
              </div>
            )}
            <Link href="/ogrenci/profil?tab=hedef" className="mt-4 block text-center py-2.5 bg-teal-50 text-teal-700 font-semibold text-sm rounded-xl hover:bg-teal-100 transition-colors">Hedefi Güncelle</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">Hızlı Başla</h2>
            <div className="space-y-2">
              {[
                { href: "/ogrenci/soru-bankasi", label: "Soru Çöz", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
                { href: "/ogrenci/deneme", label: "Deneme Sınavı", icon: Target, color: "text-purple-600 bg-purple-50" },
                { href: "/ogrenci/dersler", label: "Ders İzle", icon: TrendingUp, color: "text-teal-600 bg-teal-50" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + item.color}><item.icon className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Risk kartı + haftalık net */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className={"p-5 rounded-2xl border " + risk.bg + " " + risk.border}>
          <div className="flex items-center gap-2 mb-1">
            {riskLevel === "none" ? <Target className={"w-4 h-4 " + risk.title} /> :
             riskLevel !== "green" ? <AlertTriangle className={"w-4 h-4 " + risk.title} /> :
             <Check className="w-4 h-4 text-teal-700" />}
            <p className={"font-bold " + risk.title}>
              {riskLevel === "none" ? "Hedef Belirlemek İster misin?" :
               riskLevel === "green" ? "Hedefte İlerliyorsun" :
               riskLevel === "yellow" ? "Orta Hedef Riski" : "Yüksek Hedef Riski"}
            </p>
          </div>
          <p className={"text-sm mt-1 leading-relaxed " + risk.body}>
            {riskLevel === "none" ? "Hedef okulunu ve net hedefini girerek günlük planını otomatik oluştur." :
             riskLevel === "green" ? "Bu hızı korursan hedefine ulaşırsın!" :
             "Net hızını artırman gerekiyor. Zayıf konularına odaklan."}
          </p>
          <Link
            href={riskLevel === "none" ? "/ogrenci/hedef" : "/ogrenci/zayif-kazanim"}
            className={"text-sm font-semibold mt-3 inline-flex items-center gap-1 hover:underline " + risk.title}
          >
            {riskLevel === "none" ? "Hedef belirle →" : "Zayıf kazanımları gör"}
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Haftalık Net Trendi</h3>
            <Link href="/ogrenci/rapor" className="text-xs text-teal-600 hover:underline">Detay</Link>
          </div>
          {loading ? (
            <div className="flex items-end gap-1 h-20">{[1,2,3,4,5,6,7].map(i => <div key={i} className="flex-1 bg-slate-100 rounded-t animate-pulse" style={{height:(30+i*8)+"%"}}/>)}</div>
          ) : weeklyNets.length > 0 ? (
            <div className="flex items-end gap-1 h-20">
              {weeklyNets.slice(0, 7).map((val: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-gradient-to-t from-teal-600 to-teal-400 min-h-[4px]" style={{ height: ((val / maxNet) * 100) + "%" }} title={val + " net"} />
                  <span className="text-[9px] text-slate-400">{WEEK_LABELS[i]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6"><p className="text-xs text-slate-400">Deneme çözdükçe burada görünür</p></div>
          )}
        </div>
      </div>

      {/* Paket Yükseltme Önerisi — Risk kırmızı ve free plan'daysa göster */}
      {!loading && riskLevel === "red" && (!user?.subscription_plan || user.subscription_plan === "free") && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-lg">Hedefine ulaşmak için destek al!</p>
              <p className="text-teal-100 text-sm mt-1">
                Bronze veya üstü pakete geçen öğrencilerin net artış ihtimali %43 daha yüksek.
                Kişisel koçluk, özel soru paketleri ve öncelikli öğretmen desteğine eriş.
              </p>
            </div>
            <Link
              href="/paketler"
              className="shrink-0 px-4 py-2.5 bg-white text-teal-700 font-bold text-sm rounded-xl hover:bg-teal-50 transition-colors whitespace-nowrap"
            >
              Paketleri İncele →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
