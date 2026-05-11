"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, examApi, ExamSession, ExamSummaryStats, type ExamTemplateCatalogItem } from "@/lib/api";
import {
  Play, Clock, BarChart3, Trophy, RefreshCw,
  ChevronRight, Loader2, AlertCircle, Target, TrendingUp,
  ArrowRight, Zap, FileQuestion, Search, LayoutGrid, List, Keyboard, Calendar,
  ListOrdered,
} from "lucide-react";

// ─── Tip tanımı ───────────────────────────────────────────────────────────────
interface ExamType {
  key: string;
  label: string;
  desc: string;
  questions: number;
  duration: number;
  gradient: string;
  shadow: string;
  spine: string;
  accentColor: string;
  badgeColor: string;
  icon: string;
}

const EXAM_TYPES: ExamType[] = [
  {
    key: "TYT",
    label: "TYT",
    desc: "Temel Yeterlilik Testi",
    questions: 120,
    duration: 135,
    gradient: "from-indigo-600 via-indigo-700 to-indigo-800",
    shadow: "shadow-indigo-500/40",
    spine: "bg-indigo-900",
    accentColor: "#6366f1",
    badgeColor: "bg-indigo-500",
    icon: "📘",
  },
  {
    key: "AYT",
    label: "AYT",
    desc: "Alan Yeterlilik Testi",
    questions: 80,
    duration: 180,
    gradient: "from-violet-600 via-violet-700 to-purple-800",
    shadow: "shadow-violet-500/40",
    spine: "bg-violet-900",
    accentColor: "#7c3aed",
    badgeColor: "bg-violet-500",
    icon: "📗",
  },
  {
    key: "LGS",
    label: "LGS",
    desc: "Liselere Geçiş Sınavı",
    questions: 90,
    duration: 90,
    gradient: "from-cyan-600 via-cyan-700 to-cyan-800",
    shadow: "shadow-cyan-500/40",
    spine: "bg-cyan-900",
    accentColor: "#0891b2",
    badgeColor: "bg-cyan-500",
    icon: "📙",
  },
  {
    key: "Mini",
    label: "Mini",
    desc: "Hızlı Pratik Testi",
    questions: 20,
    duration: 30,
    gradient: "from-amber-500 via-amber-600 to-orange-700",
    shadow: "shadow-amber-500/40",
    spine: "bg-amber-900",
    accentColor: "#d97706",
    badgeColor: "bg-amber-500",
    icon: "⚡",
  },
  {
    key: "KPSS",
    label: "KPSS",
    desc: "Kamu Personeli Seçme Sınavı",
    questions: 120,
    duration: 120,
    gradient: "from-sky-600 via-blue-700 to-slate-800",
    shadow: "shadow-sky-500/40",
    spine: "bg-sky-900",
    accentColor: "#0284c7",
    badgeColor: "bg-sky-500",
    icon: "📋",
  },
];

// ─── Yardımcı bileşenler ─────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function StatBadge({
  label, value, icon: Icon, color, bg
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-5 py-4 ${bg} rounded-2xl border border-white/50`}>
      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function formatDurationSeconds(sec: number): string {
  if (!sec || sec < 60) return `${Math.max(0, Math.round(sec))} sn`;
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}s ${m % 60}dk`;
  return `${m} dk`;
}

function maxNetReference(profileExamType: string | undefined): number {
  if (!profileExamType) return 120;
  if (profileExamType === "TYT-AYT") return 120;
  const t = EXAM_TYPES.find((e) => e.key === profileExamType);
  return t?.questions ?? 120;
}

function avgAnsweredPercent(history: ExamSession[]): number {
  const rows = history.filter((h) => (h.total_questions ?? 0) > 0);
  if (!rows.length) return 0;
  const sum = rows.reduce((a, s) => {
    const tq = s.total_questions ?? 1;
    const answered = (s.correct_count ?? 0) + (s.wrong_count ?? 0);
    return a + (answered / tq) * 100;
  }, 0);
  return Math.round(sum / rows.length);
}

// ─── 3D Kart ─────────────────────────────────────────────────────────────────

