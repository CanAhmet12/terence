"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, TeacherMessage } from "@/lib/api";
import { MessageSquare, Users, User, Clock, Send, CheckCircle, Bell, Loader2, RefreshCw } from "lucide-react";

const DEMO_MESSAGES: TeacherMessage[] = [
  { id: 1, recipient_type: "class", recipient_name: "10-A Matematik", content: "Üslü sayılar ödevinizin teslim tarihi yarın. Lütfen tamamlayın.", created_at: "2026-03-01T10:00:00" },
  { id: 2, recipient_type: "student", recipient_name: "Ahmet Yılmaz", content: "Fizik konusunda geride kaldın. Bugün video izlemeyi unutma.", created_at: "2026-03-02T14:30:00" },
];

const CLASSES = ["10-A Matematik", "10-B Matematik", "11-A Fizik"];
const STUDENTS = ["Ahmet Yılmaz", "Zeynep Kaya", "Burak Demir", "Selin Çelik", "Mehmet Arslan"];

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
  const isDemo = token?.startsWith("demo-token-");

  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [tip, setTip] = useState<"sinif" | "ozel">("sinif");
  const [mesaj, setMesaj] = useState("");
  const [seciliSinif, setSeciliSinif] = useState("");
  const [seciliOgrenci, setSeciliOgrenci] = useState("");
  const [sendSms, setSendSms] = useState(false);

  const loadMessages = useCallback(async () => {
    if (isDemo || !token) {
      setMessages(DEMO_MESSAGES);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getTeacherMessages(token);
      setMessages(res);
    } catch {
      setMessages(DEMO_MESSAGES);
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const handleSend = async () => {
    const recipientId = tip === "sinif" ? seciliSinif : seciliOgrenci;
    if (!recipientId || !mesaj.trim()) {
      setError("Alıcı ve mesaj alanı zorunludur.");
      return;
    }
    setSending(true);
    setError("");

    if (isDemo || !token) {
      await new Promise((r) => setTimeout(r, 600));
      setMessages((prev) => [{
        id: Date.now(),
        recipient_type: tip === "sinif" ? "class" : "student",
        recipient_name: recipientId,
        content: mesaj,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setMesaj("");
      setSending(false);
      return;
    }

    try {
      const res = await api.sendMessage(token, {
        recipient_type: tip === "sinif" ? "class" : "student",
        recipient_id: recipientId,
        content: mesaj,
        send_sms: sendSms,
      });
      setMessages((prev) => [res, ...prev]);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setMesaj("");
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
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
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
              { key: "ozel", label: "Özel Mesaj", icon: User },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTip(key)}
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
                value={seciliSinif}
                onChange={(e) => setSeciliSinif(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Seçin</option>
                {CLASSES.map((c) => <option key={c}>{c}</option>)}
              </select>
            ) : (
              <select
                value={seciliOgrenci}
                onChange={(e) => setSeciliOgrenci(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Seçin</option>
                {STUDENTS.map((s) => <option key={s}>{s}</option>)}
              </select>
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
                { text: "Ödev teslim tarihi 24 saat kalmışsa → öğrenciye bildirim", active: true },
                { text: "3 gün çalışmayan öğrenci → veliye SMS", active: true },
                { text: "Hedef risk altındaki öğrenci → veliye SMS", active: true },
                { text: "Canlı ders başlamadan 15 dk önce → tüm sınıfa bildirim", active: true },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.active ? "bg-teal-500" : "bg-slate-300"}`} />
                  {item.text}
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
                          : <User className="w-3.5 h-3.5 text-indigo-600" />
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
