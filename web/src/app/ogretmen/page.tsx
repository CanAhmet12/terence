"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, type TeacherClass } from "@/lib/api";
import {
  Users,
  TrendingUp,
  FileQuestion,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Plus,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  GraduationCap,
  Zap,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

type TeacherStats = {
  total_students?: number;
  active_today?: number;
  average_net?: number;
  assignment_count?: number;
};

type RiskStudent = {
  id: number;
  name: string;
  net?: number;
  current_net?: number;
  hedef?: number;
  target_net?: number;
  risk_level?: "green" | "yellow" | "red";
  days_inactive?: number;
  xp_points?: number;
};

const RISK_CONFIG = {
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500", label: "Kritik Risk" },
  yellow: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "Dikkat Gereken" },
  green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "İyi Durumda" },
};

function formatKpiNumber(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "—";
}

function formatAverageNet(stats: TeacherStats | null): string {
  if (!stats || typeof stats.average_net !== "number" || Number.isNaN(stats.average_net)) return "—";
  return stats.average_net.toFixed(1);
}

type QuickAssignmentFormProps = {
  token: string | null;
  classes: TeacherClass[];
  classesLoading: boolean;
};

function QuickAssignmentForm({ token, classes, classesLoading }: QuickAssignmentFormProps) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [classRoomId, setClassRoomId] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !topic.trim()) {
      setError("Ders ve konu alanları zorunludur");
      return;
    }
    if (!classRoomId) {
      setError("Ödevin atanacağı sınıfı seçin");
      return;
    }
    if (!token) {
      setError("Oturum bulunamadı");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await api.createAssignment({
        title: `${subject} — ${topic}`,
        subject,
        description: topic,
        due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
        class_room_id: Number(classRoomId),
      });
      const count = typeof res.created_count === "number" ? res.created_count : 1;
      setSent({ count });
      setSubject("");
      setTopic("");
      setClassRoomId("");
      setTimeout(() => setSent(null), 5000);
    } catch (e) {
      setError((e as Error).message || "Ödev oluşturulurken hata oluştu");
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2.5 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700 font-semibold text-sm">
        <CheckCircle className="w-4.5 h-4.5 shrink-0" />
        Ödev oluşturuldu; {sent.count} öğrenciye atandı. Öğrenciler ödev listesinde görebilir.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {classesLoading ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : classes.length === 0 ? (
        <p className="text-sm text-slate-600">
          Henüz sınıf yok.{" "}
          <Link href="/ogretmen/siniflar" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">
            Sınıf oluşturun
          </Link>
          , sonra öğrenci ekleyip ödev atayın.
        </p>
      ) : (
        <select
          value={classRoomId}
          onChange={(e) => setClassRoomId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all bg-white"
        >
          <option value="">Sınıf seçin…</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {typeof (c.students_count ?? c.student_count) === "number"
                ? ` (${c.students_count ?? c.student_count} öğrenci)`
                : ""}
            </option>
          ))}
        </select>
      )}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ders (Matematik...)"
          className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
        />
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Konu (Trigonometri...)"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
        />
      </div>
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !subject.trim() || !topic.trim() || !classRoomId || classes.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Ödev Oluştur ve Gönder
          </>
        )}
      </button>
    </div>
  );
}

