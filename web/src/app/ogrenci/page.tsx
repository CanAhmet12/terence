"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Clock, Target, TrendingUp, AlertTriangle, Zap, BookOpen, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, PlanStats, DailyPlan, PlanTask } from "@/lib/api";

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
        api.getTodayPlan(token),
        api.getPlanStats(token),
      ]);
      if (planRes.status === "fulfilled") setPlan(planRes.value);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
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
      await api.completeTask(token, task.id);
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
          Merhaba, {user?.name?.split(" ")[0] || "Ogrenci"} wave
        </h1>
        <p className="text-slate-600 mt-1 text-lg">Bugunki hedeflerini takip et</p>
      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium flex items-center justify-between">
          {error}
          <button onClick={loadData} className="text-red-600 font-semibold hover:underline">Yenile</button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Bugun Calisma", value: secondsToHuman(stats?.study_time_today_seconds ?? 0), icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "XP Puani", value: (stats?.xp_points ?? 0).toLocaleString("tr"), icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
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
            <h2 className="font-bold text-slate-900 text-lg">Bugunun Plani</h2>
            {!loading && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">{doneCount}/{totalCount} tamamlandi</span>
                <Link href="/ogrenci/plan" className="text-sm text-slate-500 hover:text-slate-700">Tumu</Link>
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
              <span className="text-2xl">wave</span>
              <div>
                <p className="font-bold text-emerald-800">Gunu tamamladin!</p>
                <p className="text-sm text-emerald-700">Harika is! Bugunun tum gorevleri bitti.</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Check className="w-10 h-10 text-teal-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Bugun icin gorev yok</p>
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
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-teal-600" /> Hedef</h2>
            {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"/>)}</div> : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <p className="text-xs text-slate-500">Mevcut / Hedef Net</p>
                  <p className="text-xl font-bold text-teal-700">{stats?.current_net ?? 0} / {stats?.target_net ?? "?"}</p>
                </div>
                {stats?.target_net && stats.target_net > 0 && (
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: Math.min((stats.current_net / stats.target_net) * 100, 100) + "%" }} />
                  </div>
                )}
                <p className="text-xs text-slate-500">{user?.goal?.exam_type ?? "TYT"} hedefi{user?.goal?.target_school ? " - " + user.goal.target_school : ""}</p>
              </div>
            )}
            <Link href="/ogrenci/hedef" className="mt-4 block text-center py-2.5 bg-teal-50 text-teal-700 font-semibold text-sm rounded-xl hover:bg-teal-100 transition-colors">Hedef Duzenle</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">Hizli Basla</h2>
            <div className="space-y-2">
              {[
                { href: "/ogrenci/soru-bankasi", label: "Soru Coz", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
                { href: "/ogrenci/deneme", label: "Deneme Sinavi", icon: Target, color: "text-purple-600 bg-purple-50" },
                { href: "/ogrenci/dersler", label: "Ders Izle", icon: TrendingUp, color: "text-teal-600 bg-teal-50" },
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
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className={"p-5 rounded-2xl border " + risk.bg + " " + risk.border}>
          <div className="flex items-center gap-2 mb-1">
            {riskLevel !== "green" ? <AlertTriangle className={"w-4 h-4 " + risk.title} /> : <Check className="w-4 h-4 text-teal-700" />}
            <p className={"font-bold " + risk.title}>{riskLevel === "green" ? "Hedefte Ilerliyorsun" : riskLevel === "yellow" ? "Orta Hedef Riski" : "Yuksek Hedef Riski"}</p>
          </div>
          <p className={"text-sm mt-1 leading-relaxed " + risk.body}>{riskLevel === "green" ? "Bu hizi korursan hedefine ulasirsin!" : "Net hizini artirman gerekiyor. Zayif konularina odaklan."}</p>
          <Link href="/ogrenci/zayif-kazanim" className={"text-sm font-semibold mt-3 inline-flex items-center gap-1 hover:underline " + risk.title}>Zayif kazanimlari gor</Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Haftalik Net Trendi</h3>
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
            <div className="text-center py-6"><p className="text-xs text-slate-400">Deneme cozdukce burada gorunur</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
