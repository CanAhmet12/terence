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

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Ödev & Test Atama</h1>
        <p className="text-slate-600 mt-1">Ödev oluştur · Teslim tarihi belirle · Tamamlanma takibi</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" /> Yeni Ödev Oluştur
          </h2>

          {success && (
            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-2xl border border-teal-200 mb-4">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              <p className="font-semibold text-teal-800 text-sm">Ödev başarıyla oluşturuldu!</p>
            </div>
          )}

          <div className="space-y-4">
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
                  <option value="question">Soru Çözme</option>
                  <option value="video">Video İzleme</option>
                  <option value="read">Okuma</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Sınıf</label>
              <select value={form.class_room_id} onChange={(e) => setForm({ ...form, class_room_id: e.target.value })} className={inputCls}>
                <option value="">Tüm Sınıflar</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Açıklama</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} placeholder="Öğrencilere not..." className={inputCls + " resize-none"} />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>}

            <button onClick={handleSubmit} disabled={saving}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              {saving ? "Oluşturuluyor..." : "Ödev Oluştur"}
            </button>
          </div>
        </div>

        {/* Liste */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Mevcut Ödevler</h2>
            <button onClick={loadAssignments} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Henüz ödev yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const studentCount = a.class_room?.student_count ?? 1;
                const completePct = a.completions_count !== undefined
                  ? Math.round((a.completions_count / Math.max(studentCount, 1)) * 100)
                  : 0;
                return (
                  <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {a.class_room?.name && (
                            <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <Users className="w-3 h-3" />{a.class_room.name}
                            </span>
                          )}
                          {a.subject && (
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{a.subject}</span>
                          )}
                        </div>
                      </div>
                      {a.due_date && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{daysUntil(a.due_date)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(completePct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">
                        {a.completions_count ?? 0}/{studentCount} tamamlandı (%{completePct})
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
  );
}

