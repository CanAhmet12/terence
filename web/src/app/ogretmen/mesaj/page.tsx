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
      const res = await api.getClassStudents(token, classId);
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

      const res = await api.sendMessage(token, payload);
      setMessages((prev) => [res.message, ...prev]);
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
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mesaj & Duyuru</h1>
        <p className="text-slate-600 mt-1">Sınıfa duyuru · Özel mesaj · Otomatik hatırlatıcılar</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Mesaj formu */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Send className="w-5 h-5 text-teal-600" />
            Yeni Mesaj Gönder
          </h2>

          {/* Tip seçimi */}
          <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-xl">
            {([
              { key: "sinif", label: "Sınıfa Duyuru", icon: Users },
              { key: "ozel", label: "Özel Mesaj", icon: UserIcon },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTip(key); setSeciliSinifId(""); setSeciliOgrenciId(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  tip === key ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Alıcı seçimi */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {tip === "sinif" ? "Sınıf Seç" : "Öğrenci Seç"} <span className="text-red-500">*</span>
            </label>
            {tip === "sinif" ? (
              <select
                value={seciliSinifId}
                onChange={(e) => handleClassChange(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Sınıf seçin</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <>
                <select
                  value={seciliSinifId}
                  onChange={(e) => handleClassChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none mb-2"
                >
                  <option value="">Önce sınıf seçin</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {studentsLoading ? (
                  <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ) : students.length > 0 ? (
                  <select
                    value={seciliOgrenciId}
                    onChange={(e) => setSeciliOgrenciId(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Öğrenci seçin</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : seciliSinifId ? (
                  <p className="text-xs text-slate-500 px-1">Bu sınıfta öğrenci bulunamadı.</p>
                ) : null}
              </>
            )}
          </div>

          {/* Mesaj */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mesaj <span className="text-red-500">*</span></label>
            <textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Mesajınızı yazın..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{mesaj.length}/500</p>
          </div>

          {/* SMS seçeneği */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-5">
            <input
              type="checkbox"
              id="sms"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300"
            />
            <label htmlFor="sms" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              SMS ile de gönder (NetGSM)
            </label>
          </div>

          {sent && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700 font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Mesaj başarıyla gönderildi!
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {sending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Gönderiliyor...</>
            ) : (
              <><Send className="w-5 h-5" /> Gönder</>
            )}
          </button>
        </div>

        {/* Sağ kolon */}
        <div className="space-y-5">
          {/* Otomatik hatırlatıcılar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-teal-600" />
              Otomatik Hatırlatıcılar
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Sistem aşağıdaki durumlarda otomatik bildirim gönderir:
            </p>
            <ul className="space-y-2.5">
              {[
                "Ödev teslim tarihi 24 saat kalmışsa → öğrenciye bildirim",
                "3 gün çalışmayan öğrenci → veliye SMS",
                "Hedef risk altındaki öğrenci → veliye SMS",
                "Canlı ders başlamadan 15 dk önce → tüm sınıfa bildirim",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-teal-500" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Gönderilen mesajlar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                Son Mesajlar
              </h3>
              <button onClick={loadMessages} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Henüz mesaj gönderilmemiş.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {messages.map((m) => (
                  <div key={m.id} className="p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center ${m.recipient_type === "class" ? "bg-teal-100" : "bg-indigo-100"}`}>
                        {m.recipient_type === "class"
                          ? <Users className="w-3.5 h-3.5 text-teal-600" />
                          : <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                        }
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{m.recipient_name}</span>
                      <span className="ml-auto text-xs text-slate-400">{timeAgo(m.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 ml-8">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

