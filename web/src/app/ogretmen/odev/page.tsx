"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Assignment, ClassRoom } from "@/lib/api";
import { Calendar, CheckCircle, Loader2, Users, BookOpen, RefreshCw } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return "";
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return "Geçti";
  if (days === 0) return "Bugün";
  return `${days} gün kaldı`;
}

export default function OdevPage() {
  const { token } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    subject: "",
    type: "question" as "question" | "video" | "read",
    target_count: "10",
    due_date: "",
    description: "",
    class_room_id: "" as string | number,
  });

  const loadAssignments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getTeacherAssignments(token);
      setAssignments(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadClasses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getTeacherClasses(token);
      setClasses(res);
    } catch {}
  }, [token]);

  useEffect(() => {
    loadAssignments();
    loadClasses();
  }, [loadAssignments, loadClasses]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!form.title || !form.subject) {
      setError("Başlık ve ders alanları zorunludur.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await api.createAssignment({
        title: form.title,
        subject: form.subject,
        due_date: form.due_date || undefined,
        description: form.description || undefined,
        class_id: form.class_room_id ? Number(form.class_room_id) : undefined,
      } as Parameters<typeof api.createAssignment>[0]);
      const assignment = ((res as Record<string, unknown>)?.assignment ?? res) as Assignment;
      setAssignments((prev) => [assignment, ...prev]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setForm({ title: "", subject: "", type: "question", target_count: "10", due_date: "", description: "", class_room_id: "" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all text-sm";
  const labelCls = "block text-xs font-bold text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Başlık ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ödev & Test Atama</h1>
          <p className="text-slate-500 mt-1 font-medium">Ödev oluştur · Teslim tarihi belirle · Tamamlanma takibi</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Form ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-bold text-slate-900">Yeni Ödev Oluştur</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {success && (
                <div className="flex items-center gap-2.5 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <p className="font-semibold text-emerald-800 text-sm">Ödev başarıyla oluşturuldu!</p>
                </div>
              )}

              <div>
                <label className={labelCls}>Başlık <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Örn: Üslü Sayılar — 10 Soru" className={inputCls} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Ders <span className="text-red-500">*</span></label>
                  <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Matematik, Fizik..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tür</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} className={inputCls}>
                    <option value="question">📝 Soru Çözme</option>
                    <option value="video">▶ Video İzleme</option>
                    <option value="read">📖 Okuma</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Sınıf</label>
                <select value={form.class_room_id} onChange={(e) => setForm({ ...form, class_room_id: e.target.value })} className={inputCls}>
                  <option value="">Tüm Sınıflar</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Hedef Sayısı</label>
                  <input type="number" min={1} value={form.target_count}
                    onChange={(e) => setForm({ ...form, target_count: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Teslim Tarihi</label>
                  <input type="date" value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Açıklama</label>
                <textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Öğrencilere not..."
                  className={inputCls + " resize-none"} />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>
              )}

              <button onClick={handleSubmit} disabled={saving}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/25 active:scale-[0.98]">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                  : <><BookOpen className="w-4 h-4" /> Ödev Oluştur</>}
              </button>
            </div>
          </div>

          {/* ── Liste ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="font-bold text-slate-900">Mevcut Ödevler</h2>
              </div>
              <button onClick={loadAssignments}
                className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                <RefreshCw className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-600">Henüz ödev yok</p>
                <p className="text-xs text-slate-400 mt-1">Soldaki formla ilk ödevini oluştur</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const studentCount = (a as Record<string, unknown>).class_room
                    ? ((a as Record<string, unknown>).class_room as Record<string, unknown>).student_count as number ?? 1
                    : 1;
                  const completionCount = (a as Record<string, unknown>).completions_count as number ?? 0;
                  const completePct = studentCount > 0 ? Math.round((completionCount / studentCount) * 100) : 0;
                  const overdue = a.due_date ? new Date(a.due_date).getTime() < Date.now() : false;

                  return (
                    <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{a.title}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {(a as Record<string, unknown>).class_room && (
                              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 border border-indigo-100">
                                <Users className="w-3 h-3" />
                                {((a as Record<string, unknown>).class_room as Record<string, unknown>).name as string}
                              </span>
                            )}
                            {a.subject && (
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg font-medium">{a.subject}</span>
                            )}
                          </div>
                        </div>
                        {a.due_date && (
                          <div className={`flex items-center gap-1 text-xs shrink-0 font-semibold ${overdue ? "text-red-600" : "text-slate-500"}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {daysUntil(a.due_date)}
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${completePct === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                            style={{ width: `${Math.min(completePct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 font-medium shrink-0">
                          {completionCount}/{studentCount} (%{completePct})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
