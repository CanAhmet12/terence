"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, DollarSign, Video, RefreshCw, BookOpen, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, AdminReports } from "@/lib/api";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 mb-3">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-emerald-600 mt-1 font-medium">{sub}</p>}
        </>
      )}
    </div>
  );
}

export default function AdminRaporlarPage() {
  const { token } = useAuth();

  const [reports, setReports] = useState<AdminReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminReports(token);
      setReports(res);
    } catch {
      setError("Raporlar yüklenemedi. API endpoint'i henüz hazır olmayabilir.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const weeklyUsers = reports?.weekly_users?.map((w) => w.value) ?? [];
  const maxWeekly = Math.max(...weeklyUsers, 1);
  const monthlyRevenue = reports?.monthly_revenue ?? [];
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.value), 1);

  const formatCurrency = (n: number) =>
    n >= 1000 ? `₺${(n / 1000).toFixed(1)}K` : `₺${n}`;

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Panele dön
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Raporlar</h1>
          <p className="text-slate-600 mt-1">Öğrenci katılımı, gelir-gider, kullanıcı artışı</p>
        </div>
        <button
          onClick={loadReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Aktif Kullanıcı (Bugün)"
          value={reports?.active_users_today?.toLocaleString("tr-TR") ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Bu Ay Yeni Kayıt"
          value={reports?.weekly_users?.reduce((s, v) => s + v.value, 0)?.toLocaleString("tr-TR") ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Ort. Çalışma Süresi"
          value={reports?.average_study_time_minutes ? `${reports.average_study_time_minutes} dk` : "—"}
          loading={loading}
        />
        <StatCard
          icon={DollarSign}
          label="Bu Ay Gelir"
          value={reports?.monthly_revenue?.at(-1)?.value
            ? formatCurrency(reports.monthly_revenue.at(-1)!.value)
            : "—"}
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Haftalık aktif kullanıcı */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">Haftalık Aktif Kullanıcı</h2>
          {loading ? (
            <div className="flex items-end gap-1 h-40">
              {DAYS.map((_, i) => <Skeleton key={i} className="flex-1 h-full" />)}
            </div>
          ) : weeklyUsers.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">Veri yok.</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {weeklyUsers.slice(0, 7).map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t bg-teal-500 hover:bg-teal-600 transition-colors min-h-[4px] relative"
                    style={{ height: `${(val / maxWeekly) * 100}%` }}
                    title={`${val} kullanıcı`}
                  />
                  <span className="text-xs text-slate-500">{DAYS[i] ?? ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aylık gelir */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">Aylık Gelir</h2>
          {loading ? (
            <div className="flex items-end gap-2 h-40">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="flex-1 h-full" />)}
            </div>
          ) : monthlyRevenue.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">Veri yok.</p>
          ) : (
            <>
              <div className="flex items-end gap-2 h-40">
                {monthlyRevenue.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors min-h-[4px]"
                      style={{ height: `${(m.value / maxRevenue) * 100}%` }}
                      title={formatCurrency(m.value)}
                    />
                    <span className="text-xs text-slate-500 truncate w-full text-center">{m.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Son {monthlyRevenue.length} ay</p>
            </>
          )}
        </div>
      </div>

      {/* En çok çalışılan dersler */}
      {!loading && reports?.top_subjects && reports.top_subjects.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            En Çok Çalışılan Dersler
          </h2>
          <div className="space-y-3">
            {reports.top_subjects.map((s) => {
              const maxCount = Math.max(...reports.top_subjects.map((x) => x.count), 1);
              return (
                <div key={s.subject}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{s.subject}</span>
                    <span className="text-sm text-slate-500">{s.count.toLocaleString("tr-TR")} soru</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full"
                      style={{ width: `${(s.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paket dönüşümleri — sadece gerçek veri varsa göster */}
      {!loading && reports?.subscription_conversions && reports.subscription_conversions.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">Paket Dönüşümleri</h2>
          <div className="space-y-2">
            {reports.subscription_conversions.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700">
                  <span className="font-semibold capitalize">{c.from}</span>
                  <span className="mx-2 text-slate-400">→</span>
                  <span className="font-semibold capitalize">{c.to}</span>
                </span>
                <span className="text-sm font-bold text-teal-600">{c.count} dönüşüm</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
