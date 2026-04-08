"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ExamSession } from "@/lib/api";
import {
  Play, Clock, BarChart3, Trophy, RefreshCw, CheckCircle,
  ChevronRight, Loader2, AlertCircle, Target, TrendingUp,
  TrendingDown, Minus, Calendar, ArrowRight, Zap
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
    gradient: "from-emerald-600 via-emerald-700 to-teal-800",
    shadow: "shadow-emerald-500/40",
    spine: "bg-emerald-900",
    accentColor: "#059669",
    badgeColor: "bg-emerald-500",
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

// ─── Geçmiş deneme satırı ─────────────────────────────────────────────────────

function HistoryRow({ session }: { session: ExamSession }) {
  const router = useRouter();
  const net = (session as Record<string, unknown>).net_score as number ?? 0;
  const examType = session.exam_type ?? "TYT";
  const examConfig = EXAM_TYPES.find((e) => e.key === examType) ?? EXAM_TYPES[0];

  const date = session.finished_at
    ? new Date(session.finished_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

  const correct = session.correct_count ?? 0;
  const wrong = session.wrong_count ?? 0;
  const empty = session.empty_count ?? 0;
  const total = correct + wrong + empty;

  const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;
  const netSign = net >= 0 ? "+" : "";

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group cursor-pointer"
      onClick={() => router.push(`/ogrenci/deneme/${session.id}/sonuc`)}>

      {/* Sınav rozeti */}
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-b ${examConfig.gradient} flex items-center justify-center shrink-0 shadow-sm`}
      >
        <span className="text-xl">{examConfig.icon}</span>
      </div>

      {/* Sol: Bilgi */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-800 text-sm">{examType} Denemesi</span>
          <span className="text-[11px] text-slate-400">{date}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="text-emerald-600">✓ {correct}</span>
          <span className="text-red-500">✗ {wrong}</span>
          <span className="text-slate-400">— {empty}</span>
        </div>
      </div>

      {/* Başarı oranı */}
      <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full transition-all"
            style={{ width: `${successRate}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-400 font-medium">%{successRate}</span>
      </div>

      {/* Net */}
      <div className="text-right shrink-0">
        <p className={`text-xl font-black leading-none ${net > 0 ? "text-emerald-600" : net < 0 ? "text-red-500" : "text-slate-400"}`}>
          {netSign}{net.toFixed(1)}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">net</p>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
    </div>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────

export default function DenemePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingType, setStartingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getExamHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleStartExam = async (examType: ExamType) => {
    setStartingType(examType.key);
    setError(null);
    try {
      const res = await api.startExam({
        exam_type: examType.key,
        question_count: examType.questions,
        duration_minutes: examType.duration,
      });
      const session = (res as Record<string, unknown>).session ?? res;
      const sessionId = (session as ExamSession).id;
      if (!sessionId) {
        setError("Deneme oturumu oluşturulamadı. Lütfen tekrar deneyin.");
        setStartingType(null);
        return;
      }
      const questions = (res as Record<string, unknown>).questions;
      if (Array.isArray(questions) && questions.length) {
        localStorage.setItem(`exam_questions_${sessionId}`, JSON.stringify({
          questions,
          duration: examType.duration,
        }));
      }
      router.push(`/ogrenci/deneme/${sessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deneme başlatılamadı";
      setError(msg.toLowerCase().includes("soru")
        ? "Bu deneme türü için henüz yeterli soru bulunmuyor."
        : msg);
      setStartingType(null);
    }
  };

  // İstatistikler
  const totalExams = history.length;
  const avgNet = totalExams > 0
    ? (history.reduce((a, s) => a + ((s as Record<string, unknown>).net_score as number ?? 0), 0) / totalExams).toFixed(1)
    : "0.0";
  const bestNet = totalExams > 0
    ? Math.max(...history.map((s) => (s as Record<string, unknown>).net_score as number ?? 0)).toFixed(1)
    : "0.0";
  const lastNet = totalExams > 0
    ? ((history[0] as Record<string, unknown>).net_score as number ?? 0).toFixed(1)
    : "—";

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full px-6 py-8 space-y-10">

        {/* ── Başlık ── */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Deneme Sınavları</h1>
          <p className="text-slate-500 mt-1.5 font-medium">
            Gerçek sınav ortamında kendini test et · Anında analiz · Gelişimini takip et
          </p>
        </div>

        {/* ── İstatistik banner (geçmiş varsa) ── */}
        {!loading && totalExams > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBadge
              label="Toplam Deneme"
              value={totalExams}
              icon={Trophy}
              color="text-violet-600"
              bg="bg-violet-50"
            />
            <StatBadge
              label="Ortalama Net"
              value={avgNet}
              icon={BarChart3}
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <StatBadge
              label="En Yüksek Net"
              value={bestNet}
              icon={TrendingUp}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatBadge
              label="Son Deneme"
              value={lastNet}
              icon={Calendar}
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>
        )}

        {/* ── Hata ── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Deneme başlatılamadı</p>
              <p className="text-sm mt-0.5 text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* ── 3D Deneme Kartları ── */}
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Yeni Deneme Başlat
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {EXAM_TYPES.map((exam) => (
              <ExamCard3D
                key={exam.key}
                exam={exam}
                onStart={handleStartExam}
                loading={startingType === exam.key}
              />
            ))}
          </div>
        </div>

        {/* ── Geçmiş Denemeler ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Geçmiş Denemeler
            </h2>
            <button
              onClick={loadHistory}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="divide-y divide-slate-50">
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
            ) : history.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                  <FileQuestion className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="font-bold text-slate-700 text-lg">Henüz deneme yok</h3>
                <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                  Yukarıdan bir deneme türü seç ve ilk denemenize başla!
                </p>
                <div className="flex justify-center gap-3 mt-6">
                  {EXAM_TYPES.map((e) => (
                    <button
                      key={e.key}
                      onClick={() => handleStartExam(e)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${e.gradient} hover:opacity-90 transition-opacity`}
                    >
                      {e.icon} {e.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 p-2">
                {history.map((session) => (
                  <HistoryRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── İpucu banner ── */}
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-indigo-800 text-sm">Deneme stratejisi</p>
            <p className="text-indigo-600 text-xs mt-1 leading-relaxed">
              Haftada en az 1 TYT denemesi çöz. Her deneme sonrasında hata analizini incele ve
              zayıf kazanımlara özel çalışma planı oluştur.
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
    </div>
  );
}

// lucide-react import için eksik
function FileQuestion(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M10 10.3c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
