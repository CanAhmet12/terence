"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ChildReport } from "@/lib/api";
import { TrendingUp, Clock, BookOpen, AlertCircle, BarChart3, Download } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

// Demo veri
const DEMO_NET_DATA = [38, 41, 39, 44, 46, 42, 48];
const DEMO_EXAMS = [
  { tarih: "22 Şub 2025", tur: "TYT Denemesi", matematik: 18, turkce: 22, fen: 14, toplam: 54 },
  { tarih: "15 Şub 2025", tur: "TYT Denemesi", matematik: 16, turkce: 20, fen: 12, toplam: 48 },
  { tarih: "8 Şub 2025", tur: "TYT Denemesi", matematik: 14, turkce: 19, fen: 11, toplam: 44 },
];
const DEMO_SUBJECTS = [
  { subject: "Matematik", correct: 62, wrong: 38, net: 42 },
  { subject: "Türkçe", correct: 71, wrong: 29, net: 56 },
  { subject: "Fen", correct: 45, wrong: 55, net: 28 },
  { subject: "Kimya", correct: 85, wrong: 15, net: 75 },
];

const WEEKS = ["1. Hft", "2. Hft", "3. Hft", "4. Hft", "5. Hft", "6. Hft", "7. Hft"];

export default function VeliRaporPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [report, setReport] = useState<ChildReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token || isDemo) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getChildReport(token);
      setReport(res);
    } catch {}
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  const childName = report?.child.name ?? "Çocuğunuz";
  const nets = report?.weekly_nets?.length ? report.weekly_nets : DEMO_NET_DATA;
  const maxNet = Math.max(...nets, 1);
  const subjects = report?.subject_analysis?.length ? report.subject_analysis : DEMO_SUBJECTS;

  const weeklyChange = nets.length >= 2 ? nets[nets.length - 1] - nets[0] : 0;

  const kpiCards = [
    {
      label: "Bu Hafta Çalışma",
      value: loading ? null : "12s 34dk",
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
      label: "Çözülen Soru",
      value: loading ? null : "248",
      icon: BookOpen,
      bgClass: "bg-blue-100",
      iconClass: "text-blue-600",
    },
    {
      label: "Hedef Sapması",
      value: loading ? null : `${weeklyChange >= 0 ? "+" : ""}${weeklyChange - 5} net`,
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
            {isDemo ? "Ahmet" : childName} adlı çocuğunuzun haftalık ve aylık gelişim özeti
          </p>
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              Demo Modu
            </span>
          )}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-colors"
          onClick={() => window.print()}
        >
          <Download className="w-4 h-4" />
          PDF İndir
        </button>
      </div>

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
            7 Haftalık Net Gelişimi
          </h2>
          {loading ? (
            <div className="flex items-end gap-2 h-40">
              {WEEKS.map((w) => <Skeleton key={w} className="flex-1 h-full" />)}
            </div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {nets.map((net, i) => (
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
          ) : (
            <>
              <div className="space-y-4">
                {subjects.map((d) => {
                  const pct = d.correct;
                  const status = pct >= 80 ? "good" : pct >= 60 ? "warning" : "risk";
                  return (
                    <div key={d.subject}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-800">{d.subject}</span>
                        <span className={`text-sm font-bold ${
                          status === "good" ? "text-emerald-600" : status === "warning" ? "text-amber-600" : "text-red-600"
                        }`}>%{pct}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === "good" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-red-500"
                          }`}
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
                <th className="text-right p-4 font-semibold text-slate-700">Mat.</th>
                <th className="text-right p-4 font-semibold text-slate-700">Türkçe</th>
                <th className="text-right p-4 font-semibold text-slate-700">Fen</th>
                <th className="text-right p-4 font-semibold text-teal-700">Toplam Net</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6"><Skeleton className="h-10 w-full" /></td></tr>
              ) : (
                DEMO_EXAMS.map((d, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">{d.tarih}</td>
                    <td className="p-4 font-medium text-slate-900">{d.tur}</td>
                    <td className="text-right p-4 text-slate-700">{d.matematik}</td>
                    <td className="text-right p-4 text-slate-700">{d.turkce}</td>
                    <td className="text-right p-4 text-slate-700">{d.fen}</td>
                    <td className="text-right p-4 font-bold text-teal-600">{d.toplam}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk uyarısı */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Hedef Riski Uyarısı</h3>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              Mevcut hızla devam ederse {isDemo ? "Ahmet" : childName} adlı çocuğunuzun hedefini
              karşılama ihtimali düşük. Her hafta +2 net artış gerekiyor.
            </p>
            <button className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 underline transition-colors">
              Destek Paketi İncele →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
