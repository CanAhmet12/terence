"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Assignment } from "@/lib/api";
import { Calendar, FileQuestion, CheckCircle, Clock, Loader2, Users, BookOpen, RefreshCw } from "lucide-react";

const DEMO_ASSIGNMENTS: Assignment[] = [
  { id: 1, title: "Üslü Sayılar - 10 Soru", class_name: "10-A Matematik", subject: "Matematik", question_count: 10, difficulty: "orta", due_date: "2026-03-07", is_required: true, completed_count: 18, total_count: 24, created_at: "2026-03-01" },
  { id: 2, title: "Newton Yasaları - 5 Soru", class_name: "11-A Fizik", subject: "Fizik", question_count: 5, difficulty: "zor", due_date: "2026-03-05", is_required: true, completed_count: 12, total_count: 18, created_at: "2026-03-02" },
];

const DIFFICULTY_CLS: Record<string, string> = {
  kolay: "bg-emerald-100 text-emerald-700",
  orta: "bg-amber-100 text-amber-700",
  zor: "bg-red-100 text-red-700",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return "Geçti";
  if (days === 0) return "Bugün";
  return `${days} gün kaldı`;
}

export default function OdevPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    class_name: "",
    subject: "",
    topic: "",
    kazanim_code: "",
    difficulty: "orta",
    question_count: "10",
    due_date: "",
    is_required: true,
    message: "",
  });

  const loadAssignments = useCallback(async () => {
    if (isDemo || !token) {
      setAssignments(DEMO_ASSIGNMENTS);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getTeacherAssignments(token);
      setAssignments(res);
    } catch {
      setAssignments(DEMO_ASSIGNMENTS);
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const handleSubmit = async () => {
    if (!form.class_name || !form.subject || !form.due_date) {
      setError("Sınıf, ders ve teslim tarihi zorunludur.");
      return;
    }
    setSaving(true);
    setError("");
    if (isDemo || !token) {
      await new Promise((r) => setTimeout(r, 700));
      const newA: Assignment = {
        id: Date.now(),
        title: `${form.topic || form.subject} - ${form.question_count} Soru`,
        class_name: form.class_name, subject: form.subject,
        question_count: Number(form.question_count), difficulty: form.difficulty,
        due_date: form.due_date, is_required: form.is_required,
        message: form.message, completed_count: 0, total_count: 24,
        created_at: new Date().toISOString(),
      };
      setAssignments((prev) => [newA, ...prev]);
      setSuccess(true);
      setSaving(false);
      setTimeout(() => setSuccess(false), 3000);
      setForm({ class_name: "", subject: "", topic: "", kazanim_code: "", difficulty: "orta", question_count: "10", due_date: "", is_required: true, message: "" });
      return;
    }
    try {
      const res = await api.createAssignment(token, {
        class_name: form.class_name, subject: form.subject,
        topic: form.topic || undefined, kazanim_code: form.kazanim_code || undefined,
        difficulty: form.difficulty, question_count: Number(form.question_count),
        due_date: form.due_date, is_required: form.is_required,
        message: form.message || undefined,
      });
      setAssignments((prev) => [res, ...prev]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  };

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Ödev & Test Atama</h1>
        <p className="text-slate-600 mt-1">Kazanıma göre ödev oluştur · Teslim tarihi belirle · Tamamlanma takibi</p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-teal-600" />
              Yeni Ödev Oluştur
            </h2>

            {success && (
              <div className="mb-5 flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
                <p className="text-sm font-semibold text-teal-800">Ödev başarıyla atandı! Öğrencilere bildirim gönderildi.</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Sınıf / Grup <span className="text-red-500">*</span></label>
                  <select value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} className={inputCls}>
                    <option value="">Seçin</option>
                    <option>10-A Matematik</option>
                    <option>10-B Matematik</option>
                    <option>11-A Fizik</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Ders <span className="text-red-500">*</span></label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls}>
                    <option value="">Seçin</option>
                    <option>Matematik</option>
                    <option>Fizik</option>
                    <option>Türkçe</option>
                    <option>Kimya</option>
                    <option>Biyoloji</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Konu (opsiyonel)</label>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    placeholder="Örn: Üslü Sayılar"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Kazanım Kodu (opsiyonel)</label>
                  <input
                    type="text"
                    value={form.kazanim_code}
                    onChange={(e) => setForm({ ...form, kazanim_code: e.target.value })}
                    placeholder="Örn: M.8.1.1"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Zorluk</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputCls}>
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Soru Sayısı</label>
                  <input
                    type="number"
                    value={form.question_count}
                    onChange={(e) => setForm({ ...form, question_count: e.target.value })}
                    min="1" max="50"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Teslim Tarihi <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="required"
                  checked={form.is_required}
                  onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300"
                />
                <label htmlFor="required" className="text-sm font-medium text-slate-700">Zorunlu ödev</label>
              </div>
              <div>
                <label className={labelCls}>Öğrencilere Not (opsiyonel)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Öğrencilere mesajınızı buraya yazın..."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Atanıyor...</>
                ) : (
                  <><FileQuestion className="w-5 h-5" /> Ödevi Ata</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sağ: Ödev listesi */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Atanan Ödevler
              </h3>
              <button onClick={loadAssignments} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Henüz ödev atanmamış.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignments.map((a) => {
                  const pct = a.total_count ? Math.round(((a.completed_count ?? 0) / a.total_count) * 100) : 0;
                  const countdown = a.due_date ? daysUntil(a.due_date) : "";
                  return (
                    <div key={a.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{a.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Users className="w-3 h-3" />{a.class_name}
                            </span>
                            {a.difficulty && (
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${DIFFICULTY_CLS[a.difficulty] ?? "bg-slate-100 text-slate-600"}`}>
                                {a.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tamamlanma */}
                      {a.total_count && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{a.completed_count}/{a.total_count} öğrenci</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct === 100 ? "bg-teal-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {a.due_date && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {countdown}
                        </div>
                      )}
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
