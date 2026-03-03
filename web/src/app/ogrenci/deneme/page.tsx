"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ExamSession } from "@/lib/api";
import {
  Play, Clock, BarChart3, Trophy, RefreshCw, CheckCircle, Plus, ChevronRight, Loader2
} from "lucide-react";

const EXAM_TYPES = [
  { key: "TYT", label: "TYT", desc: "120 soru • 135 dk", color: "bg-teal-100 text-teal-700", questions: 120, duration: 135 },
  { key: "AYT", label: "AYT", desc: "80 soru • 180 dk", color: "bg-indigo-100 text-indigo-700", questions: 80, duration: 180 },
  { key: "LGS", label: "LGS", desc: "90 soru • 90 dk", color: "bg-amber-100 text-amber-700", questions: 90, duration: 90 },
  { key: "Mini", label: "Mini Deneme", desc: "20 soru • 30 dk", color: "bg-slate-100 text-slate-700", questions: 20, duration: 30 },
];

const DEMO_HISTORY: ExamSession[] = [
  { id: 1, title: "TYT Deneme #1", exam_type: "TYT", status: "completed", duration_minutes: 135, net_score: 42.5, correct_count: 52, wrong_count: 38, empty_count: 30, finished_at: "2026-02-28T14:00:00Z" },
  { id: 2, title: "Mini Deneme", exam_type: "Mini", status: "completed", duration_minutes: 30, net_score: 16.25, correct_count: 18, wrong_count: 7, empty_count: 5, finished_at: "2026-03-01T10:00:00Z" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-2xl animate-pulse ${className ?? ""}`} />;
}

export default function DenemePage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const isDemo = !token || token.startsWith("demo-token-");

  const [history, setHistory] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingType, setStartingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (isDemo) {
      setHistory(DEMO_HISTORY);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getExamHistory(token!);
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [token, isDemo]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleStartExam = async (examType: typeof EXAM_TYPES[0]) => {
    if (isDemo) {
      // Demo modda sahte bir oturuma yönlendir
      router.push(`/ogrenci/deneme/demo`);
      return;
    }
    setStartingType(examType.key);
    setError(null);
    try {
      const res = await api.startExam(token!, {
        exam_type: examType.key,
        title: `${examType.label} Denemesi`,
        duration_minutes: examType.duration,
        question_count: examType.questions,
      });
      router.push(`/ogrenci/deneme/${res.session.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deneme başlatılamadı";
      if (msg.toLowerCase().includes("soru") || msg.toLowerCase().includes("no_questions")) {
        setError("Bu deneme türü için henüz yeterli soru bulunmuyor. Yakında eklenecek!");
      } else {
        setError(msg);
      }
      setStartingType(null);
    }
  };

  const avgNet = history.length > 0
    ? (history.reduce((acc, s) => acc + (s.net_score ?? 0), 0) / history.length).toFixed(1)
    : "—";

  const bestNet = history.length > 0
    ? Math.max(...history.map((s) => s.net_score ?? 0)).toFixed(1)
    : "—";

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Deneme Sınavları</h1>
        <p className="text-slate-500 mt-1">İstediğin sınav türünü seç, sistem soruları otomatik hazırlar</p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
      </div>

      {/* Özet istatistikler */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Toplam Deneme", value: history.length, icon: BarChart3, color: "text-teal-600 bg-teal-50" },
            { label: "Ortalama Net", value: avgNet, icon: Trophy, color: "text-amber-600 bg-amber-50" },
            { label: "En Yüksek Net", value: bestNet, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sınav Seçenekleri */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Yeni Deneme Başlat</h2>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXAM_TYPES.map((exam) => (
            <button
              key={exam.key}
              onClick={() => handleStartExam(exam)}
              disabled={startingType !== null}
              className="bg-white rounded-2xl border border-slate-200 p-6 text-left hover:shadow-md hover:border-teal-300 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${exam.color}`}>
                  {exam.label}
                </span>
                {startingType === exam.key ? (
                  <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <Play className="w-4 h-4 text-teal-600" />
                  </div>
                )}
              </div>
              <p className="font-bold text-slate-900 mb-1">{exam.label}</p>
              <p className="text-sm text-slate-500">{exam.desc}</p>
              <p className="text-xs text-teal-600 font-semibold mt-3 group-hover:underline">
                {startingType === exam.key ? "Hazırlanıyor..." : "Denemeyi Başlat →"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Geçmiş Denemeler */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Geçmiş Denemeler</h2>
          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Yenile
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">Henüz deneme çözmedin</p>
            <p className="text-sm text-slate-500 mt-1">Yukarıdan bir deneme seç ve başla.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{session.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {session.finished_at ? new Date(session.finished_at).toLocaleDateString("tr-TR") : ""}
                        </span>
                        <span className="text-xs font-medium text-teal-600">
                          Net: {session.net_score?.toFixed(2) ?? "—"}
                        </span>
                        <span className="text-xs text-slate-400">
                          D:{session.correct_count} Y:{session.wrong_count} B:{session.empty_count}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/ogrenci/deneme/${session.id}/sonuc`)}
                    className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:underline"
                  >
                    Sonuç <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
