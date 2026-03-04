"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, WeakAchievement } from "@/lib/api";
import { RefreshCw, AlertCircle, BookOpen, Target, TrendingDown } from "lucide-react";
import Link from "next/link";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function ZayifKazanimPage() {
  const { token } = useAuth();
  const [achievements, setAchievements] = useState<WeakAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getWeakAchievements(token);
      setAchievements(res);
    } catch (e) {
      setError((e as Error).message || "Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Zayıf Kazanımlarım</h1>
          <p className="text-slate-600 mt-1">En çok hata yaptığın kazanımlar ve geliştirme önerileri</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto text-red-600 font-semibold hover:underline text-xs">Yenile</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">Harika! Zayıf kazanım bulunamadı.</p>
          <p className="text-sm text-slate-400 mt-1">Daha fazla soru çözdükçe analiz oluşacak.</p>
          <Link
            href="/ogrenci/soru-bankasi"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Soru Bankasına Git
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((wa) => {
            const accuracyColor = wa.accuracy_rate < 40
              ? "bg-red-500"
              : wa.accuracy_rate < 70 ? "bg-amber-500" : "bg-teal-500";
            const riskLevel = wa.accuracy_rate < 40 ? "Kritik" : wa.accuracy_rate < 70 ? "Orta" : "Düşük";
            const riskBg = wa.accuracy_rate < 40
              ? "bg-red-50 border-red-200"
              : wa.accuracy_rate < 70 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200";
            return (
              <div key={wa.id} className={`p-5 rounded-2xl border ${riskBg} flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                  <TrendingDown className={`w-6 h-6 ${wa.accuracy_rate < 40 ? "text-red-500" : wa.accuracy_rate < 70 ? "text-amber-500" : "text-slate-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg">{wa.kod}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      wa.accuracy_rate < 40 ? "bg-red-100 text-red-700"
                      : wa.accuracy_rate < 70 ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                    }`}>{riskLevel} Risk</span>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm truncate">{wa.konu}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-1.5 bg-white/80 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${accuracyColor}`} style={{ width: `${wa.accuracy_rate}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 shrink-0">%{wa.accuracy_rate} doğruluk</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{wa.wrong_count} yanlış</p>
                </div>
                <Link
                  href="/ogrenci/soru-bankasi"
                  className="shrink-0 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-all"
                >
                  Çalış
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
