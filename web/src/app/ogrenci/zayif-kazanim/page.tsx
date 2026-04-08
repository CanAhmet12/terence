"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, WeakAchievement } from "@/lib/api";
import {
  RefreshCw, AlertCircle, BookOpen, Target, TrendingDown,
  ArrowRight, Zap, Brain, ChevronRight, AlertTriangle, CheckCircle
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function getRiskLevel(rate: number): { color: string; bg: string; border: string; label: string; dot: string } {
  if (rate < 30) return { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    label: "Kritik",  dot: "bg-red-500"    };
  if (rate < 50) return { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", label: "Zayıf",   dot: "bg-orange-500" };
  if (rate < 70) return { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  label: "Orta",    dot: "bg-amber-500"  };
  return             { color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-200",   label: "İyi",     dot: "bg-teal-500"   };
}

// Mini donut progress
function MiniDonut({ pct, color }: { pct: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={44} height={44} className="-rotate-90">
      <circle cx={22} cy={22} r={r} stroke="#f1f5f9" strokeWidth={5} fill="none" />
      <circle
        cx={22} cy={22} r={r}
        stroke={color} strokeWidth={5} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

// Önerilerin listesi (mock — gerçekte AI'dan gelebilir)
function getStudySuggestion(rate: number): string {
  if (rate < 30) return "Bu konuyu sıfırdan tekrar et. Temel kavramları kavramadan ilerlememelisin.";
  if (rate < 50) return "Formülleri ve tanımları ezberle, ardından kolay soru çözmeye başla.";
  if (rate < 70) return "Orta ve zor zorlukta ek soru çöz. Benzer soru tiplerini tanı.";
  return "Hız ve doğruluk için daha fazla pratik yap.";
}

export default function ZayifKazanimPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [achievements, setAchievements] = useState<WeakAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getWeakAchievements();
      const resArr = Array.isArray(res) ? res : [];
      setAchievements(resArr as WeakAchievement[]);
    } catch (e) {
      setError((e as Error).message || "Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const criticalCount = achievements.filter((a) => a.accuracy_rate < 30).length;
  const weakCount = achievements.filter((a) => a.accuracy_rate < 50).length;
  const avgRate = achievements.length > 0
    ? Math.round(achievements.reduce((s, a) => s + a.accuracy_rate, 0) / achievements.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Başlık ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Zayıf Kazanımlarım</h1>
            <p className="text-slate-500 mt-1 font-medium">En çok hata yaptığın kazanımlar ve geliştirme önerileri</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Özet Banner ── */}
        {!loading && achievements.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">{criticalCount}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Kritik Kazanım</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <TrendingDown className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">{achievements.length}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Toplam Zayıf Kazanım</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">%{avgRate}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Ortalama Doğruluk</p>
            </div>
          </div>
        )}

        {/* ── Hata ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Kazanım Kartları ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="font-black text-slate-700 text-xl">Harika! Zayıf kazanım yok.</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
              Tüm kazanımlarda yeterli başarı oranına ulaştın. Çalışmaya devam et!
            </p>
            <button
              onClick={() => router.push("/ogrenci/soru-bankasi")}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Soru Bankasına Git
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((wa) => {
              const risk = getRiskLevel(wa.accuracy_rate);
              const isExpanded = expandedId === wa.id;
              const suggestion = getStudySuggestion(wa.accuracy_rate);

              return (
                <div
                  key={wa.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${risk.border}`}
                >
                  {/* Ana satır */}
                  <div className="flex items-center gap-4 p-5">
                    {/* Donut */}
                    <div className="relative shrink-0">
                      <MiniDonut pct={wa.accuracy_rate} color={wa.accuracy_rate < 50 ? "#ef4444" : wa.accuracy_rate < 70 ? "#f59e0b" : "#14b8a6"} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-700">%{wa.accuracy_rate}</span>
                      </div>
                    </div>

                    {/* Kazanım bilgisi */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
                          {wa.kod}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${risk.bg} ${risk.color}`}>
                          ● {risk.label}
                        </span>
                        {wa.subject && (
                          <span className="text-[11px] text-slate-400 font-medium">{wa.subject}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{wa.konu}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {wa.wrong_count} hata · {wa.total_count} toplam soru
                      </p>
                    </div>

                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : wa.id)}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Brain className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/ogrenci/soru-bankasi?kazanim_code=${wa.kod}`)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${risk.bg} ${risk.color} border ${risk.border} hover:brightness-95`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Çalış
                      </button>
                    </div>
                  </div>

                  {/* İlerleme barı */}
                  <div className={`h-1.5 ${risk.bg} mx-5 mb-4 rounded-full overflow-hidden`}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${risk.dot}`}
                      style={{ width: `${wa.accuracy_rate}%` }}
                    />
                  </div>

                  {/* Genişletilmiş: AI öneri */}
                  {isExpanded && (
                    <div className={`mx-5 mb-4 p-4 rounded-xl ${risk.bg} border ${risk.border}`}>
                      <div className="flex items-start gap-2.5">
                        <Brain className={`w-4 h-4 ${risk.color} shrink-0 mt-0.5`} />
                        <div>
                          <p className={`text-xs font-bold ${risk.color} mb-1`}>Çalışma Önerisi</p>
                          <p className={`text-xs ${risk.color} leading-relaxed opacity-80`}>{suggestion}</p>
                          <button
                            onClick={() => router.push(`/ogrenci/soru-bankasi?kazanim_code=${wa.kod}`)}
                            className={`mt-3 flex items-center gap-1 text-xs font-bold ${risk.color} hover:underline`}
                          >
                            Bu konuda soru çöz <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Alt CTA ── */}
        {!loading && achievements.length > 0 && (
          <button
            onClick={() => router.push("/ogrenci/soru-bankasi")}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/25 active:scale-[0.99]"
          >
            <BookOpen className="w-5 h-5" />
            Soru Bankasında Tüm Zayıf Kazanımları Çalış
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
