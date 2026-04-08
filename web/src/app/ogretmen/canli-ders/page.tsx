"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, LiveSession, ClassRoom } from "@/lib/api";
import { Video, Calendar, Clock, CheckCircle, Copy, Loader2, RefreshCw, Play } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" }) +
    " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG = {
  scheduled: { label: "Yaklaşan", cls: "bg-teal-100 text-teal-700" },
  live: { label: "Canlı", cls: "bg-green-100 text-green-700" },
  ended: { label: "Tamamlandı", cls: "bg-slate-100 text-slate-500" },
};

export default function CanliDersPage() {
  const { token } = useAuth();

  const [lessons, setLessons] = useState<LiveSession[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    title: "",
    class_room_id: "" as string | number,
    scheduled_at: "",
    duration_minutes: 45,
  });

  const loadLessons = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getLiveSessions(token);
      setLessons(data);
    } catch {
      setLessons([]);
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
    loadLessons();
    loadClasses();
  }, [loadLessons, loadClasses]);

  const handleCreate = async () => {
    if (!token) return;
    if (!form.scheduled_at) {
      setError("Tarih ve saat zorunludur.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await api.createLiveSession({
        title: form.title || (classes.find((c) => c.id === Number(form.class_room_id))?.name ?? "Canlı Ders"),
        class_id: form.class_room_id ? Number(form.class_room_id) : undefined,
        starts_at: form.scheduled_at,
        duration_minutes: form.duration_minutes || undefined,
      } as Parameters<typeof api.createLiveSession>[0]);
      const session = ((res as Record<string, unknown>)?.session ?? res) as LiveSession;
      setCreatedUrl((session as Record<string, unknown>)?.daily_room_url as string ?? "");
      setSaved(true);
      setLessons((prev) => [session, ...prev]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const upcoming = lessons.filter((l) => l.status !== "ended");
  const past = lessons.filter((l) => l.status === "ended");

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full px-6 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Canlı Ders</h1>
          <p className="text-slate-500 mt-1 font-medium">Ders planla · Link oluştur · Öğrencilerle paylaş</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Form ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Video className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="font-bold text-slate-900">Yeni Ders Oluştur</h2>
              </div>
            </div>

            <div className="p-6">
              {saved ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-800">Ders oluşturuldu!</p>
                      <p className="text-sm text-emerald-600 mt-0.5">Linki öğrencilerle paylaşabilirsin.</p>
                    </div>
                  </div>
                  {createdUrl && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Ders Linki</label>
                      <div className="flex gap-2">
                        <input type="text" readOnly value={createdUrl}
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700" />
                        <button onClick={() => copyLink(createdUrl)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Kopyalandı!" : "Kopyala"}
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { setSaved(false); setCreatedUrl(""); setForm({ title: "", class_room_id: "", scheduled_at: "", duration_minutes: 45 }); }}
                    className="w-full py-3 border-2 border-indigo-200 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
                    Yeni Ders Oluştur
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Ders Başlığı</label>
                    <input type="text" value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Örn: Limit ve Türev"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none text-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Sınıf / Grup</label>
                    <select value={form.class_room_id}
                      onChange={(e) => setForm({ ...form, class_room_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none text-sm transition-all">
                      <option value="">Sınıf seçin (isteğe bağlı)</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarih ve Saat <span className="text-red-500">*</span></label>
                      <input type="datetime-local" value={form.scheduled_at}
                        onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none text-sm transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Süre (dk)</label>
                      <input type="number" min={15} max={180} value={form.duration_minutes}
                        onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none text-sm transition-all" />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>
                  )}
                  <button onClick={handleCreate} disabled={saving}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/25 active:scale-[0.98]">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                      : <><Video className="w-4 h-4" /> Ders Oluştur</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Ders Listesi ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4.5 h-4.5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900">Yaklaşan Dersler</h3>
                </div>
                <button onClick={loadLessons} disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {loading ? (
                <div className="p-4 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : upcoming.length === 0 ? (
                <div className="p-10 text-center">
                  <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Yaklaşan ders yok</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {upcoming.map((l) => {
                    const sc = STATUS_CONFIG[l.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled;
                    return (
                      <div key={l.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-sm truncate">{l.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(l.scheduled_at)}
                            {l.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />{l.duration_minutes} dk
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${sc.cls}`}>{sc.label}</span>
                          {l.daily_room_url && (
                            <button onClick={() => copyLink(l.daily_room_url!)}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Linki kopyala">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {l.status === "live" && l.daily_room_url && (
                            <a href={l.daily_room_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors">
                              <Play className="w-3 h-3" fill="white" /> Katıl
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  <h3 className="font-bold text-slate-700 text-sm">Geçmiş Dersler</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {past.slice(0, 5).map((l) => (
                    <div key={l.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">{l.title}</p>
                        <p className="text-xs text-slate-400">{fmtDate(l.scheduled_at)}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        Tamamlandı
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
