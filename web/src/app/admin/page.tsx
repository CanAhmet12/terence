"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Users, BookOpen, DollarSign, Upload, TrendingUp, BarChart3, Video, RefreshCw, UserCheck } from "lucide-react";

type PlatformStats = {
  total_students: number;
  total_teachers: number;
  monthly_revenue: number;
  new_users_this_week: number;
  active_users_today: number;
  top_content: { title: string; views: number }[];
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR").format(n) + " ₺";
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const DEMO_STATS: PlatformStats = {
    total_students: 1247,
    total_teachers: 84,
    monthly_revenue: 124500,
    new_users_this_week: 12,
    active_users_today: 348,
    top_content: [
      { title: "Matematik — Üslü Sayılar", views: 2341 },
      { title: "Fizik — Hareket", views: 1856 },
      { title: "Türkçe — Paragraf", views: 1623 },
      { title: "Kimya — Mol", views: 1245 },
    ],
  };

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    if (!token || isDemo) {
      setStats(DEMO_STATS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const statsRes = await Promise.allSettled([api.getAdminStats(token!)]);
      const adminStats = statsRes[0].status === "fulfilled" ? statsRes[0].value : null;

      setStats({
        total_students: adminStats?.total_students ?? 0,
        total_teachers: adminStats?.total_teachers ?? 0,
        monthly_revenue: adminStats?.monthly_revenue ?? 0,
        new_users_this_week: adminStats?.active_users_today ?? 0,
        active_users_today: adminStats?.active_users_today ?? 0,
        top_content: [],
      });
    } catch {}
    setLoading(false);
    setRefreshing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isDemo]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const s = stats ?? DEMO_STATS;

  const kpiCards = [
    {
      icon: Users,
      bg: "bg-teal-50",
      color: "text-teal-600",
      label: "Toplam Öğrenci",
      value: loading ? null : s.total_students.toLocaleString("tr"),
      sub: loading ? null : `+${s.new_users_this_week} bu hafta`,
      subColor: "text-emerald-600",
    },
    {
      icon: UserCheck,
      bg: "bg-indigo-50",
      color: "text-indigo-600",
      label: "Öğretmen",
      value: loading ? null : s.total_teachers.toLocaleString("tr"),
      sub: loading ? null : `${s.active_users_today} aktif bugün`,
      subColor: "text-slate-500",
    },
    {
      icon: BookOpen,
      bg: "bg-amber-50",
      color: "text-amber-600",
      label: "En Çok İzlenen",
      value: loading ? null : (s.top_content[0]?.title.split("—")[0].trim() ?? "—"),
      sub: loading ? null : `${s.top_content[0]?.views.toLocaleString("tr") ?? 0} izlenme`,
      subColor: "text-slate-500",
    },
    {
      icon: DollarSign,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
      label: "Bu Ay Gelir",
      value: loading ? null : formatCurrency(s.monthly_revenue),
      sub: loading ? null : "PayTR üzerinden",
      subColor: "text-slate-500",
    },
  ];

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Yönetim Paneli</h1>
          <p className="text-slate-600 mt-1 text-lg">Platform özeti, içerik, satış ve trafik analizi</p>
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              Demo Modu
            </span>
          )}
        </div>
        <button
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {/* KPI kartlar */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {kpiCards.map(({ icon: Icon, bg, color, label, value, sub, subColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="font-semibold text-slate-700 text-sm">{label}</span>
            </div>
            {value === null ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
            )}
            {sub === null ? (
              <Skeleton className="h-4 w-28 mt-1" />
            ) : (
              <p className={`text-sm font-medium mt-1 ${subColor}`}>{sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* İçerik yönetimi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            İçerik Yönetimi
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Video, PDF ve soru ekleme, düzenleme, silme işlemleri
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/icerik"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-teal-600 transition-all shadow-lg shadow-teal-500/25"
            >
              İçerik Yönet
            </Link>
            <Link
              href="/admin/sorular"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Soru Havuzu
            </Link>
          </div>
        </div>

        {/* Satış raporları */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Paket Dönüşümleri
          </h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Free → Bronze", value: "45 dönüşüm", color: "text-teal-600" },
                { label: "Bronze → Plus", value: "28 dönüşüm", color: "text-indigo-600" },
                { label: "Plus → Pro", value: "12 dönüşüm", color: "text-emerald-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between py-4 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/admin/raporlar"
            className="mt-5 block text-center py-2.5 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm"
          >
            Detaylı Satış Raporu →
          </Link>
        </div>
      </div>

      {/* Trafik analizi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <h2 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          En Çok İzlenen İçerikler
        </h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {s.top_content.map((item, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.views.toLocaleString("tr")} izlenme</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hızlı erişim */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/kullanicilar", label: "Kullanıcı Yönetimi", icon: Users, desc: "Öğrenci, öğretmen, veli" },
          { href: "/admin/raporlar", label: "Raporlar", icon: BarChart3, desc: "Detaylı analitik" },
          { href: "/admin/ayarlar", label: "Sistem Ayarları", icon: Upload, desc: "Platform konfigürasyonu" },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-200 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center shrink-0 transition-colors">
              <Icon className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
