"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, ChildReport } from "@/lib/api";
import { TrendingUp, Clock, BookOpen, AlertCircle, BarChart3, Download } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function secondsToHuman(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

const WEEKS = ["1. Hft", "2. Hft", "3. Hft", "4. Hft", "5. Hft", "6. Hft", "7. Hft"];

export default function VeliRaporPage() {
  const { token } = useAuth();

  const [report, setReport] = useState<ChildReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await api.getChildReport();
      setReport(res as ChildReport);
    } catch (e) {
      setError((e as Error).message || "Rapor yüklenemedi");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const childName = report?.child.name ?? "Çocuğunuz";
  const rawNets = report?.weekly_nets
  const nets = Array.isArray(rawNets) ? rawNets : []
  const maxNet = nets.length > 0 ? Math.max(...nets, 1) : 1;
  const rawSubjects = report?.subject_analysis
  const subjects = Array.isArray(rawSubjects) ? rawSubjects : [];

  const weeklyChange = nets.length >= 2 ? nets[nets.length - 1] - nets[0] : 0;
  const studyTimeStr = secondsToHuman(report?.study_time_weekly_seconds ?? 0);
  const tasksDoneThisWeek = report?.tasks_done_this_week ?? 0;
  const currentNet = report?.current_net ?? 0;
  const targetNet = report?.target_net ?? 0;
  const isRisk = targetNet > 0 && currentNet < targetNet * 0.8;

  type RecentExam = { title?: string; exam_type?: string; net_score?: number; finished_at?: string; correct_count?: number; wrong_count?: number; [k: string]: unknown };
  const recentExams: RecentExam[] = (report?.recent_exams as unknown as RecentExam[]) ?? [];

  const kpiCards = [
    {
      label: "Bu Hafta Çalışma",
      value: loading ? null : (studyTimeStr || "0dk"),
      icon: Clock,
      bgClass: "bg-teal-100",
      iconClass: "text-teal-600",
    },
    {
      label: "Haftalık Net Artış",
      value: loading ? null : (weeklyChange >= 0 ? `+${weeklyChange}` : `${weeklyChange}`),
      icon: TrendingUp,
      bgClass: "bg-emerald-100",
      iconClass: "text-emerald-600",
    },
    {
      label: "Tamamlanan Görev",
      value: loading ? null : `${tasksDoneThisWeek}`,
      icon: BookOpen,
      bgClass: "bg-teal-100",
      iconClass: "text-teal-600",
    },
    {
      label: "Hedef Sapması",
      value: loading ? null : (targetNet > 0 ? `${currentNet} / ${targetNet}` : "—"),
      icon: AlertCircle,
      bgClass: "bg-amber-100",
      iconClass: "text-amber-600",
    },
  ];

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detaylı Performans Raporu</h1>
          <p className="text-slate-600 mt-1">
            {childName} adlı çocuğunuzun haftalık ve aylık gelişim özeti
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-colors"
          onClick={() => window.print()}
        >
          <Download className="w-4 h-4" />
          PDF İndir
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, bgClass, iconClass }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bgClass}`}>
              <Icon className={`w-5 h-5 ${iconClass}`} />
            </div>
            {value === null ? (
              <Skeleton className="h-8 w-20 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            )}
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Net gelişim */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            {nets.length} Haftalık Net Gelişimi
          </h2>
          {loading ? (
            <div className="flex items-end gap-2 h-40">
              {WEEKS.map((w) => <Skeleton key={w} className="flex-1 h-full" />)}
            </div>
          ) : nets.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Henüz veri yok</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {nets.map((net: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-teal-700">{net}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 min-h-[8px] transition-all hover:from-teal-700 relative group"
                    style={{ height: `${(net / maxNet) * 100}%` }}
                  />
                  <span className="text-[10px] text-slate-500 text-center whitespace-nowrap">
                    {WEEKS[i] ?? `H${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ders bazlı */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-6">Ders Bazlı Doğruluk Oranı</h2>
          {loading ? (
            <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : subjects.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">Henüz veri yok</div>
          ) : (
            <>
              <div className="space-y-4">
                {subjects.map((d) => {
                  const total = (d.correct + d.wrong) || 1;
                  const pct = Math.round((d.correct / total) * 100);
                  const status = pct >= 80 ? "good" : pct >= 60 ? "warning" : "risk";
                  return (
                    <div key={d.subject}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-800">{d.subject}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Net: <strong className="text-slate-700">{d.net}</strong></span>
                          <span className={`font-bold ${status === "good" ? "text-emerald-600" : status === "warning" ? "text-amber-600" : "text-red-600"}`}>%{pct}</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${status === "good" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" /> İyi (%80+)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" /> Dikkat</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 shrink-0" /> Risk</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deneme sonuçları */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Son Deneme Sonuçları</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left p-4 font-semibold text-slate-700">Tarih</th>
                <th className="text-left p-4 font-semibold text-slate-700">Deneme</th>
                <th className="text-right p-4 font-semibold text-slate-700">D</th>
                <th className="text-right p-4 font-semibold text-slate-700">Y</th>
                <th className="text-right p-4 font-semibold text-teal-700">Net</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-6"><Skeleton className="h-10 w-full" /></td></tr>
              ) : recentExams.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-sm">Henüz deneme sonucu yok.</td></tr>
              ) : (
                recentExams.map((d, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">
                      {d.finished_at ? new Date(String(d.finished_at)).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="p-4 font-medium text-slate-900">{String(d.title ?? d.exam_type ?? "—")}</td>
                    <td className="text-right p-4 text-emerald-600 font-semibold">{d.correct_count ?? "—"}</td>
                    <td className="text-right p-4 text-red-500 font-semibold">{d.wrong_count ?? "—"}</td>
                    <td className="text-right p-4 font-bold text-teal-600">
                      {d.net_score !== undefined ? Number(d.net_score).toFixed(2) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk uyarısı — koşullu göster */}
      {!loading && isRisk && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Hedef Riski Uyarısı</h3>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                Mevcut net ({currentNet}) hedefin %80&apos;inin altında ({Math.round(targetNet * 0.8)}).
                {childName} adlı çocuğunuzun hedefini karşılama ihtimali düşük.
                Net artışına odaklanması gerekiyor.
              </p>
              <Link href="/veli/bildirim" className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:text-amber-800 underline transition-colors">
                Bildirimler Sayfasına Git →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