function ExamCard3D({
  exam,
  onStart,
  loading,
}: {
  exam: ExamType;
  onStart: (exam: ExamType) => void;
  loading: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group cursor-pointer select-none"
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !loading && onStart(exam)}
    >
      {/* Dış wrapper — 3D transform */}
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: hovered
            ? "rotateY(-12deg) rotateX(6deg) translateY(-8px) scale(1.03)"
            : "rotateY(-6deg) rotateX(2deg)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          filter: hovered
            ? `drop-shadow(0 24px 48px ${exam.accentColor}60)`
            : `drop-shadow(0 8px 24px ${exam.accentColor}30)`,
        }}
      >
        <div className="flex" style={{ height: "260px" }}>

          {/* Kitap sırtı */}
          <div
            className={`${exam.spine} flex flex-col items-center justify-between py-4`}
            style={{ width: "28px", borderRadius: "8px 0 0 8px", flexShrink: 0 }}
          >
            <div className="w-4 h-4 rounded-sm bg-white/20 flex items-center justify-center">
              <span className="text-[8px] font-black text-white/80">3D</span>
            </div>
            <div
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "9px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {exam.label}
            </div>
            <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
              2026
            </div>
          </div>

          {/* Kitap kapağı */}
          <div
            className={`relative overflow-hidden bg-gradient-to-b ${exam.gradient} flex-1 flex flex-col`}
            style={{ borderRadius: "0 12px 12px 0", position: "relative" }}
          >
            {/* Parlaklık efekti */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
                pointerEvents: "none",
              }}
            />

            {/* Üst: Yayın bilgisi */}
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                TERENCE EĞİTİM
              </span>
              <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-md ${exam.badgeColor}/60`}>
                {exam.questions} Soru
              </span>
            </div>

            {/* Orta: Büyük ikon + isim */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
              <div className="text-5xl mb-3" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>
                {exam.icon}
              </div>
              <h3 className="text-white font-black text-2xl leading-none tracking-tight">
                {exam.label}
              </h3>
              <p className="text-white/70 text-[11px] font-medium mt-1.5 leading-tight">
                {exam.desc}
              </p>
            </div>

            {/* Alt: Süre + Başla */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 text-white/70 text-[11px] font-medium">
                  <Clock className="w-3 h-3" />
                  {exam.duration} dk
                </div>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <button
                className={`w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all
                  ${hovered
                    ? "bg-white/30 backdrop-blur-sm shadow-lg"
                    : "bg-white/15 hover:bg-white/25"
                  }`}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4" fill="white" />
                    Denemeye Başla
                  </>
                )}
              </button>
            </div>

            {/* Sağ kenar gölgesi */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "20px",
                background: "linear-gradient(to right, transparent, rgba(0,0,0,0.15))",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Kart alt gölgesi */}
        <div
          style={{
            position: "absolute",
            bottom: "-10px",
            left: "15%",
            right: "5%",
            height: "14px",
            background: `${exam.accentColor}40`,
            borderRadius: "50%",
            filter: "blur(8px)",
            transform: hovered ? "scaleX(1.1) translateY(4px)" : "scaleX(1)",
            transition: "all 0.4s",
          }}
        />
      </div>

      {/* Kart altında bilgi */}
      <div className="mt-5 text-center">
        <p className="text-sm font-bold text-slate-800">{exam.label} Denemesi</p>
        <p className="text-xs text-slate-500 mt-0.5">{exam.questions} soru · {exam.duration} dakika</p>
      </div>
    </div>
  );
}

function HistoryGridCard({ session }: { session: ExamSession }) {
  const router = useRouter();
  const net = Number(session.net_score ?? 0);
  const examType = session.exam_type ?? "TYT";
  const examConfig = EXAM_TYPES.find((e) => e.key === examType) ?? EXAM_TYPES[0];
  const date = session.finished_at
    ? new Date(session.finished_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
    : "—";
  return (
    <button
      type="button"
      onClick={() => router.push(`/ogrenci/deneme/${session.id}/sonuc`)}
      className={`text-left rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow bg-gradient-to-br ${examConfig.gradient} bg-opacity-5 from-white to-slate-50`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{examConfig.icon}</span>
        <span className="text-lg font-black text-slate-900">{net.toFixed(1)}</span>
      </div>
      <p className="text-sm font-bold text-slate-800">{session.title ?? `${examType} Denemesi`}</p>
      <p className="text-[11px] text-slate-500 mt-1">{date}</p>
    </button>
  );
}

function HistoryDataTable({ sessions }: { sessions: ExamSession[] }) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
            <th className="py-3 px-4">Deneme</th>
            <th className="py-3 px-4 hidden sm:table-cell">Tarih</th>
            <th className="py-3 px-4">Net</th>
            <th className="py-3 px-4 hidden md:table-cell">D / Y / B</th>
            <th className="py-3 px-4 hidden lg:table-cell">Süre</th>
            <th className="py-3 px-4 w-28 hidden sm:table-cell">Başarı</th>
            <th className="py-3 px-4 w-10" />
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => {
            const net = Number(session.net_score ?? 0);
            const correct = session.correct_count ?? 0;
            const wrong = session.wrong_count ?? 0;
            const empty = session.empty_count ?? 0;
            const total = correct + wrong + empty;
            const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
            const examType = session.exam_type ?? "TYT";
            const title = session.title ?? `${examType} Denemesi`;
            const date = session.finished_at
              ? new Date(session.finished_at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })
              : "—";
            return (
              <tr
                key={session.id}
                className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer"
                onClick={() => router.push(`/ogrenci/deneme/${session.id}/sonuc`)}
              >
                <td className="py-3 px-4 font-semibold text-slate-800 max-w-[180px] truncate">{title}</td>
                <td className="py-3 px-4 text-slate-500 hidden sm:table-cell whitespace-nowrap">{date}</td>
                <td className="py-3 px-4 font-black text-cyan-700">{net.toFixed(1)}</td>
                <td className="py-3 px-4 text-xs text-slate-600 hidden md:table-cell whitespace-nowrap">
                  <span className="text-cyan-600 font-semibold">{correct}</span>
                  {" / "}
                  <span className="text-red-500 font-semibold">{wrong}</span>
                  {" / "}
                  <span className="text-slate-400">{empty}</span>
                </td>
                <td className="py-3 px-4 text-slate-500 hidden lg:table-cell whitespace-nowrap">
                  {session.time_spent_seconds != null ? formatDurationSeconds(session.time_spent_seconds) : "—"}
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">%{pct}</span>
                </td>
                <td className="py-3 px-4 text-slate-300">
                  <ChevronRight className="w-4 h-4" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TemplateCard({
  item,
  onStart,
  loading,
}: {
  item: ExamTemplateCatalogItem;
  onStart: (item: ExamTemplateCatalogItem) => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !loading && onStart(item)}
      disabled={loading}
      className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all min-w-[200px] max-w-[260px] shrink-0"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
          <ListOrdered className="w-5 h-5 text-cyan-700" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{item.title}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {item.exam_type} · {item.question_count} soru · {item.duration_minutes} dk
          </p>
        </div>
      </div>
      {loading ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-cyan-700 font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Başlatılıyor…
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-cyan-700">
          Başlat <ChevronRight className="w-3.5 h-3.5" />
        </div>
      )}
    </button>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────

export default function DenemePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<ExamSession[]>([]);
  const [summary, setSummary] = useState<ExamSummaryStats | null>(null);
  const [insight, setInsight] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingType, setStartingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"new" | "history">("new");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterType, setFilterType] = useState<string>("all");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<ExamTemplateCatalogItem[]>([]);

  const profileExamType = user?.target_exam ?? user?.exam_goal;
  const maxRef = maxNetReference(typeof profileExamType === "string" ? profileExamType : undefined);

  const availableExamTypes = useMemo(() => {
    if (!profileExamType || profileExamType === "GENEL") {
      return EXAM_TYPES.filter((item) => item.key === "Mini");
    }
    if (profileExamType === "TYT-AYT") {
      return EXAM_TYPES.filter((item) => ["TYT", "AYT", "Mini"].includes(item.key));
    }
    return EXAM_TYPES.filter((item) => item.key === profileExamType || item.key === "Mini");
  }, [profileExamType]);

  const visibleTemplates = useMemo(() => {
    const keys = new Set(availableExamTypes.map((e) => e.key));
    const pe = typeof profileExamType === "string" ? profileExamType : undefined;
    return templates.filter((t) => {
      if (keys.has(t.exam_type)) return true;
      if (pe === "TYT-AYT" && (t.exam_type === "TYT" || t.exam_type === "AYT")) return true;
      return false;
    });
  }, [templates, availableExamTypes, profileExamType]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, sum, tpl] = await Promise.all([
        api.getExamHistory(),
        api.getExamSummary().catch(() => null),
        examApi.listExamTemplates().catch(() => []),
      ]);
      setHistory(Array.isArray(hist) ? hist : []);
      setSummary(sum);
      setTemplates(Array.isArray(tpl) ? tpl : []);
    } catch {
      setHistory([]);
      setSummary(null);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const first = history[0];
    if (!first?.id) {
      setInsight(null);
      return;
    }
    let cancelled = false;
    api
      .getExamResult(first.id)
      .then((r) => {
        if (!cancelled) setInsight(r);
      })
      .catch(() => {
        if (!cancelled) setInsight(null);
      });
    return () => {
      cancelled = true;
    };
  }, [history]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      setPaletteQuery("");
      setTimeout(() => paletteInputRef.current?.focus(), 50);
    }
  }, [paletteOpen]);

  const handleStartExam = async (examType: ExamType) => {
    setStartingType(examType.key);
    setError(null);
    try {
      const res = await examApi.startExam({
        exam_type: examType.key,
        question_count: examType.questions,
        duration_minutes: examType.duration,
      });
      const session = res.session ?? res;
      const sessionId = session.id;
      if (!sessionId) {
        setError("Deneme oturumu oluşturulamadı. Lütfen tekrar deneyin.");
        setStartingType(null);
        return;
      }
      const questions = res.questions;
      if (Array.isArray(questions) && questions.length) {
        localStorage.setItem(
          `exam_questions_${sessionId}`,
          JSON.stringify({
            questions,
            duration: examType.duration,
          }),
        );
      }
      setPaletteOpen(false);
      router.push(`/ogrenci/deneme/${sessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deneme başlatılamadı";
      setError(
        msg.toLowerCase().includes("soru")
          ? "Bu deneme türü için henüz yeterli soru bulunmuyor."
          : msg,
      );
      setStartingType(null);
    }
  };

  const handleStartTemplate = async (tpl: ExamTemplateCatalogItem) => {
    const key = `template-${tpl.id}`;
    setStartingType(key);
    setError(null);
    try {
      const res = await examApi.startExam({
        exam_type: tpl.exam_type,
        mode: "template",
        exam_template_id: tpl.id,
        duration_minutes: tpl.duration_minutes,
      });
      const session = res.session ?? res;
      const sessionId = session.id;
      if (!sessionId) {
        setError("Deneme oturumu oluşturulamadı. Lütfen tekrar deneyin.");
        setStartingType(null);
        return;
      }
      const questions = res.questions;
      if (Array.isArray(questions) && questions.length) {
        localStorage.setItem(
          `exam_questions_${sessionId}`,
          JSON.stringify({
            questions,
            duration: tpl.duration_minutes,
          }),
        );
      }
      setPaletteOpen(false);
      router.push(`/ogrenci/deneme/${sessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deneme başlatılamadı";
      setError(
        msg.toLowerCase().includes("soru") || msg.toLowerCase().includes("uygun")
          ? "Bu deneme şu an profiliniz veya soru durumu için uygun değil."
          : msg,
      );
      setStartingType(null);
    }
  };

  const filteredHistory = useMemo(() => {
    let h = history;
    if (filterType !== "all") {
      h = h.filter((s) => (s.exam_type ?? "TYT") === filterType);
    }
    const q = paletteQuery.trim().toLowerCase();
    if (q) {
      h = h.filter(
        (s) =>
          (s.title ?? "").toLowerCase().includes(q) ||
          (s.exam_type ?? "").toLowerCase().includes(q),
      );
    }
    return h;
  }, [history, filterType, paletteQuery]);

  const totalExams = summary?.total_completed ?? history.length;
  const avgNetStr =
    summary != null
      ? summary.avg_net.toFixed(1)
      : history.length > 0
        ? (
            history.reduce((a, s) => a + Number(s.net_score ?? 0), 0) / history.length
          ).toFixed(1)
        : "0.0";
  const bestNetStr =
    summary != null
      ? summary.best_net.toFixed(1)
      : history.length > 0
        ? Math.max(...history.map((s) => Number(s.net_score ?? 0))).toFixed(1)
        : "0.0";
  const answeredPct = avgAnsweredPercent(history);
  const avgTimeLabel =
    summary != null && summary.avg_time_seconds > 0
      ? formatDurationSeconds(summary.avg_time_seconds)
      : "—";

  const paletteFilteredExams = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return availableExamTypes;
    return availableExamTypes.filter((e) => e.label.toLowerCase().includes(q) || e.key.toLowerCase().includes(q));
  }, [availableExamTypes, paletteQuery]);

  const paletteFilteredHistory = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return history.slice(0, 8);
    return history
      .filter(
        (s) =>
          (s.title ?? "").toLowerCase().includes(q) ||
          (s.exam_type ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [history, paletteQuery]);

  const paletteFilteredTemplates = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return visibleTemplates.slice(0, 8);
    return visibleTemplates
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.exam_type.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [visibleTemplates, paletteQuery]);

  return (
    <div className="bg-slate-50 min-h-full min-w-0 overflow-x-hidden">
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-slate-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Deneme araması"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={paletteInputRef}
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Deneme veya geçmiş ara…"
                className="flex-1 text-sm outline-none placeholder:text-slate-400"
              />
              <kbd className="hidden sm:inline text-[10px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Esc</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 text-sm">
              <p className="px-2 py-1 text-xs font-bold text-slate-400 uppercase">Yeni başlat</p>
              {paletteFilteredExams.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-cyan-50 flex items-center justify-between"
                  onClick={() => handleStartExam(e)}
                >
                  <span>
                    {e.icon} {e.label}
                  </span>
                  <span className="text-xs text-slate-400">{e.questions} soru</span>
                </button>
              ))}
              {paletteFilteredTemplates.length > 0 && (
                <>
                  <p className="px-2 py-1 mt-2 text-xs font-bold text-slate-400 uppercase">Hazır denemeler</p>
                  {paletteFilteredTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 flex items-center justify-between gap-2"
                      onClick={() => handleStartTemplate(t)}
                    >
                      <span className="truncate">
                        <ListOrdered className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                        {t.title}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">{t.question_count} soru</span>
                    </button>
                  ))}
                </>
              )}
              <p className="px-2 py-1 mt-2 text-xs font-bold text-slate-400 uppercase">Geçmiş</p>
              {paletteFilteredHistory.length === 0 ? (
                <p className="px-3 py-2 text-slate-500 text-xs">Eşleşme yok</p>
              ) : (
                paletteFilteredHistory.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between"
                    onClick={() => {
                      setPaletteOpen(false);
                      router.push(`/ogrenci/deneme/${s.id}/sonuc`);
                    }}
                  >
                    <span className="truncate">{s.title ?? `${s.exam_type} Denemesi`}</span>
                    <span className="text-xs text-cyan-700 font-bold shrink-0 ml-2">{Number(s.net_score ?? 0).toFixed(1)} net</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full min-w-0 px-3 py-8 sm:px-4 lg:px-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] gap-6 lg:gap-8 items-start">
          <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-600 text-white px-6 py-10 sm:px-10 sm:py-12">
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,white,transparent_50%)]" />
              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Deneme Sınavları</h1>
                  <p className="mt-2 text-white/85 text-sm sm:text-base max-w-xl font-medium">
                    Gerçek sınav süresinde çöz · Anında net ve ders analizi · Gelişimini tek yerden izle
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setPaletteOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold border border-white/30"
                    >
                      <Search className="w-4 h-4" />
                      Ara
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono opacity-80">
                        <Keyboard className="w-3 h-3" /> Ctrl+K
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("new");
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold shadow-lg"
                    >
                      <Play className="w-4 h-4" fill="currentColor" />
                      Hızlı başlat
                    </button>
                  </div>
                </div>
                <div className="hidden lg:flex w-44 h-44 rounded-3xl bg-white/10 border border-white/20 items-center justify-center shrink-0">
                  <FileQuestion className="w-24 h-24 text-white/90" strokeWidth={1.25} />
                </div>
              </div>
            </div>

            {/* KPI */}
            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatBadge label="Toplam tamamlanan" value={totalExams} icon={Trophy} color="text-violet-600" bg="bg-violet-50" />
                <StatBadge label="Ort. cevaplanma" value={`%${answeredPct}`} icon={BarChart3} color="text-indigo-600" bg="bg-indigo-50" />
                <StatBadge label={`Ort. net / ${maxRef}`} value={avgNetStr} icon={TrendingUp} color="text-cyan-600" bg="bg-cyan-50" />
                <StatBadge label={`En yüksek / ${maxRef}`} value={bestNetStr} icon={Calendar} color="text-cyan-600" bg="bg-cyan-50" />
                <StatBadge label="Ort. süre" value={avgTimeLabel} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
              </div>
            )}

            {summary != null && summary.this_week_count > 0 && (
              <p className="text-xs text-slate-500 -mt-4">
                Bu hafta tamamlanan: <strong className="text-slate-800">{summary.this_week_count}</strong> deneme
              </p>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Deneme başlatılamadı</p>
                  <p className="text-sm mt-0.5 text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Sekmeler */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
              {(
                [
                  { id: "new" as const, label: "Yeni deneme" },
                  { id: "history" as const, label: "Geçmiş" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    tab === t.id ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "new" && (
              <div className="space-y-10">
                {visibleTemplates.length > 0 && (
                  <div>
                    <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                      <ListOrdered className="w-5 h-5 text-indigo-600" />
                      Hazır denemeler
                    </h2>
                    <p className="text-sm text-slate-600 mb-4 max-w-2xl">
                      Kurumun yayınladığı sabit soru setleri. Sıra ve süre önceden tanımlıdır.
                    </p>
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                      {visibleTemplates.map((t) => (
                        <div key={t.id} className="snap-start">
                          <TemplateCard
                            item={t}
                            onStart={handleStartTemplate}
                            loading={startingType === `template-${t.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Deneme türü seç
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                  {availableExamTypes.map((exam) => (
                    <ExamCard3D key={exam.key} exam={exam} onStart={handleStartExam} loading={startingType === exam.key} />
                  ))}
                </div>
                </div>
              </div>
            )}

            {tab === "history" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    Geçmiş denemeler
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700"
                    >
                      <option value="all">Tümü</option>
                      {EXAM_TYPES.map((e) => (
                        <option key={e.key} value={e.key}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`p-2 ${viewMode === "grid" ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
                        aria-label="Izgara"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`p-2 ${viewMode === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
                        aria-label="Liste"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={loadData}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors px-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      Yenile
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {loading ? (
                    <div className="divide-y divide-slate-50 p-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4">
                          <Skeleton className="w-12 h-12 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                          <Skeleton className="w-12 h-8" />
                        </div>
                      ))}
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-16 px-6">
                      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                        <FileQuestion className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="font-bold text-slate-700 text-lg">Kayıt yok</h3>
                      <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                        Filtreyi değiştir veya yeni bir deneme başlat.
                      </p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredHistory.map((session) => (
                        <HistoryGridCard key={session.id} session={session} />
                      ))}
                    </div>
                  ) : (
                    <HistoryDataTable sessions={filteredHistory} />
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-indigo-800 text-sm">Deneme stratejisi</p>
                <p className="text-indigo-600 text-xs mt-1 leading-relaxed">
                  Haftada en az bir tam süre denemesi çöz. Sonuç sayfasındaki ders dağılımını inceleyip zayıf kazanımları planına ekle.
                </p>
              </div>
              <a
                href="/ogrenci/rapor"
                className="shrink-0 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Raporlar
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Sağ sütun */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Son deneme özeti</p>
              {!history[0] ? (
                <p className="text-sm text-slate-500">Henüz tamamlanan deneme yok.</p>
              ) : (
                <>
                  <p className="font-bold text-slate-900">{history[0].title ?? `${history[0].exam_type ?? "TYT"} Denemesi`}</p>
                  <p className="text-2xl font-black text-cyan-600 mt-2">{Number(history[0].net_score ?? 0).toFixed(2)} net</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {history[0].finished_at
                      ? new Date(history[0].finished_at!).toLocaleString("tr-TR")
                      : ""}
                  </p>
                  {insight?.subject_breakdown && Object.keys(insight.subject_breakdown).length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-bold text-slate-500">Ders netleri</p>
                      {Object.entries(insight.subject_breakdown)
                        .slice(0, 8)
                        .map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 truncate pr-2">{k}</span>
                            <span className="font-bold text-slate-900 shrink-0">{v.net.toFixed(1)}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-3">Detaylı ders dağılımı yükleniyor…</p>
                  )}
                </>
              )}
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500 leading-relaxed">
              Tüm metrikler sunucudaki tamamlanan denemelerinizden hesaplanır; gösterilen sosyal kanıt veya sahte sayılar yoktur.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
