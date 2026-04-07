"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ExamSession, WeakAchievement } from "@/lib/api";
import { Trophy, CheckCircle, XCircle, Minus, Clock, ChevronRight, BarChart3, Loader2, BookOpen, RefreshCw } from "lucide-react";
import Link from "next/link";

function secondsToHuman(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

export default function ExamResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const sessionId = Number(params.id);

  const [result, setResult] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weakAchievements, setWeakAchievements] = useState<WeakAchievement[]>([]);
  const [weakLoading, setWeakLoading] = useState(false);

  const loadResult = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getExamResult(sessionId);
      const resObj = res as Record<string, unknown>;
      setResult((resObj?.result ?? res) as ExamSession);
      // Zayıf kazanımları da yükle
      setWeakLoading(true);
      try {
        const wa = await api.getWeakAchievements();
        const waArr = Array.isArray(wa) ? wa : [];
        setWeakAchievements((waArr as WeakAchievement[]).slice(0, 5));
      } catch {}
      setWeakLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sonuç yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [token, sessionId]);

  useEffect(() => { loadResult(); }, [loadResult]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 mb-4">{error ?? "Sonuç bulunamadı"}</p>
        <Link href="/ogrenci/deneme" className="text-teal-600 hover:underline">← Denemelere dön</Link>
      </div>
    );
  }

  const breakdown = result.subject_breakdown ?? {};
  const subjects = Object.keys(breakdown);
  const netColor = (result.net_score ?? 0) >= 70 ? "text-emerald-600" : (result.net_score ?? 0) >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Başlık */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">{result.title}</h1>
        <p className="text-slate-500 mt-1">
          {result.finished_at ? new Date(result.finished_at).toLocaleString("tr-TR") : ""}
        </p>
      </div>

      {/* Ana Sonuç Kartı */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className={`text-4xl font-black ${netColor}`}>{result.net_score?.toFixed(2) ?? "—"}</p>
            <p className="text-sm text-slate-500 mt-1 font-medium">Net Puan</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <p className="text-3xl font-bold text-emerald-600">{result.correct_count ?? 0}</p>
            </div>
            <p className="text-sm text-slate-500 mt-1">Doğru</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-3xl font-bold text-red-500">{result.wrong_count ?? 0}</p>
            </div>
            <p className="text-sm text-slate-500 mt-1">Yanlış</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Minus className="w-5 h-5 text-slate-400" />
              <p className="text-3xl font-bold text-slate-600">{result.empty_count ?? 0}</p>
            </div>
            <p className="text-sm text-slate-500 mt-1">Boş</p>
          </div>
        </div>

        {result.time_spent_seconds && (
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>Süre: <strong className="text-slate-700">{secondsToHuman(result.time_spent_seconds)}</strong></span>
          </div>
        )}
      </div>

      {/* Ders Bazlı Dağılım */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
          <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" /> Ders Bazlı Analiz
          </h2>
          <div className="space-y-4">
            {subjects.map((subject) => {
              const s = breakdown[subject];
              const total = (s.correct + s.wrong + s.empty) || 1;
              const accuracy = Math.round((s.correct / total) * 100);
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{subject}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="text-emerald-600 font-semibold">D:{s.correct}</span>
                      <span className="text-red-500 font-semibold">Y:{s.wrong}</span>
                      <span className="text-slate-400">B:{s.empty}</span>
                      <span className="font-bold text-slate-700">Net:{s.net.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kazanım Bazlı Zayıf Analiz */}
      {(weakLoading || weakAchievements.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
          <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-500" /> Zayıf Kazanım Analizi
          </h2>
          {weakLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {weakAchievements.map((wa) => {
                const accuracyColor = wa.accuracy_rate < 40
                  ? "bg-red-500"
                  : wa.accuracy_rate < 70
                  ? "bg-amber-500"
                  : "bg-teal-500";
                return (
                  <div key={wa.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="shrink-0">
                      <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                        {wa.kod}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{wa.konu}</p>
                      {wa.subject && <p className="text-xs text-slate-500">{wa.subject}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${accuracyColor}`}
                            style={{ width: `${wa.accuracy_rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">%{wa.accuracy_rate}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{wa.wrong_count}/{wa.total_count} hatalı</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-600">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="font-medium">Bu kazanımlara ait sorular günlük planına otomatik eklendi.</span>
          </div>
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/ogrenci/deneme"
          className="flex-1 py-3 text-center bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Yeni Deneme
        </Link>
        <Link
          href="/ogrenci/soru-bankasi"
          className="flex-1 py-3 text-center bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
        >
          Zayıf Konuları Çalış <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