export default function OgretmenDashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const [notifContent, setNotifContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [showMsgModal, setShowMsgModal] = useState(false);

  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const list = await api.getTeacherClasses(undefined);
      setClasses(Array.isArray(list) ? list : []);
    } catch {
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadErrors([]);
    const [statsRes, riskRes] = await Promise.allSettled([
      api.getTeacherStats(undefined),
      api.getRiskStudents(undefined),
    ]);
    const errs: string[] = [];
    if (statsRes.status === "fulfilled") setStats(statsRes.value as TeacherStats);
    else errs.push("İstatistikler yüklenemedi.");

    if (riskRes.status === "fulfilled") setRiskStudents(Array.isArray(riskRes.value) ? (riskRes.value as RiskStudent[]) : []);
    else errs.push("Risk listesi yüklenemedi.");

    if (errs.length) setLoadErrors(errs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    loadClasses();
  }, [loadData, loadClasses]);

  const handleBulkNotif = async () => {
    if (!notifContent.trim()) return;

    const confirmed = window.confirm(
      "Tüm sınıflarınızdaki öğrencilere bildirim gönderilecek (öğrenci bildirim merkezinde görünür). Emin misiniz?",
    );
    if (!confirmed) return;

    setSending(true);
    setNotifError(null);
    try {
      await api.sendMessage({ recipient_type: "all", content: notifContent } as Parameters<typeof api.sendMessage>[0]);
      setSent(true);
      setShowMsgModal(false);
      setNotifContent("");
      setTimeout(() => setSent(false), 4000);
    } catch (e) {
      setNotifError((e as Error).message || "Mesaj gönderilemedi. Bağlantınızı kontrol edin.");
    }
    setSending(false);
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Günaydın" : now.getHours() < 18 ? "İyi günler" : "İyi akşamlar";

  const KPI_CARDS = [
    { label: "Toplam Öğrenci", value: formatKpiNumber(stats?.total_students), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Bugün Aktif", value: formatKpiNumber(stats?.active_today), icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Ortalama Net", value: formatAverageNet(stats), icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Açık Ödev", value: formatKpiNumber(stats?.assignment_count), icon: FileQuestion, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const criticalRisk = riskStudents.filter((s) => s.risk_level === "red").slice(0, 5);
  const warningRisk = riskStudents.filter((s) => s.risk_level === "yellow").slice(0, 5);

  return (
    <div className="bg-slate-50 min-h-full min-w-0 overflow-x-hidden">
      <div className="w-full min-w-0 space-y-6 overflow-x-hidden px-3 py-6 sm:space-y-8 sm:px-4 sm:py-8 lg:px-6">
        {loadErrors.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
            <p className="font-semibold">Bazı veriler yüklenemedi</p>
            <ul className="mt-1 list-disc list-inside text-amber-800">
              {loadErrors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => loadData()}
              className="mt-2 text-xs font-bold text-amber-900 underline hover:no-underline"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 p-5 text-white shadow-xl shadow-indigo-500/20 sm:p-8">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-indigo-200 text-sm font-medium">{greeting},</p>
              <h1 className="text-2xl lg:text-3xl font-black mt-1 leading-tight">
                {user?.name?.split(" ")[0] ?? "Öğretmen"} 👋
              </h1>
              <p className="text-indigo-200 text-sm mt-2">
                {now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-black">{riskStudents.filter((s) => s.risk_level === "red").length}</p>
                <p className="text-indigo-200 text-xs mt-0.5">Kritik Öğrenci</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-black">{stats?.total_students ?? "—"}</p>
                <p className="text-indigo-200 text-xs mt-0.5">Toplam Öğrenci</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Kartları ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map(({ label, value, icon: Icon, color, bg }) => {
            const borderColor = color.replace("text-", "bg-");
            return (
              <div
                key={label}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${borderColor}`} />
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
                </div>
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Ana Grid ── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Risk Öğrencileri */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="font-bold text-slate-900">Risk Öğrencileri</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  aria-label="Verileri yenile"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <Link
                  href="/ogretmen/analiz"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Tümünü Gör <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : criticalRisk.length === 0 && warningRisk.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <p className="font-semibold text-slate-700">Risk altında öğrenci yok</p>
                  <p className="text-xs text-slate-400 mt-1">Tüm öğrenciler iyi durumda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...criticalRisk, ...warningRisk].slice(0, 5).map((s) => {
                    const risk = RISK_CONFIG[s.risk_level ?? "green"] ?? RISK_CONFIG.green;
                    const net = s.current_net ?? s.net ?? 0;
                    const target = s.target_net ?? s.hedef ?? 0;
                    return (
                      <div key={s.id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${risk.bg} ${risk.border}`}>
                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center font-bold text-sm text-slate-700 shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{s.name}</p>
                          <p className={`text-[11px] ${risk.text} font-medium`}>
                            {risk.label} · Net: {net} / {target}
                          </p>
                        </div>
                        {s.days_inactive != null && s.days_inactive > 3 && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Clock className={`w-3 h-3 ${risk.text}`} />
                            <span className={`text-[11px] font-medium ${risk.text}`}>{s.days_inactive}g inaktif</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Hızlı Araçlar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900">Hızlı Ödev Oluştur</h3>
              </div>
              <QuickAssignmentForm token={token} classes={classes} classesLoading={classesLoading} />
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Toplu Bildirim</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tüm öğrencilere duyuru (bildirim merkezi)</p>
                </div>
              </div>
              {sent ? (
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" /> Bildirimler gönderildi.
                </div>
              ) : showMsgModal ? (
                <div className="space-y-3">
                  {notifError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {notifError}
                    </div>
                  )}
                  <textarea
                    value={notifContent}
                    onChange={(e) => setNotifContent(e.target.value)}
                    rows={3}
                    placeholder="Duyuru mesajınızı yazın..."
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleBulkNotif}
                      disabled={sending || !notifContent.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sending ? "Gönderiliyor..." : "Gönder"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMsgModal(false);
                        setNotifError(null);
                      }}
                      className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMsgModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-indigo-200 text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Duyuru Yaz
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Hızlı Navigasyon ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: "/ogretmen/siniflar", icon: Users, label: "Sınıflarım", color: "text-indigo-600", bg: "bg-indigo-50" },
            { href: "/ogretmen/analiz", icon: TrendingUp, label: "Analiz", color: "text-violet-600", bg: "bg-violet-50" },
            { href: "/ogretmen/odev", icon: FileQuestion, label: "Ödevler", color: "text-amber-600", bg: "bg-amber-50" },
            { href: "/ogretmen/canli-ders", icon: GraduationCap, label: "Canlı Ders", color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map(({ href, icon: Icon, label, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
              >
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{label}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                  Git <ArrowRight className="w-3 h-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
