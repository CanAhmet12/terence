"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, TeacherMessage, ClassRoom, User } from "@/lib/api";
import { MessageSquare, Users, User as UserIcon, Clock, Send, CheckCircle, Bell, Loader2, RefreshCw } from "lucide-react";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function MesajPage() {
  const { token } = useAuth();

  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [tip, setTip] = useState<"sinif" | "ozel">("sinif");
  const [mesaj, setMesaj] = useState("");
  const [seciliSinifId, setSeciliSinifId] = useState<number | "">("");
  const [seciliOgrenciId, setSeciliOgrenciId] = useState<number | "">("");
  const [sendSms, setSendSms] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getTeacherMessages(token);
      setMessages(res);
    } catch {}
    setLoading(false);
  }, [token]);

  const loadClasses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getTeacherClasses(token);
      setClasses(res);
    } catch {}
  }, [token]);

  useEffect(() => {
    loadMessages();
    loadClasses();
  }, [loadMessages, loadClasses]);

  const handleClassChange = async (classId: number) => {
    setSeciliSinifId(classId);
    if (!token || !classId) return;
    setStudentsLoading(true);
    try {
      const res = await api.getClassStudents(classId);
      setStudents(res);
    } catch {}
    setStudentsLoading(false);
  };

  const handleSend = async () => {
    if (!token) return;
    if (tip === "sinif" && !seciliSinifId) {
      setError("Sınıf seçimi zorunludur.");
      return;
    }
    if (tip === "ozel" && !seciliOgrenciId) {
      setError("Öğrenci seçimi zorunludur.");
      return;
    }
    if (!mesaj.trim()) {
      setError("Mesaj alanı zorunludur.");
      return;
    }
    setSending(true);
    setError("");

    try {
      const payload =
        tip === "sinif"
          ? {
              recipient_type: "class" as const,
              recipient_id: seciliSinifId as number,
              recipient_name: classes.find((c) => c.id === seciliSinifId)?.name,
              content: mesaj,
              send_sms: sendSms,
            }
          : {
              recipient_type: "student" as const,
              recipient_id: seciliOgrenciId as number,
              recipient_name: students.find((s) => s.id === seciliOgrenciId)?.name,
              content: mesaj,
              send_sms: sendSms,
            };

      const res = await api.sendMessage(payload as Parameters<typeof api.sendMessage>[0]);
      const msgObj = ((res as Record<string, unknown>)?.message ?? res) as Record<string, unknown>;
      setMessages((prev) => [msgObj, ...prev]);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setMesaj("");
      setSeciliSinifId("");
      setSeciliOgrenciId("");
    } catch (e) {
      setError((e as Error).message);
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mesaj & Duyuru</h1>
          <p className="text-slate-500 mt-1 font-medium">Sınıfa duyuru · Özel mesaj · Otomatik hatırlatıcılar</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Mesaj Formu ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-bold text-slate-900">Yeni Mesaj Gönder</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Tip seçimi */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                {([
                  { key: "sinif" as const, label: "Sınıfa Duyuru", icon: Users },
                  { key: "ozel" as const,  label: "Özel Mesaj",    icon: UserIcon },
                ]).map(({ key, label, icon: Icon }) => (
                  <button key={key}
                    onClick={() => { setTip(key); setSeciliSinifId(""); setSeciliOgrenciId(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      tip === key
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Alıcı seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {tip === "sinif" ? "Sınıf Seç" : "Öğrenci Seç"} <span className="text-red-500">*</span>
                </label>
                {tip === "sinif" ? (
                  <select value={seciliSinifId} onChange={(e) => handleClassChange(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none text-sm transition-all">
                    <option value="">Sınıf seçin</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <select value={seciliSinifId} onChange={(e) => handleClassChange(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none text-sm transition-all">
                      <option value="">Önce sınıf seçin</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {studentsLoading ? (
                      <Skeleton className="h-12 rounded-xl" />
                    ) : students.length > 0 ? (
                      <select value={seciliOgrenciId} onChange={(e) => setSeciliOgrenciId(Number(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none text-sm transition-all">
                        <option value="">Öğrenci seçin</option>
                        {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    ) : seciliSinifId ? (
                      <p className="text-xs text-slate-400 px-1">Bu sınıfta öğrenci bulunamadı.</p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Mesaj */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mesaj <span className="text-red-500">*</span></label>
                <textarea value={mesaj} onChange={(e) => setMesaj(e.target.value)}
                  placeholder="Mesajınızı yazın..." rows={4} maxLength={500}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none resize-none text-sm transition-all" />
                <p className="text-xs text-slate-400 text-right mt-1">{mesaj.length}/500</p>
              </div>

              {/* SMS */}
              <div className="flex items-center gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <input type="checkbox" id="sms" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded border-slate-300" />
                <label htmlFor="sms" className="text-sm font-medium text-amber-800 flex items-center gap-1.5 cursor-pointer">
                  <Bell className="w-4 h-4 text-amber-500" />
                  SMS ile de gönder
                </label>
              </div>

              {sent && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Mesaj başarıyla gönderildi!
                </div>
              )}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
              )}

              <button onClick={handleSend} disabled={sending}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-500/25 active:scale-[0.98]">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                  : <><Send className="w-4 h-4" /> Gönder</>}
              </button>
            </div>
          </div>

          {/* ── Sağ kolon ── */}
          <div className="space-y-5">
            {/* Hatırlatıcılar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="font-bold text-slate-900">Otomatik Hatırlatıcılar</h2>
              </div>
              <div className="space-y-2.5">
                {[
                  { text: "Ödev teslim 24 saat kalmışsa → öğrenciye bildirim", active: true },
                  { text: "3 gün çalışmayan öğrenci → veliye SMS", active: true },
                  { text: "Hedef risk altındaki öğrenci → veliye SMS", active: true },
                  { text: "Canlı ders 15 dk önce → tüm sınıfa bildirim", active: true },
                ].map(({ text, active }, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${active ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{text}</p>
                    <span className={`ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                      {active ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Son Mesajlar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900">Son Mesajlar</h3>
                </div>
                <button onClick={loadMessages} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="p-4 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : messages.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">Henüz mesaj gönderilmemiş.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {messages.slice(0, 8).map((m, i) => {
                    const msg = m as Record<string, unknown>;
                    return (
                      <div key={i} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                          {msg.recipient_type === "class" ? (
                            <Users className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {(msg.recipient_name as string) ?? (msg.recipient_type as string) ?? "—"}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {(msg.content as string)?.slice(0, 60) ?? "—"}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {msg.created_at ? timeAgo(msg.created_at as string) : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
