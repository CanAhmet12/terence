"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ClassRoom, TeacherStudent } from "@/lib/api";
import type { StudentGoalDashboard, RiskTier } from "@/lib/goal-dashboard";
import { goalTemplateLabel } from "@/lib/goal-dashboard";
import { Search, Users, Clock, RefreshCw, AlertCircle, Plus, X, Target, Loader2 } from "lucide-react";

const RISK_CONFIG = {
  green: { label: "İyi", dot: "bg-green-500", badge: "bg-green-100 text-green-700" },
  yellow: { label: "Riskli", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  red: { label: "Çok Riskli", dot: "bg-red-500", badge: "bg-red-100 text-red-700" },
};

const DASH_RISK: Record<RiskTier, { label: string; badge: string; dot: string }> = {
  on_track: { label: "Hedefte", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  at_risk: { label: "Dikkat", badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  critical: { label: "Kritik", badge: "bg-red-100 text-red-800", dot: "bg-red-500" },
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);

  const [goalStudent, setGoalStudent] = useState<TeacherStudent | null>(null);
  const [goalDash, setGoalDash] = useState<StudentGoalDashboard | null>(null);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalErr, setGoalErr] = useState<string | null>(null);

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
        const data = Array.isArray(rawData) ? rawData : [];
        setStudents(data.map((u) => {
          const raw = u as Record<string, unknown>;
          // current_net ile hedef net'i karşılaştırarak risk seviyesini hesapla
          const currentNet = Number(raw.current_net ?? 0);
          const targetNet = Number(raw.target_net ?? 50);
          const daysInactive = raw.last_login_at
            ? Math.floor((Date.now() - new Date(raw.last_login_at as string).getTime()) / 86400000)
            : 999;
          let risk: "green" | "yellow" | "red" = "green";
          if (daysInactive > 7 || currentNet < targetNet * 0.4) risk = "red";
          else if (daysInactive > 3 || currentNet < targetNet * 0.7) risk = "yellow";

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            net_score: currentNet >= 0 ? currentNet : undefined,
            risk_level: risk,
            last_active_at: raw.last_login_at as string | undefined,
            tasks_completed_today: raw.tasks_completed_today as number | undefined,
            study_time_today_seconds: raw.study_time_today_seconds as number | undefined,
          };
        }));
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

  useEffect(() => {
    if (!goalStudent) return;
    setGoalLoading(true);
    setGoalErr(null);
    setGoalDash(null);
    api
      .getTeacherStudentGoalDashboard(goalStudent.id)
      .then(setGoalDash)
      .catch((e) => setGoalErr((e as Error).message || "Hedef verisi alınamadı"))
      .finally(() => setGoalLoading(false));
  }, [goalStudent]);

  const closeGoalModal = () => {
    setGoalStudent(null);
    setGoalDash(null);
    setGoalErr(null);
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      setError("Sınıf adı boş olamaz");
      return;
    }
    if (!token) return;
    
    setCreating(true);
    setError(null);
    try {
      const res = await api.createClass(token, { name: newClassName.trim() });
      const newClass = (res as { class?: ClassRoom }).class ?? res;
      setClasses([...classes, newClass as ClassRoom]);
      setNewClassName("");
      setShowCreateModal(false);
    } catch (e) {
      setError((e as Error).message);
    }
    setCreating(false);
  };

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full px-6 py-8">

        {/* ── Başlık ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sınıflarım</h1>
            <p className="text-slate-500 mt-1 font-medium">Öğrenci risk durumları · Günlük aktivite · Net takibi</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm">
              <Plus className="w-4 h-4" />
              Yeni Sınıf
            </button>
            <button onClick={loadClasses} disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all shadow-sm disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
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
                  <p className="text-xs text-slate-400 mt-2 mb-4">Sağ üstteki "Yeni Sınıf" butonu ile oluştur</p>
                  <button onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                    İlk Sınıfı Oluştur
                  </button>
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
                        <div className="ml-12 mt-1.5">
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
                              <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-[1%] whitespace-nowrap">Hedef</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredStudents.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-5 py-12 text-center">
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
                                    <td className="px-4 py-4 text-right">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setGoalStudent(s);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
                                      >
                                        <Target className="w-3.5 h-3.5" />
                                        Özet
                                      </button>
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

      {/* ── Öğrenci hedef özeti (salt okunur, öğrenci ile aynı DTO) ── */}
      {goalStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{goalStudent.name}</h3>
                  <p className="text-[11px] text-slate-500 truncate">Hedef ve Net · salt okunur</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeGoalModal}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {goalLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Öğrenci hedef verisi yükleniyor…</p>
                </div>
              )}

              {!goalLoading && goalErr && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {goalErr}
                </div>
              )}

              {!goalLoading && goalDash && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mod</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                      {goalTemplateLabel(goalDash.template)}
                    </span>
                    {(() => {
                      const rt = goalDash.insights?.risk_tier ?? "on_track";
                      const dr = DASH_RISK[rt] ?? DASH_RISK.on_track;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${dr.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dr.dot}`} />
                          {dr.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Mevcut net</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {goalDash.insights?.display_current_net ?? goalDash.user_snapshot?.current_net ?? "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Hedef net</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {goalDash.user_snapshot?.target_net != null
                          ? goalDash.user_snapshot.target_net
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Kalan gün</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {goalDash.insights?.days_remaining != null ? goalDash.insights.days_remaining : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Haftalık net (tahmini)</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {goalDash.insights?.weekly_net_needed != null
                          ? Number(goalDash.insights.weekly_net_needed).toFixed(1)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {goalDash.template !== "school_primary" && goalDash.exam_metrics && (
                    <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-indigo-900">Deneme</p>
                      <p>
                        Tamamlanan: <strong>{goalDash.exam_metrics.completed_exams_count ?? 0}</strong>
                        {goalDash.exam_metrics.in_progress_exams_count != null &&
                          goalDash.exam_metrics.in_progress_exams_count > 0 && (
                            <span className="text-amber-800">
                              {" "}
                              · Devam eden: <strong>{goalDash.exam_metrics.in_progress_exams_count}</strong>
                            </span>
                          )}
                      </p>
                      {goalDash.exam_metrics.last_completed_exam_title && (
                        <p className="text-slate-600 truncate">
                          Son: {goalDash.exam_metrics.last_completed_exam_title}
                          {goalDash.exam_metrics.last_completed_exam_net != null &&
                            ` (${goalDash.exam_metrics.last_completed_exam_net} net)`}
                        </p>
                      )}
                    </div>
                  )}

                  {goalDash.template === "school_primary" && goalDash.school_metrics && (
                    <div className="p-3 rounded-xl border border-teal-100 bg-teal-50/40 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-teal-900">Plan / okul</p>
                      <p>
                        Bu hafta görev:{" "}
                        <strong>
                          {goalDash.school_metrics.tasks_done_week ?? 0}/{goalDash.school_metrics.tasks_total_week ?? 0}
                        </strong>
                      </p>
                      {goalDash.school_metrics.curriculum_topics_completed != null && (
                        <p>
                          Müfredat tamamlanan konu:{" "}
                          <strong>{goalDash.school_metrics.curriculum_topics_completed}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {goalDash.data_completeness?.missing && goalDash.data_completeness.missing.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Eksik veri</p>
                      <div className="flex flex-wrap gap-1.5">
                        {goalDash.data_completeness.missing.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[11px] font-semibold border border-amber-100"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sınıf Oluşturma Modalı ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Yeni Sınıf Oluştur</h3>
                  <p className="text-xs text-slate-500">Öğrencilerinizi gruplandırın</p>
                </div>
              </div>
              <button onClick={() => { setShowCreateModal(false); setNewClassName(""); setError(null); }}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Sınıf Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Örn: 10-A Matematik, 8. Sınıf TYT..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateClass(); }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCreateModal(false); setNewClassName(""); setError(null); }}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled={creating || !newClassName.trim()}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Sınıf Oluştur</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
