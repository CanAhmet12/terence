"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, GoalAnalysis } from "@/lib/api";
import {
  Target, TrendingUp, TrendingDown, Calendar, Brain,
  ChevronRight, ChevronLeft, Check, Loader2, AlertTriangle,
  AlertCircle, Sparkles, School, BookOpen, Zap, ArrowRight
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

// Dairesel progress ring
function CircularGoalProgress({ current, target, size = 140 }: {
  current: number; target: number; size?: number;
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const stroke = 12;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900 leading-none">{Math.round(pct)}%</span>
        <span className="text-xs text-slate-500 font-medium mt-1">hedefe doğru</span>
      </div>
    </div>
  );
}

const EXAM_TYPES = [
  { key: "TYT-AYT", label: "TYT + AYT", desc: "Üniversite (4 yıllık)", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-300", icon: "🎓" },
  { key: "TYT",     label: "TYT",        desc: "Üniversite (2 yıllık)", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-300", icon: "📚" },
  { key: "LGS",     label: "LGS",        desc: "Lise geçiş sınavı",    color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-300",icon: "📖" },
  { key: "KPSS",    label: "KPSS",       desc: "Kamu personel seçme",  color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-300",  icon: "🏛️" },
];

const RISK_CONFIG = {
  green:  { bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-800", icon: "text-emerald-500", label: "Hedefe Ulaşabilirsin",    badge: "bg-emerald-100 text-emerald-700" },
  yellow: { bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-800",   icon: "text-amber-500",   label: "Dikkat: Sınır Durumda",  badge: "bg-amber-100 text-amber-700"   },
  red:    { bg: "bg-red-50",      border: "border-red-200",     text: "text-red-800",     icon: "text-red-500",     label: "Yüksek Risk",            badge: "bg-red-100 text-red-700"       },
};

export default function HedefPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<GoalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  // Form state
  const [examType, setExamType] = useState(user?.target_exam ?? user?.exam_goal ?? "TYT-AYT");
  const [targetSchool, setTargetSchool] = useState(user?.target_school ?? "");
  const [targetDept, setTargetDept] = useState(user?.target_department ?? "");
  const [targetNet, setTargetNet] = useState(String(user?.target_net ?? ""));
  const [currentNet, setCurrentNet] = useState(String(user?.current_net ?? ""));
  const [examDate, setExamDate] = useState(user?.exam_date ?? "");

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getGoalAnalysis();
      setAnalysis(res as GoalAnalysis);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnalysis();
    if (user?.goal) {
      setExamType((user.goal as Record<string, unknown>).exam_type as string ?? user.target_exam ?? "TYT-AYT");
      setTargetSchool((user.goal as Record<string, unknown>).target_school as string ?? "");
      setTargetDept((user.goal as Record<string, unknown>).target_department as string ?? "");
      setTargetNet(String((user.goal as Record<string, unknown>).target_net ?? user.target_net ?? ""));
      setCurrentNet(String(user.current_net ?? ""));
    }
  }, [loadAnalysis, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState("saving");
    setSaveError("");
    try {
      const updatedGoal = await api.updateGoal({
        exam_goal: examType,
        target_exam: examType,
        target_school: targetSchool || undefined,
        target_department: targetDept || undefined,
        target_net: targetNet ? parseFloat(targetNet) : undefined,
        current_net: currentNet ? parseFloat(currentNet) : undefined,
        exam_date: examDate || undefined,
      } as Parameters<typeof api.updateGoal>[0]);
      if (user && updatedGoal) {
        updateUser({ ...user, ...(updatedGoal as Record<string, unknown>) });
      }
      const newAnalysis = await api.getGoalAnalysis();
      setAnalysis(newAnalysis as GoalAnalysis);
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Kayıt başarısız");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 5000);
    }
  };

  const current = (() => {
    const v = Number(analysis?.current_net ?? currentNet ?? 0);
    return isNaN(v) ? 0 : v;
  })();
  const target = (() => {
    const v = Number(analysis?.target_net ?? targetNet ?? 0);
    return isNaN(v) ? 0 : v;
  })();
  const remaining = target - current;
  const daysRemaining = analysis?.days_remaining ?? 0;
  const weeklyNeeded = analysis?.weekly_net_needed ?? 0;

  const riskLevel = analysis?.risk_level ?? (
    target > 0 && current >= target * 0.8 ? "green" :
    target > 0 && current >= target * 0.5 ? "yellow" : "red"
  ) as keyof typeof RISK_CONFIG;
  const riskStyle = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.green;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Başlık ── */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hedef & Net</h1>
          <p className="text-slate-500 mt-1 font-medium">Sınav hedefini belirle, ilerleni takip et</p>
        </div>

        {/* ── Ana Grid ── */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* ─ Sol: Durum Kartı ─ */}
          <div className="space-y-5">

            {/* Hedef özeti + progress */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-36 w-36 rounded-full mx-auto" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg">Mevcut Durumum</h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        {examType && (
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg">
                            {examType}
                          </span>
                        )}
                        {targetSchool && (
                          <span className="text-xs text-slate-500 truncate max-w-[150px]">{targetSchool}</span>
                        )}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${riskStyle.badge}`}>
                      {riskStyle.label}
                    </div>
                  </div>

                  {/* Dairesel progress */}
                  {target > 0 && (
                    <div className="flex items-center gap-8">
                      <CircularGoalProgress current={current} target={target} size={130} />
                      <div className="flex-1 space-y-3">
                        {[
                          { label: "Mevcut Net", value: current, color: "text-slate-900" },
                          { label: "Hedef Net",  value: target,  color: "text-indigo-600" },
                          { label: "Fark",       value: remaining > 0 ? `+${remaining}` : remaining, color: remaining > 0 ? "text-amber-600" : "text-emerald-600" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs text-slate-500 font-medium">{label}</span>
                            <span className={`text-base font-black ${color}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {target === 0 && (
                    <div className="text-center py-4">
                      <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Henüz hedef belirlenmemiş</p>
                      <p className="text-sm text-slate-400 mt-1">Sağdaki formu doldurun</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* İstatistik kartları */}
            {!loading && analysis && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Kalan Gün", value: daysRemaining, icon: Calendar, color: "text-violet-600", bg: "bg-violet-50" },
                  { label: "Haftalık Gerekli Net", value: weeklyNeeded > 0 ? `+${weeklyNeeded}` : "—", icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
                    </div>
                    <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Risk uyarısı */}
            {!loading && analysis && riskLevel !== "green" && (
              <div className={`flex items-start gap-4 p-5 rounded-2xl border ${riskStyle.bg} ${riskStyle.border}`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${riskStyle.icon}`} />
                <div>
                  <p className={`font-bold text-sm ${riskStyle.text}`}>{riskStyle.label}</p>
                  <p className={`text-xs mt-1 ${riskStyle.text} opacity-80`}>
                    {riskLevel === "red"
                      ? "Hedefe ulaşmak için çalışma temponuzu önemli ölçüde artırmanız gerekiyor."
                      : "Hedef net için çalışma planınızı gözden geçirmeniz önerilir."
                    }
                  </p>
                  <button
                    onClick={() => router.push("/ogrenci/koc")}
                    className={`flex items-center gap-1 mt-2.5 text-xs font-bold ${riskStyle.text} hover:underline`}
                  >
                    Koça Danış <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─ Sağ: Form ─ */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Hedef Güncelle</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Sınav türü, okul ve net hedefini belirle</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">

              {/* Sınav türü seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Hedef Sınav
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXAM_TYPES.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => setExamType(e.key)}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all text-left ${
                        examType === e.key
                          ? `${e.bg} ${e.border} shadow-sm`
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xl shrink-0">{e.icon}</span>
                      <div>
                        <p className={`text-sm font-bold ${examType === e.key ? e.color : "text-slate-700"}`}>
                          {e.label}
                        </p>
                        <p className="text-[11px] text-slate-400">{e.desc}</p>
                      </div>
                      {examType === e.key && (
                        <Check className={`w-4 h-4 ml-auto shrink-0 ${e.color}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Net değerleri */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mevcut Net
                  </label>
                  <input
                    type="number"
                    value={currentNet}
                    onChange={(e) => setCurrentNet(e.target.value)}
                    placeholder="Örn: 65"
                    min={0}
                    max={200}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hedef Net
                  </label>
                  <input
                    type="number"
                    value={targetNet}
                    onChange={(e) => setTargetNet(e.target.value)}
                    placeholder="Örn: 100"
                    min={0}
                    max={200}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Hedef okul */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5" />
                  Hedef Üniversite / Okul
                </label>
                <input
                  type="text"
                  value={targetSchool}
                  onChange={(e) => setTargetSchool(e.target.value)}
                  placeholder="Örn: Boğaziçi Üniversitesi"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
              </div>

              {/* Bölüm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Hedef Bölüm
                </label>
                <input
                  type="text"
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  placeholder="Örn: Bilgisayar Mühendisliği"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
              </div>

              {/* Sınav tarihi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Tahmini Sınav Tarihi
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
              </div>

              {/* Hata */}
              {saveState === "error" && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {saveError}
                </div>
              )}

              {/* Kaydet */}
              <button
                type="submit"
                disabled={saveState === "saving"}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-500/25 disabled:opacity-70 active:scale-[0.98]"
              >
                {saveState === "saving" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
                ) : saveState === "success" ? (
                  <><Check className="w-4 h-4" /> Hedef Kaydedildi!</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Hedefi Güncelle</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Alt: Motivasyon kartı ── */}
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-indigo-800">Hedefe ulaşmak için koçunla çalış</p>
            <p className="text-sm text-indigo-600 mt-0.5">Kişisel analiz ve öğrenme planı için AI Koçuna danış</p>
          </div>
          <button
            onClick={() => router.push("/ogrenci/koc")}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Koça Git <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
