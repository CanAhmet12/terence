"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { StudentGoalDashboard, GoalTemplate, RiskTier } from "@/lib/goal-dashboard";
import { goalTemplateLabel, resolveGoalTemplateFromUser } from "@/lib/goal-dashboard";
import {
  Target,
  TrendingUp,
  Calendar,
  Loader2,
  AlertTriangle,
  AlertCircle,
  School,
  BookOpen,
  Zap,
  ArrowRight,
  RefreshCw,
  Check,
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function CircularProgress({ current, target, size = 120 }: { current: number; target: number; size?: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const stroke = 10;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 80 ? "#06b6d4" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-900 leading-none">{Math.round(pct)}%</span>
        <span className="text-[10px] text-slate-500 font-medium mt-0.5">hedefe</span>
      </div>
    </div>
  );
}

const RISK_UI: Record<RiskTier, { label: string; badge: string; border: string; text: string }> = {
  on_track: {
    label: "İyi gidiyor",
    badge: "bg-cyan-100 text-cyan-800",
    border: "border-cyan-200",
    text: "text-cyan-800",
  },
  at_risk: {
    label: "Dikkat",
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  critical: {
    label: "Yüksek risk",
    badge: "bg-red-100 text-red-800",
    border: "border-red-200",
    text: "text-red-800",
  },
};

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
      </div>
      <p className="text-lg font-black text-slate-900 leading-tight">{value}</p>
      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function HedefPage() {
  const { user, updateUser } = useAuth();
  const [dash, setDash] = useState<StudentGoalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [saveErr, setSaveErr] = useState("");

  const [targetNet, setTargetNet] = useState("");
  const [examDate, setExamDate] = useState("");
  const [targetSchool, setTargetSchool] = useState("");
  const [targetDept, setTargetDept] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.getStudentGoalDashboard();
      setDash(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Veri yüklenemedi");
      setDash(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    setTargetNet(user.target_net != null ? String(user.target_net) : "");
    setExamDate(user.exam_date?.slice(0, 10) ?? "");
    setTargetSchool(user.target_school ?? "");
    setTargetDept(user.target_department ?? "");
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaveState("saving");
    setSaveErr("");
    try {
      const payload: Record<string, unknown> = {
        target_school: targetSchool || null,
        target_department: targetDept || null,
      };
      if (targetNet.trim() !== "") payload.target_net = parseFloat(targetNet);
      else payload.target_net = null;
      if (examDate) payload.exam_date = examDate;
      else payload.exam_date = null;
      await api.updateProfile(payload as Parameters<typeof api.updateProfile>[0]);
      const me = await api.getMe();
      updateUser(me);
      await load();
      setSaveState("ok");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Kayıt başarısız");
      setSaveState("err");
      setTimeout(() => setSaveState("idle"), 4000);
    }
  };

  const template: GoalTemplate = dash?.template ?? resolveGoalTemplateFromUser(user ?? undefined);
  const snap = dash?.user_snapshot;
  const ins = dash?.insights;
  const exam = dash?.exam_metrics;
  const school = dash?.school_metrics;
  const missing = dash?.data_completeness?.missing ?? [];

  const currentNet = ins?.display_current_net ?? snap?.current_net ?? 0;
  const targetNetNum = ins?.display_target_net ?? snap?.target_net ?? 0;
  const risk = ins?.risk_tier ?? "on_track";
  const riskStyle = RISK_UI[risk] ?? RISK_UI.on_track;

  return (
    <div className="bg-slate-50 min-h-full w-full">
      <div className="w-full max-w-none px-3 sm:px-5 lg:px-6 xl:px-8 py-6 sm:py-8 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Hedef ve Net</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium max-w-xl">
              {template === "school_primary"
                ? "Günlük plan, müfredat ve çalışma alışkanlıklarınızı takip edin."
                : "Sınav hedefiniz ve deneme performansınız tek ekranda; tüm veriler sunucudan canlı gelir."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mod</span>
            <span className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold">{goalTemplateLabel(template)}</span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              aria-label="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Yüklenemedi</p>
              <p className="mt-0.5 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {missing.length > 0 && dash && (
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <span className="font-semibold text-slate-500">Eksik bilgi:</span>
            {missing.map((m) => (
              <span key={m} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-medium">
                {m === "target_net" ? "Hedef net" : m === "exam_date" ? "Sınav tarihi" : m}
              </span>
            ))}
          </div>
        )}

        {loading && !dash ? (
          <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-stretch">
            <Skeleton className="h-72 lg:h-auto lg:min-h-[22rem] rounded-2xl" />
            <Skeleton className="h-72 lg:h-auto lg:min-h-[22rem] rounded-2xl" />
          </div>
        ) : dash ? (
          <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-stretch">
            {/* Sol: durum — grid hücresi tam yükseklik, kartlar eşit */}
            <div className="flex min-h-0 h-full flex-col self-stretch">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-1 flex-col w-full min-h-[280px] lg:min-h-0 lg:h-full">
                <div className="flex items-start justify-between gap-3 mb-5 shrink-0">
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Özet</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Sunucu hesaplaması · {riskStyle.label}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${riskStyle.badge}`}>{riskStyle.label}</span>
                </div>

                {template === "school_primary" && school ? (
                  <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    <div className="grid grid-cols-2 gap-3">
                      <KpiCard
                        label="Bugün görev"
                        value={`${school.tasks_done_today ?? 0}/${Math.max(school.tasks_total_today ?? 0, 1)}`}
                        sub="Tamamlanan / planlanan"
                        icon={Target}
                        color="text-indigo-600"
                        bg="bg-indigo-50"
                      />
                      <KpiCard
                        label="Haftalık çalışma"
                        value={`${Math.round((school.study_time_weekly_seconds ?? 0) / 60)} dk`}
                        icon={Zap}
                        color="text-cyan-600"
                        bg="bg-cyan-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <KpiCard
                        label="Müfredat tamam"
                        value={school.curriculum_topics_completed ?? 0}
                        icon={BookOpen}
                        color="text-violet-600"
                        bg="bg-violet-50"
                      />
                      <KpiCard
                        label="Müfredatta devam"
                        value={school.curriculum_topics_in_progress ?? 0}
                        icon={TrendingUp}
                        color="text-amber-600"
                        bg="bg-amber-50"
                      />
                    </div>
                    <Link
                      href="/ogrenci/plan"
                      className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
                    >
                      Plana git <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1 min-h-0">
                    {targetNetNum > 0 && (
                      <CircularProgress current={Number(currentNet)} target={Number(targetNetNum)} size={120} />
                    )}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex justify-between gap-2 text-sm border border-slate-100 rounded-xl px-3 py-2 bg-slate-50">
                        <span className="text-slate-500 font-medium">Son kayıtlı net</span>
                        <span className="font-black text-slate-900">{Number(currentNet).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-sm border border-slate-100 rounded-xl px-3 py-2 bg-slate-50">
                        <span className="text-slate-500 font-medium">Hedef net</span>
                        <span className="font-black text-indigo-700">{targetNetNum > 0 ? targetNetNum.toFixed(1) : "—"}</span>
                      </div>
                      {exam && (
                        <div className="flex justify-between gap-2 text-xs text-slate-500 px-1">
                          <span>Tamamlanan deneme: {exam.completed_exams_count ?? 0}</span>
                          <span>Devam eden: {exam.in_progress_exams_count ?? 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {template !== "school_primary" && ins?.days_remaining != null && (
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <KpiCard
                      label="Kalan gün"
                      value={ins.days_remaining}
                      icon={Calendar}
                      color="text-violet-600"
                      bg="bg-violet-50"
                    />
                    <KpiCard
                      label="Haftalık net ihtiyacı"
                      value={ins.weekly_net_needed != null ? `+${ins.weekly_net_needed}` : "—"}
                      sub={ins.weekly_net_needed == null ? "Tarih veya hedef eksik" : undefined}
                      icon={TrendingUp}
                      color="text-cyan-600"
                      bg="bg-cyan-50"
                    />
                  </div>
                )}

                {template !== "school_primary" && ins?.days_remaining == null && (
                  <div className="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
                    Sınav tarihi girilmediği için kalan gün hesaplanmıyor. Sağdaki formdan ekleyebilirsiniz.
                  </div>
                )}

                {risk !== "on_track" && (
                  <div className={`mt-4 flex gap-3 p-3 rounded-xl border ${riskStyle.border} bg-white`}>
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${riskStyle.text}`} />
                    <p className={`text-xs font-medium ${riskStyle.text}`}>
                      {risk === "critical"
                        ? "Hedefe yetişmek için tempoyu artırmanız veya hedefi gözden geçirmeniz önerilir."
                        : "Planınızı ve deneme sıklığınızı gözden geçirmeniz faydalı olur."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ: hedef formu — sol ile aynı yükseklik */}
            <div className="flex min-h-0 h-full flex-col self-stretch">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-1 flex-col w-full min-h-[280px] lg:min-h-0 lg:h-full">
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Hedef bilgilerim</h2>
                    <p className="text-[11px] text-slate-500">Kayıt sunucuya yazılır · Sınıf/sınav türü kısıtlıysa değişmez</p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-1 flex-col gap-4 min-h-0">
                {template === "school_primary" ? (
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">
                    Bu kademede odak günlük görev ve müfredat ilerlemesidir. Sınav neti zorunlu değildir. Günlük plan ve dersler sayfalarını kullanın.
                  </p>
                ) : (
                  <div className="flex flex-1 flex-col gap-4 min-h-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Hedef net</label>
                        <input
                          type="number"
                          min={0}
                          max={200}
                          step={0.5}
                          value={targetNet}
                          onChange={(e) => setTargetNet(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Sınav tarihi</label>
                        <input
                          type="date"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <School className="w-3 h-3" /> Hedef okul
                      </label>
                      <input
                        type="text"
                        value={targetSchool}
                        onChange={(e) => setTargetSchool(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Hedef bölüm
                      </label>
                      <input
                        type="text"
                        value={targetDept}
                        onChange={(e) => setTargetDept(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2 mt-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saveState === "saving"}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
                  >
                    {saveState === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Kaydet
                  </button>
                  <Link
                    href="/ogrenci/deneme"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50"
                  >
                    Denemeler <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {saveState === "ok" && <p className="text-xs font-semibold text-cyan-600 text-center shrink-0">Kaydedildi</p>}
                {saveState === "err" && saveErr && <p className="text-xs font-semibold text-red-600 text-center shrink-0">{saveErr}</p>}
              </div>
            </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
          <Zap className="w-6 h-6 text-indigo-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-indigo-900 text-sm">Koç ve plan</p>
            <p className="text-xs text-indigo-700/90">Kişisel analiz için dijital koça veya günlük plana geçin.</p>
          </div>
          <Link href="/ogrenci/koc" className="shrink-0 text-sm font-bold text-indigo-700 hover:underline">
            Koça git
          </Link>
        </div>
      </div>
    </div>
  );
}
