"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, RiskStudent } from "@/lib/api";
import {
  AlertTriangle, Users, TrendingDown, CheckCircle,
  BookOpen, BarChart2, Clock, Plus, Video, Bell
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

const DEMO_RISK: RiskStudent[] = [
  { id: 1, name: "Elif K.", risk_level: "green", current_net: 78, target_net: 80, days_inactive: 0 },
  { id: 2, name: "Can D.", risk_level: "green", current_net: 72, target_net: 75, days_inactive: 1 },
  { id: 3, name: "Zeynep K.", risk_level: "yellow", current_net: 52, target_net: 70, days_inactive: 4 },
  { id: 4, name: "Ahmet Y.", risk_level: "red", current_net: 28, target_net: 60, days_inactive: 9 },
];

export default function TeacherDashboardPage() {
  const { user, token } = useAuth();
  const isDemo = !token || token.startsWith("demo-token-");

  const [stats, setStats] = useState<{ total_students: number; active_today: number; average_net: number; assignment_count: number } | null>(null);
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isDemo) {
      setRiskStudents(DEMO_RISK);
      setStats({ total_students: 28, active_today: 14, average_net: 48.5, assignment_count: 6 });
      setLoading(false);
      return;
    }
    try {
      const [statsRes, riskRes] = await Promise.allSettled([
        api.getTeacherStats(token!),
        api.getRiskStudents(token!),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (riskRes.status === "fulfilled") setRiskStudents(riskRes.value);
    } catch {}
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  const riskCount = riskStudents.filter((s) => s.risk_level === "red").length;
  const totalStudents = stats?.total_students ?? 0;
  const activeToday = stats?.active_today ?? 0;
  const avgNet = stats?.average_net ?? 0;
  const assignmentCount = stats?.assignment_count ?? 0;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Merhaba, {user?.name || "Öğretmen"}
        </h1>
        <p className="text-slate-600 mt-1 text-lg">
          Sınıf performansı, riskteki öğrenciler, başarı tahmini
        </p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu — Veriler gerçek değil
          </span>
        )}
      </div>

      {/* İstatistik kartları */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { icon: Users, bg: "bg-teal-50", color: "text-teal-600", label: "Toplam Öğrenci", value: loading ? null : `${totalStudents}` },
          { icon: CheckCircle, bg: "bg-indigo-50", color: "text-indigo-600", label: "Bugün Aktif", value: loading ? null : `${activeToday}` },
          { icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600", label: "Riskteki Öğrenci", value: loading ? null : `${riskCount}` },
          { icon: BarChart2, bg: "bg-amber-50", color: "text-amber-600", label: "Ortalama Net", value: loading ? null : `${avgNet}` },
        ].map(({ icon: Icon, bg, color, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="font-semibold text-slate-700">{label}</span>
            </div>
            {value === null ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Başarı Tahmin Paneli */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-900 text-lg">Başarı Tahmin Paneli</h2>
          <Link href="/ogretmen/analiz" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Detaylı Analiz →
          </Link>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Tahmini sınav neti — Yeşil: Hedefte · Sarı: Sınırda · Kırmızı: Risk altında
        </p>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : riskStudents.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm">Henüz öğrenci yok</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {riskStudents.map((o) => (
              <div
                key={o.id}
                className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                  o.risk_level === "green"
                    ? "bg-emerald-50 border-emerald-200"
                    : o.risk_level === "yellow"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 truncate pr-2">{o.name}</span>
                  <span className={`w-3 h-3 rounded-full shrink-0 ${
                    o.risk_level === "green" ? "bg-emerald-500" : o.risk_level === "yellow" ? "bg-amber-500" : "bg-red-500"
                  }`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{o.current_net} net</p>
                {o.target_net && (
                  <p className="text-xs text-slate-500 mt-0.5">Hedef: {o.target_net}</p>
                )}
                {o.days_inactive !== undefined && o.days_inactive > 2 && (
                  <p className="text-xs text-amber-600 mt-1">{o.days_inactive} gün pasif</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alt grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Son aktivite */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-5 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Son Aktivite
          </h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : riskStudents.length === 0 && !isDemo ? (
            <p className="text-sm text-slate-500 py-4">Henüz öğrenci aktivitesi yok.</p>
          ) : (
            <ul className="space-y-3">
              {(isDemo ? ["Elif K.", "Can D.", "Zeynep K."] : riskStudents.slice(0, 3).map((s) => s.name)).map((name) => (
                <li key={name} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="font-medium text-slate-900">{name}</span>
                  <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg">Bugün çalıştı</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/ogretmen/siniflar" className="mt-4 block text-center py-2.5 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm">
            Tüm Öğrenciler →
          </Link>
        </div>

        {/* Risk merkezi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-5 text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Risk & Uyarı Merkezi
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80">
              <span className="text-slate-700 font-medium">3 gün çalışmayan</span>
              <span className={`text-sm font-bold ${riskCount > 0 ? "text-red-600" : "text-slate-400"}`}>
                {riskStudents.filter((s) => s.days_inactive !== undefined && s.days_inactive >= 3).length} öğrenci
              </span>
            </li>
            <li className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80">
              <span className="text-slate-700 font-medium">Net düşüşü yaşayan</span>
              <span className={`text-sm font-bold ${riskCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {riskStudents.filter((s) => s.risk_level === "red" || s.risk_level === "yellow").length} öğrenci
              </span>
            </li>
            <li className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80">
              <span className="text-slate-700 font-medium">Hedef sınırında</span>
              <span className="text-sm font-bold text-amber-600">
                {riskStudents.filter((s) => s.risk_level === "yellow").length} öğrenci
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Veli Bildirimi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="font-bold text-slate-900 mb-2 text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          Veli Bildirimi
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Riskteki öğrencilerin velilerine otomatik veya manuel bildirim gönder.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={riskCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:from-teal-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/25"
          >
            <CheckCircle className="w-5 h-5" />
            Toplu Veli Bildirimi ({riskCount} riskteki)
          </button>
          <Link
            href="/ogretmen/mesaj"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium text-slate-700 transition-all"
          >
            Tekli Veli Bildirimi
          </Link>
        </div>
      </div>
    </div>
  );
}
