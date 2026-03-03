"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, TeacherStatistics, User } from "@/lib/api";
import {
  AlertTriangle,
  Users,
  TrendingDown,
  Bell,
  CheckCircle,
  BookOpen,
  BarChart2,
  Clock,
} from "lucide-react";

type RiskStudent = {
  id: number;
  name: string;
  risk: "green" | "yellow" | "red";
  predicted_net: number;
  weekly_change: number;
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function TeacherDashboardPage() {
  const { user, token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [stats, setStats] = useState<TeacherStatistics | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Demo verisi
  const demoStudents: RiskStudent[] = [
    { id: 1, name: "Elif K.", risk: "green", predicted_net: 78, weekly_change: 8 },
    { id: 2, name: "Can D.", risk: "green", predicted_net: 72, weekly_change: 5 },
    { id: 3, name: "Zeynep K.", risk: "yellow", predicted_net: 52, weekly_change: -2 },
    { id: 4, name: "Ahmet Y.", risk: "red", predicted_net: 38, weekly_change: -5 },
  ];

  const loadData = useCallback(async () => {
    if (!token || isDemo) {
      setLoading(false);
      return;
    }
    try {
      const [statsRes, studentsRes] = await Promise.allSettled([
        api.getTeacherStatistics(token),
        api.getTeacherStudents(token),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (studentsRes.status === "fulfilled") setStudents(studentsRes.value);
    } catch {}
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  const riskStudents: RiskStudent[] = isDemo
    ? demoStudents
    : students.slice(0, 8).map((s, i) => ({
        id: s.id,
        name: s.name,
        risk: (["green", "green", "yellow", "red"] as const)[i % 4],
        predicted_net: 40 + Math.floor(Math.random() * 40),
        weekly_change: Math.floor(Math.random() * 10) - 4,
      }));

  const riskCount = riskStudents.filter((s) => s.risk === "red").length;
  const totalStudents = stats?.total_students ?? (isDemo ? 28 : students.length);
  const activeLesson = stats?.active_lessons ?? (isDemo ? 6 : 0);
  const avgSuccess = stats?.average_success_rate ?? (isDemo ? 48.5 : 0);

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
          { icon: BookOpen, bg: "bg-indigo-50", color: "text-indigo-600", label: "Aktif Ders", value: loading ? null : `${activeLesson}` },
          { icon: TrendingDown, bg: "bg-red-50", color: "text-red-600", label: "Riskteki Öğrenci", value: loading ? null : `${riskCount}` },
          { icon: BarChart2, bg: "bg-amber-50", color: "text-amber-600", label: "Ortalama Net", value: loading ? null : `${avgSuccess}` },
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
                  o.risk === "green"
                    ? "bg-emerald-50 border-emerald-200"
                    : o.risk === "yellow"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 truncate pr-2">{o.name}</span>
                  <span className={`w-3 h-3 rounded-full shrink-0 ${
                    o.risk === "green" ? "bg-emerald-500" : o.risk === "yellow" ? "bg-amber-500" : "bg-red-500"
                  }`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{o.predicted_net} net</p>
                <p className={`text-sm font-medium mt-0.5 ${o.weekly_change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {o.weekly_change >= 0 ? "+" : ""}{o.weekly_change} haftalık
                </p>
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
          ) : students.length === 0 && !isDemo ? (
            <p className="text-sm text-slate-500 py-4">Henüz öğrenci aktivitesi yok.</p>
          ) : (
            <ul className="space-y-3">
              {(isDemo ? ["Elif K.", "Can D.", "Zeynep K."] : students.slice(0, 3).map((s) => s.name)).map((name) => (
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
                {riskCount} öğrenci
              </span>
            </li>
            <li className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80">
              <span className="text-slate-700 font-medium">Net düşüşü yaşayan</span>
              <span className={`text-sm font-bold ${riskStudents.filter((s) => s.weekly_change < 0).length > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {riskStudents.filter((s) => s.weekly_change < 0).length} öğrenci
              </span>
            </li>
            <li className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80">
              <span className="text-slate-700 font-medium">Hedef sınırında</span>
              <span className="text-sm font-bold text-amber-600">
                {riskStudents.filter((s) => s.risk === "yellow").length} öğrenci
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
