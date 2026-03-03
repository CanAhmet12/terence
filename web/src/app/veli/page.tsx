"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, ChildSummary } from "@/lib/api";
import { Clock, TrendingUp, AlertTriangle, BarChart3, Mail, FileText, CheckCircle } from "lucide-react";

const WEEKS = ["H1", "H2", "H3", "H4", "H5", "H6", "H7"];

function secondsToHuman(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function VeliDashboardPage() {
  const { user, token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [summary, setSummary] = useState<ChildSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token || isDemo) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getChildSummary(token);
      setSummary(res);
    } catch {}
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  // Demo verisi
  const demoNets = [38, 40, 42, 45, 43, 47, 49];
  const demoExams = [
    { name: "TYT Deneme 1", tarih: "15.02.2025", net: 42 },
    { name: "TYT Deneme 2", tarih: "20.02.2025", net: 47 },
  ];

  const childName = isDemo ? "Ahmet" : (summary?.child.name || "Çocuğunuz");
  const studyTime = isDemo ? "2s 34dk" : secondsToHuman(summary?.study_time_today_seconds ?? 0);
  const weeklyChange = isDemo ? "+3" : (summary ? `+${summary.net_today}` : "—");
  const riskLevel = isDemo ? "yellow" : (summary?.risk_level ?? "green");
  const tasksDone = isDemo ? 2 : (summary?.tasks_done_today ?? 0);
  const tasksTotal = isDemo ? 4 : (summary?.tasks_total_today ?? 0);

  const riskColors = {
    green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", label: "Hedefte İlerliyor" },
    yellow: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "Dikkat Gerekiyor" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", label: "Yüksek Risk" },
  };
  const risk = riskColors[riskLevel];

  const nets = demoNets;
  const maxNet = Math.max(...nets, 1);

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Veli Paneli</h1>
        <p className="text-slate-600 mt-1 text-lg">
          {childName} adlı çocuğunuzun çalışma durumu ve gelişimi
        </p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu — Veriler gerçek değil
          </span>
        )}
      </div>

      {/* Risk durumu bandı */}
      {!loading && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 ${risk.bg} ${risk.border}`}>
          {riskLevel === "green" ? (
            <CheckCircle className={`w-5 h-5 shrink-0 ${risk.text}`} />
          ) : (
            <AlertTriangle className={`w-5 h-5 shrink-0 ${risk.text}`} />
          )}
          <div>
            <span className={`font-bold text-sm ${risk.text}`}>{risk.label}</span>
            {riskLevel !== "green" && (
              <p className="text-xs text-slate-600 mt-0.5">
                Bu hızla devam ederse hedef bölüm risk altında. Pro pakete geçiş önerilir.
              </p>
            )}
          </div>
          {riskLevel !== "green" && (
            <Link href="/#paketler" className="ml-auto shrink-0 text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">
              Paketleri İncele →
            </Link>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Bugünkü özet */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-6 text-lg">{childName} — Bugün</h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-teal-50 border border-teal-100">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Çalışma</p>
                  <p className="text-xl font-bold text-slate-900">{studyTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-teal-50 border border-teal-100">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Günlük Net</p>
                  <p className="text-xl font-bold text-slate-900">{weeklyChange}</p>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">Günlük Görevler</p>
                    <span className="text-sm font-bold text-teal-600">{tasksDone}/{tasksTotal}</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all"
                      style={{ width: tasksTotal > 0 ? `${(tasksDone / tasksTotal) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <Link
            href="/veli/rapor"
            className="mt-6 block text-center py-3 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors"
          >
            Detaylı Rapor →
          </Link>
        </div>

        {/* Zayıf dersler */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-4 text-lg">Zayıf Dersler</h2>
          <p className="text-sm text-slate-600 mb-5">
            Hata oranı yüksek dersler ve tekrar edilmesi önerilen konular
          </p>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <ul className="space-y-3">
              {[
                { ders: "Matematik", yuzde: 65 },
                { ders: "Fizik", yuzde: 72 },
                { ders: "Kimya", yuzde: 80 },
              ].map(({ ders, yuzde }) => (
                <li key={ders} className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-900">{ders}</span>
                    <span className={`text-sm font-semibold ${yuzde < 70 ? "text-red-600" : "text-amber-600"}`}>
                      %{yuzde} doğru
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${yuzde < 70 ? "bg-red-400" : "bg-amber-400"}`}
                      style={{ width: `${yuzde}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Net gelişim grafiği */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-2 text-lg">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          Net Gelişim Grafiği
        </h2>
        <p className="text-sm text-slate-600 mb-6">Son 7 haftalık net değişimi</p>

        {loading ? (
          <div className="flex items-end gap-2 h-40">
            {WEEKS.map((_, i) => <Skeleton key={i} className="flex-1 h-full" />)}
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 h-40">
              {nets.map((net, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-teal-600 to-teal-400 min-h-[20px] transition-all hover:from-teal-700 relative group"
                    style={{ height: `${(net / maxNet) * 100}%` }}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 whitespace-nowrap">
                      {net}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{WEEKS[i]}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              7 haftalık trend — Son net: <span className="font-bold text-teal-600">{nets[nets.length - 1]}</span>
            </p>
          </>
        )}
      </div>

      {/* Deneme sonuçları */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-lg">
          <FileText className="w-5 h-5 text-teal-600" />
          Son Deneme Sonuçları
        </h2>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Deneme</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Tarih</th>
                  <th className="text-right py-4 px-4 font-semibold text-slate-700">Net</th>
                </tr>
              </thead>
              <tbody>
                {demoExams.map((d) => (
                  <tr key={d.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-medium text-slate-900">{d.name}</td>
                    <td className="py-4 px-4 text-slate-600">{d.tarih}</td>
                    <td className="text-right py-4 px-4 font-bold text-teal-600">{d.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link
          href="/veli/rapor"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          Tüm Denemeler →
        </Link>
      </div>

      {/* Bildirim Tercihleri */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-lg">
          <Mail className="w-5 h-5 text-teal-600" />
          Bildirim Tercihleri
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          SMS ve e-posta ile çalışma hatırlatmaları, deneme uyarıları, hedef risk bildirimleri
        </p>
        <Link
          href="/veli/bildirim"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold transition-colors"
        >
          Bildirim Ayarları →
        </Link>
      </div>
    </div>
  );
}
