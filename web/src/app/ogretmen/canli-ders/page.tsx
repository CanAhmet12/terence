"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, TeacherLesson } from "@/lib/api";
import { Video, Users, Link2, Copy, Calendar, Clock, CheckCircle, RefreshCw, Loader2, Play } from "lucide-react";

const DEMO_LESSONS: TeacherLesson[] = [
  { id: 1, title: "Matematik - 10-A", class_name: "10-A Matematik", scheduled_at: "2026-03-04T14:00:00", duration_minutes: 45, is_recurring: true, meeting_url: "https://meet.terence.com/mat-10a", status: "upcoming" },
  { id: 2, title: "Fizik - 11-A", class_name: "11-A Fizik", scheduled_at: "2026-03-05T10:00:00", duration_minutes: 40, is_recurring: false, meeting_url: "https://meet.terence.com/fiz-11a", status: "upcoming" },
  { id: 3, title: "Matematik - 10-B", class_name: "10-B Matematik", scheduled_at: "2026-03-02T14:00:00", duration_minutes: 45, is_recurring: true, meeting_url: "", status: "finished" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" }) + " " +
    d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG = {
  upcoming: { label: "Yaklaşan", cls: "bg-teal-100 text-teal-700" },
  live: { label: "Canlı", cls: "bg-green-100 text-green-700 animate-pulse" },
  finished: { label: "Tamamlandı", cls: "bg-slate-100 text-slate-500" },
};

export default function CanliDersPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    title: "",
    class_name: "",
    scheduled_at: "",
    duration_minutes: 45,
    is_recurring: false,
  });

  const loadLessons = useCallback(async () => {
    if (isDemo || !token) {
      setLessons(DEMO_LESSONS);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getTeacherLessons(token);
      setLessons(res);
    } catch {
      setLessons(DEMO_LESSONS);
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  const handleCreate = async () => {
    if (!form.scheduled_at || !form.class_name) {
      setError("Tarih, saat ve sınıf alanları zorunludur.");
      return;
    }
    setSaving(true);
    setError("");
    if (isDemo || !token) {
      await new Promise((r) => setTimeout(r, 800));
      setCreatedUrl(`https://meet.terence.com/${Date.now()}`);
      setSaved(true);
      setSaving(false);
      setLessons((prev) => [
        {
          id: Date.now(), title: form.title || form.class_name,
          class_name: form.class_name, scheduled_at: form.scheduled_at,
          duration_minutes: form.duration_minutes, is_recurring: form.is_recurring,
          meeting_url: `https://meet.terence.com/${Date.now()}`, status: "upcoming",
        },
        ...prev,
      ]);
      return;
    }
    try {
      const res = await api.createTeacherLesson(token, form);
      setCreatedUrl(res.meeting_url ?? "");
      setSaved(true);
      setLessons((prev) => [res, ...prev]);
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const upcoming = lessons.filter((l) => l.status !== "finished");
  const past = lessons.filter((l) => l.status === "finished");

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Canlı Ders</h1>
        <p className="text-slate-600 mt-1">Ders planla · Link oluştur · Öğrencilerle paylaş</p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Video className="w-5 h-5 text-teal-600" />
            Yeni Ders Oluştur
          </h2>

          {saved ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-2xl border border-teal-200">
                <CheckCircle className="w-6 h-6 text-teal-600 shrink-0" />
                <div>
                  <p className="font-semibold text-teal-800">Ders oluşturuldu!</p>
                  <p className="text-sm text-teal-600 mt-0.5">Linki öğrencilerle paylaşabilirsin.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ders Linki</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdUrl}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                  />
                  <button
                    onClick={() => copyLink(createdUrl)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Kopyalandı!" : "Kopyala"}
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setSaved(false); setCreatedUrl(""); setForm({ title: "", class_name: "", scheduled_at: "", duration_minutes: 45, is_recurring: false }); }}
                className="w-full py-3 border border-teal-200 text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors"
              >
                Yeni Ders Oluştur
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ders Başlığı (opsiyonel)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Örn: Limit ve Türev"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sınıf / Grup <span className="text-red-500">*</span></label>
                <select
                  value={form.class_name}
                  onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">Seçin</option>
                  <option>10-A Matematik</option>
                  <option>10-B Matematik</option>
                  <option>11-A Fizik</option>
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tarih ve Saat <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Süre (dk)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={form.duration_minutes}
                      onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                      min={15}
                      max={180}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={form.is_recurring}
                  onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-slate-700">
                  Tekrar eden ders (her hafta aynı saat)
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">{error}</div>
              )}

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Oluşturuluyor...</>
                ) : (
                  <><Link2 className="w-5 h-5" /> Canlı Ders Linki Oluştur</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Yaklaşan dersler */}
        <div className="space-y-5">
          {/* Özellikler kartı */}
          <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Canlı Ders Özellikleri</h3>
            <ul className="space-y-2 text-sm text-teal-800">
              {["Kamera, mikrofon, ekran paylaşımı", "Soru sor butonu", "Canlı anket & mini quiz", "Ders sonrası otomatik kayıt arşivi", "Öğrencilere otomatik SMS hatırlatma"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-teal-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Ders listesi */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                Yaklaşan Dersler
              </h3>
              <button onClick={loadLessons} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Yaklaşan ders yok. Formu kullanarak ders oluşturun.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcoming.map((l) => {
                  const sc = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.upcoming;
                  return (
                    <div key={l.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{l.title || l.class_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(l.scheduled_at)}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l.duration_minutes} dk</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.cls}`}>{sc.label}</span>
                        {l.meeting_url && (
                          <button
                            onClick={() => copyLink(l.meeting_url!)}
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
                            title="Linki kopyala"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {l.status === "live" && l.meeting_url && (
                          <a
                            href={l.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            <Play className="w-3 h-3" /> Katıl
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Geçmiş dersler */}
          {past.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Geçmiş Dersler</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {past.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{l.title || l.class_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(l.scheduled_at)}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
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
  );
}
