"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Exam } from "@/lib/api";
import { Play, CheckCircle, Award, BarChart3, Clock, RefreshCw, Trophy, Lock } from "lucide-react";

const DEMO_EXAMS: Exam[] = [
  {
    id: 1, title: "TYT Deneme 1", exam_type: "TYT", question_count: 120, duration_minutes: 165,
    is_completed: true, user_score: 42, rank: 12500, is_free: true,
    available_at: null, description: "Temel Yeterlilik Testi — Tüm konular",
  },
  {
    id: 2, title: "AYT Deneme 1", exam_type: "AYT", question_count: 80, duration_minutes: 180,
    is_completed: false, is_free: true, available_at: null,
    description: "Alan Yeterlilik Testi — Sayısal ağırlıklı",
  },
  {
    id: 3, title: "TYT Deneme 2", exam_type: "TYT", question_count: 120, duration_minutes: 165,
    is_completed: false, is_free: false, available_at: null,
    description: "Temel Yeterlilik Testi — Orta/zor sorular",
  },
  {
    id: 4, title: "TYT Deneme 3", exam_type: "TYT", question_count: 120, duration_minutes: 165,
    is_completed: true, user_score: 55, rank: 8200, is_free: false,
    available_at: null, description: "Temel Yeterlilik Testi",
  },
];

const EXAM_TYPE_COLORS: Record<string, string> = {
  TYT: "bg-teal-100 text-teal-700",
  AYT: "bg-indigo-100 text-indigo-700",
  LGS: "bg-amber-100 text-amber-700",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-2xl animate-pulse ${className ?? ""}`} />;
}

export default function DenemePage() {
  const { token, user } = useAuth();
  const isDemo = token?.startsWith("demo-token-");
  const isPro = user?.subscription_plan && user.subscription_plan !== "free";

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [examTypeFilter, setExamTypeFilter] = useState("");

  const loadExams = useCallback(async () => {
    if (isDemo || !token) {
      setExams(DEMO_EXAMS);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getExams(token);
      setExams(res.data);
    } catch {
      setExams(DEMO_EXAMS);
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadExams(); }, [loadExams]);

  const examTypes = [...new Set(exams.map((e) => e.exam_type).filter(Boolean))];
  const filtered = examTypeFilter ? exams.filter((e) => e.exam_type === examTypeFilter) : exams;

  const completedExams = exams.filter((e) => e.is_completed);
  const avgScore = completedExams.length > 0
    ? (completedExams.reduce((s, e) => s + (e.user_score ?? 0), 0) / completedExams.length).toFixed(1)
    : null;
  const bestRank = completedExams.reduce<number | null>((best, e) => {
    if (!e.rank) return best;
    return best === null || e.rank < best ? e.rank : best;
  }, null);

  return (
    <div className="p-8 lg:p-12">
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Online Denemeler</h1>
        <p className="text-slate-600 mt-1">
          Gerçek ÖSYM formatı · Türkiye geneli sıralama · Konu analiz raporu
        </p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
      </div>

      {/* Özet istatistikler */}
      {!loading && completedExams.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 mb-1">Tamamlanan Deneme</p>
            <p className="text-3xl font-bold text-slate-900">{completedExams.length}</p>
          </div>
          {avgScore && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 mb-1">Ortalama Net</p>
              <p className="text-3xl font-bold text-teal-600">{avgScore}</p>
            </div>
          )}
          {bestRank && (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm bg-gradient-to-br from-amber-50 to-white">
              <p className="text-xs font-semibold text-amber-600 mb-1">En İyi Sıralama</p>
              <p className="text-3xl font-bold text-amber-700">#{bestRank.toLocaleString("tr-TR")}</p>
            </div>
          )}
        </div>
      )}

      {/* Filtreler */}
      {examTypes.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setExamTypeFilter("")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !examTypeFilter ? "bg-teal-600 text-white shadow-sm" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Tümü
          </button>
          {examTypes.map((type) => (
            <button
              key={type}
              onClick={() => setExamTypeFilter(examTypeFilter === type ? "" : type!)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                examTypeFilter === type ? "bg-teal-600 text-white shadow-sm" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {type}
            </button>
          ))}
          <button
            onClick={loadExams}
            className="ml-auto p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Deneme kartları */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exam) => {
            const locked = !exam.is_free && !isPro;
            return (
              <div
                key={exam.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all ${
                  locked ? "border-slate-200 opacity-80" : "border-slate-200 hover:shadow-md hover:border-teal-100"
                }`}
              >
                <div className="p-6">
                  {/* Üst kısım */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${EXAM_TYPE_COLORS[exam.exam_type ?? "TYT"] ?? "bg-slate-100 text-slate-600"}`}>
                      {exam.exam_type}
                    </span>
                    <div className="flex items-center gap-2">
                      {locked && <Lock className="w-4 h-4 text-slate-400" />}
                      {exam.is_completed && <CheckCircle className="w-5 h-5 text-teal-500" />}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mb-1">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{exam.description}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-5">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {exam.question_count} soru
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exam.duration_minutes} dk
                    </span>
                  </div>

                  {/* Sonuç (tamamlanmışsa) */}
                  {exam.is_completed && exam.user_score !== undefined && (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-100">
                        <BarChart3 className="w-5 h-5 text-teal-600 shrink-0" />
                        <div>
                          <p className="text-xs text-teal-600 font-medium">Net</p>
                          <p className="font-bold text-teal-700 text-lg leading-none">{exam.user_score}</p>
                        </div>
                      </div>
                      {exam.rank && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                          <Trophy className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <p className="text-xs text-amber-600 font-medium">Türkiye Sıralaması</p>
                            <p className="font-bold text-amber-700">#{exam.rank.toLocaleString("tr-TR")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aksiyon */}
                  {locked ? (
                    <Link
                      href="/#paketler"
                      className="flex items-center justify-center gap-2 w-full py-3 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-xl transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      Pro ile Kilidi Aç
                    </Link>
                  ) : (
                    <Link
                      href={`/ogrenci/deneme/${exam.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
                    >
                      {exam.is_completed ? (
                        <><BarChart3 className="w-5 h-5" /> Sonuç & Analiz</>
                      ) : (
                        <><Play className="w-5 h-5" /> Başla</>
                      )}
                    </Link>
                  )}

                  {!exam.is_free && !locked && (
                    <div className="mt-2 flex items-center justify-center">
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">Pro İçerik</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !isPro && exams.some((e) => !e.is_free) && (
        <div className="mt-8 p-5 rounded-2xl bg-teal-50 border border-teal-200">
          <p className="font-semibold text-teal-900">Tüm denemelere erişmek ister misin?</p>
          <p className="text-sm text-teal-700 mt-1">
            Pro paket ile tüm denemeleri çöz, Türkiye geneli sıralamanda yerini gör.
          </p>
          <Link href="/#paketler" className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-teal-700 hover:underline">
            Paketleri İncele →
          </Link>
        </div>
      )}

      {/* Pro özellikler */}
      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Award, title: "Türkiye Sıralaması", desc: "Her denemede anlık Türkiye geneli sıralaman gösterilir." },
          { icon: BarChart3, title: "Konu Analiz Raporu", desc: "Hangi kazanımdan kaç yanlış yaptığın görsel olarak analiz edilir." },
          { icon: RefreshCw, title: "Zayıf Konu Tekrarı", desc: "Yanlış kazanımlar otomatik olarak günlük planına eklenir." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-teal-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
