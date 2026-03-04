"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, RiskStudent } from "@/lib/api";
import {
  AlertTriangle, Users, CheckCircle,
  BarChart2, Clock, Bell, Send, FileQuestion
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Az önce";
  if (hours < 24) return `${hours} saat önce`;
  if (days === 1) return "Dün";
  return `${days} gün önce`;
}

function QuickAssignmentForm({ token }: { token: string | null }) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!token || !subject.trim() || !topic.trim()) return;
    setSending(true);
    try {
      await api.createAssignment(token, {
        title: `${subject} — ${topic}`,
        type: "homework",
        subject,
        description: topic,
        due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
      });
      setSent(true);
      setSubject("");
      setTopic("");
      setTimeout(() => setSent(false), 3000);
    } catch {}
    setSending(false);
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
        <CheckCircle className="w-4 h-4" /> Ödev başarıyla gönderildi!
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Ders</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Matematik"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Konu / Açıklama</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Üslü sayılar — 20 soru"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
        />
      </div>
      <button
        onClick={handleSend}
        disabled={sending || !subject.trim() || !topic.trim()}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors active:scale-95"
      >
        {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
        Gönder
      </button>
      <Link href="/ogretmen/odev" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-indigo-200 text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors">
        <FileQuestion className="w-4 h-4" />
        Tüm Ödevler
      </Link>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const { user, token } = useAuth();

  const [stats, setStats] = useState<{ total_students: number; active_today: number; average_net: number; assignment_count: number } | null>(null);
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifSending, setNotifSending] = useState(false);
  const [notifSent, setNotifSent] = useState(false);
  const [notifDialog, setNotifDialog] = useState(false);
  const [notifContent, setNotifContent] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, riskRes] = await Promise.allSettled([
        api.getTeacherStats(token),
        api.getRiskStudents(token),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (riskRes.status === "fulfilled") setRiskStudents(riskRes.value);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBulkNotif = async () => {
    if (!token || !notifContent.trim()) return;
    setNotifSending(true);
    try {
      await api.sendMessage(token, { recipient_type: "all", content: notifContent });
      setNotifSent(true);
      setNotifDialog(false);
      setNotifContent("");
      setTimeout(() => setNotifSent(false), 4000);
    } catch {}
    setNotifSending(false);
  };

  const riskCount = riskStudents.filter((s) => s.risk_level === "red").length;
  const totalStudents = stats?.total_students ?? 0;
  const activeToday = stats?.active_today ?? 0;
  const avgNet = stats?.average_net ?? 0;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Merhaba, {user?.name || "Öğretmen"}
        </h1>
        <p className="text-slate-600 mt-1 text-lg">
          Sınıf performansı, riskteki öğrenciler, başarı tahmini
        </p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { icon: Users, bg: "bg-teal-50", color: "text-teal-600", label: "Toplam Öğrenci", value: loading ? null : `${totalStudents}` },
          { icon: CheckCircle, bg: "bg-indigo-50", color: "text-indigo-600", label: "Bugün Aktif", value: loading ? null : `${activeToday}` },
          { icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600", label: "Riskteki Öğrenci", value: loading ? null : `${riskCount}` },
          { icon: BarChart2, bg: "bg-amber-50", color: "text-amber-600", label: "Ortalama Net", value: loading ? null : `${avgNet}` },
        ].map(({ icon: Icon, bg, color, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="font-semibold text-slate-700">{label}</span>
            </div>
            {value === null ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Hızlı Ödev Ver widget */}
      <div className="mb-8 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="font-bold text-slate-900">Hızlı Ödev Ver</h2>
        </div>
        <QuickAssignmentForm token={token} />
      </div>

      {/* Başarı Tahmin Paneli */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-900 text-lg">Başarı Tahmin Paneli</h2>
          <Link href="/ogretmen/analiz" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Detaylı Analiz →
          </Link>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Tahmini sınav neti — Yeşil: Hedefte · Sarı: Sınırda · Kırmızı: Risk altında
        </p>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : riskStudents.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm">Henüz öğrenci yok</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {riskStudents.map((o) => (
              <div
                key={o.id}
                className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                  o.risk_level === "green"
                    ? "bg-emerald-50 border-emerald-200"
                    : o.risk_level === "yellow"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 truncate pr-2">{o.name}</span>
                  <span className={`w-3 h-3 rounded-full shrink-0 ${
                    o.risk_level === "green" ? "bg-emerald-500" : o.risk_level === "yellow" ? "bg-amber-500" : "bg-red-500"
                  }`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{o.current_net} net</p>
                {o.target_net && (
                  <p className="text-xs text-slate-500 mt-0.5">Hedef: {o.target_net}</p>
                )}
                {o.days_inactive !== undefined && o.days_inactive > 2 && (
                  <p className="text-xs text-amber-600 mt-1">{o.days_inactive} gün pasif</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alt grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Son aktivite */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-5 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Son Aktivite
          </h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : riskStudents.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">Henüz öğrenci aktivitesi yok.</p>
          ) : (
            <ul className="space-y-3">
              {riskStudents.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="font-medium text-slate-900">{s.name}</span>
                  <span className="text-xs text-slate-500">{timeAgo(s.last_active_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/ogretmen/siniflar" className="mt-4 block text-center py-2.5 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm">
            Tüm Öğrenciler →
          </Link>
        </div>

        {/* Risk merkezi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-5 text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Risk & Uyarı Merkezi
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80">
              <span className="text-slate-700 font-medium">3 gün çalışmayan</span>
              <span className={`text-sm font-bold ${riskCount > 0 ? "text-red-600" : "text-slate-400"}`}>
                {riskStudents.filter((s) => s.days_inactive !== undefined && s.days_inactive >= 3).length} öğrenci
              </span>
            </li>
            <li className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80">
              <span className="text-slate-700 font-medium">Net düşüşü yaşayan</span>
              <span className={`text-sm font-bold ${riskCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {riskStudents.filter((s) => s.risk_level === "red" || s.risk_level === "yellow").length} öğrenci
              </span>
            </li>
            <li className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80">
              <span className="text-slate-700 font-medium">Hedef sınırında</span>
              <span className="text-sm font-bold text-amber-600">
                {riskStudents.filter((s) => s.risk_level === "yellow").length} öğrenci
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Veli Bildirimi */}
      {notifSent && (
        <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-2xl text-sm text-teal-700 font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Toplu bildirim gönderildi!
        </div>
      )}

      {notifDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md mx-4">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Toplu Veli Bildirimi</h3>
            <textarea
              value={notifContent}
              onChange={(e) => setNotifContent(e.target.value)}
              placeholder="Tüm velilere gönderilecek mesaj..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setNotifDialog(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                onClick={handleBulkNotif}
                disabled={notifSending || !notifContent.trim()}
                className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-60"
              >
                {notifSending ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="font-bold text-slate-900 mb-2 text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          Veli Bildirimi
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Riskteki öğrencilerin velilerine otomatik veya manuel bildirim gönder.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setNotifDialog(true)}
            disabled={riskCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:from-teal-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/25"
          >
            <CheckCircle className="w-5 h-5" />
            Toplu Veli Bildirimi ({riskCount} riskteki)
          </button>
          <Link
            href="/ogretmen/mesaj"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium text-slate-700 transition-all"
          >
            Tekli Veli Bildirimi
          </Link>
        </div>
      </div>
    </div>
  );
}

