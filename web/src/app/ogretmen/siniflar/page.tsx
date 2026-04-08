"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ClassRoom, TeacherStudent } from "@/lib/api";
import { Search, Circle, Users, TrendingUp, Clock, RefreshCw, AlertCircle } from "lucide-react";

const RISK_CONFIG = {
  green: { label: "İyi", dot: "bg-green-500", badge: "bg-green-100 text-green-700" },
  yellow: { label: "Riskli", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  red: { label: "Çok Riskli", dot: "bg-red-500", badge: "bg-red-100 text-red-700" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function fmtTime(s: number) {
  if (s <= 0) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  return `${days} gün önce`;
}

export default function SiniflarPage() {
  const { token } = useAuth();

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"" | "green" | "yellow" | "red">("");

  const loadClasses = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await api.getTeacherClasses(token);
      setClasses(res);
      if (res.length > 0) {
        setSelectedClassId(res[0].id);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  useEffect(() => {
    if (!selectedClassId || !token) return;
    setStudentsLoading(true);
    setSearch("");
    setRiskFilter("");
    api.getClassStudents(selectedClassId)
      .then((rawData) => {
        const data = Array.isArray(rawData) ? rawData : []
        // ClassStudents API'den User[] dönüyor, TeacherStudent formatına çeviriyoruz
        setStudents(data.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          net_score: undefined,
          risk_level: undefined,
          last_active_at: (u as Record<string, unknown>).last_login_at,
          tasks_completed_today: undefined,
          study_time_today_seconds: undefined,
        })));
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [selectedClassId, token]);

  const filteredStudents = students.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchRisk = !riskFilter || s.risk_level === riskFilter;
    return matchSearch && matchRisk;
  });

  const riskCounts = {
    green: students.filter((s) => s.risk_level === "green").length,
    yellow: students.filter((s) => s.risk_level === "yellow").length,
    red: students.filter((s) => s.risk_level === "red").length,
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Başlık ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sınıflarım</h1>
            <p className="text-slate-500 mt-1 font-medium">Öğrenci risk durumları · Günlük aktivite · Net takibi</p>
          </div>
          <button onClick={loadClasses} disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Hata ── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            <div className="lg:col-span-2"><Skeleton className="h-96 rounded-2xl" /></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Sınıf Listesi ── */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Sınıflar</p>
              {classes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-500">Henüz sınıf yok</p>
                  <p className="text-xs text-slate-400 mt-1">Analiz → Sınıf oluştur</p>
                </div>
              ) : (
                classes.map((c) => {
                  const rConf = RISK_CONFIG[(c.risk_level ?? "green") as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.green;
                  const isSelected = selectedClassId === c.id;
                  return (
                    <button key={c.id} onClick={() => setSelectedClassId(c.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 shadow-sm"
                          : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                      }`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-indigo-100" : "bg-slate-100"}`}>
                          <Users className={`w-5 h-5 ${isSelected ? "text-indigo-600" : "text-slate-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${isSelected ? "text-indigo-800" : "text-slate-800"}`}>{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.students_count ?? 0} öğrenci</p>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${rConf.dot}`} />
                      </div>
                      {(c as Record<string, unknown>).avg_net !== undefined && (
                        <div className="ml-13 mt-1.5">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min(((c as Record<string, unknown>).avg_net as number / 100) * 100, 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* ── Öğrenci Detay ── */}
            <div className="lg:col-span-2">
              {!selectedClass ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-indigo-300" />
                  </div>
                  <p className="font-bold text-slate-700">Sınıf seç</p>
                  <p className="text-sm text-slate-400 mt-1">Soldaki listeden bir sınıf seç</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Risk özeti */}
                  {(riskCounts.green + riskCounts.yellow + riskCounts.red) > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {(["green", "yellow", "red"] as const).map((r) => {
                        const rc = RISK_CONFIG[r];
                        return (
                          <button key={r} onClick={() => setRiskFilter(riskFilter === r ? "" : r)}
                            className={`p-4 rounded-2xl border-2 text-center transition-all ${
                              riskFilter === r ? `${rc.badge} border-current` : "bg-white border-slate-200 hover:border-slate-300"
                            }`}>
                            <p className="text-2xl font-black text-slate-900">{riskCounts[r]}</p>
                            <div className={`flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold ${riskFilter === r ? "" : "text-slate-500"}`}>
                              <span className={`w-2 h-2 rounded-full ${rc.dot}`} />
                              {rc.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Arama */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Öğrenci ara..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all shadow-sm" />
                  </div>

                  {/* Tablo */}
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    {studentsLoading ? (
                      <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Öğrenci</th>
                              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Net</th>
                              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Çalışma</th>
                              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Son Aktif</th>
                              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Durum</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredStudents.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-5 py-12 text-center">
                                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                  <p className="text-slate-400 text-sm">{students.length === 0 ? "Bu sınıfta öğrenci yok" : "Öğrenci bulunamadı"}</p>
                                </td>
                              </tr>
                            ) : (
                              filteredStudents.map((s) => {
                                const rc = RISK_CONFIG[(s.risk_level ?? "green") as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.green;
                                return (
                                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0 border border-indigo-100">
                                          {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-900">{s.name}</p>
                                          {s.email && <p className="text-[11px] text-slate-400">{s.email}</p>}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <span className="font-black text-slate-900">{s.net_score ?? "—"}</span>
                                    </td>
                                    <td className="px-4 py-4 text-right hidden sm:table-cell">
                                      <span className="flex items-center justify-end gap-1 text-slate-500 text-xs">
                                        <Clock className="w-3.5 h-3.5" />
                                        {fmtTime(s.study_time_today_seconds ?? 0)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-right text-slate-500 text-xs hidden md:table-cell">
                                      {s.last_active_at ? timeAgo(s.last_active_at) : "—"}
                                    </td>
                                    <td className="px-4 py-4">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${rc.badge}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                                        {rc.label}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Risk uyarısı */}
                  {riskCounts.red > 0 && (
                    <div className="flex items-start gap-3.5 p-4 bg-red-50 border border-red-200 rounded-2xl">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-800">{riskCounts.red} öğrenci ciddi risk altında</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          3+ gündür çalışmayan veya net artırmayan öğrenciler için aksiyon alın.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
