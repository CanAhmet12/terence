"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ExamQuestion } from "@/lib/api";
import { Flag, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamSessionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = Number(params.id);
  const { token } = useAuth();

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const durationRef = useRef(135 * 60);
  const questionStartTimes = useRef<Record<number, number>>({});

  // Demo için sessiz mod
  const isDemo = params.id === "demo" || !token || token.startsWith("demo-token-");

  const loadSession = useCallback(async () => {
    if (isDemo) {
      // Demo sorular
      const demoQs: ExamQuestion[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        question_text: `Demo Soru ${i + 1}: Aşağıdaki işlemin sonucu kaçtır? (${i + 1} × 5 = ?)`,
        subject: i < 4 ? "Matematik" : i < 7 ? "Türkçe" : "Fizik",
        options: [
          { letter: "A", text: String((i + 1) * 5) },
          { letter: "B", text: String((i + 1) * 5 + 5) },
          { letter: "C", text: String((i + 1) * 5 - 5) },
          { letter: "D", text: String((i + 1) * 5 + 10) },
        ],
      }));
      setQuestions(demoQs);
      durationRef.current = 30 * 60;
      setTimeLeft(30 * 60);
      const now = Date.now();
      demoQs.forEach((q) => { questionStartTimes.current[q.id] = now; });
      setLoading(false);
      return;
    }

    // API'den geçmiş sonuç sayfasına yönlendir
    try {
      const res = await api.getExamResult(token!, sessionId);
      if (res.result.status === "completed") {
        router.replace(`/ogrenci/deneme/${sessionId}/sonuc`);
        return;
      }
    } catch {
      // oturum henüz tamamlanmamış, devam et
    }

    // Oturum bilgisini almak için history'den bul
    try {
      const history = await api.getExamHistory(token!);
      const session = history.find((s) => s.id === sessionId);
      if (session) {
        durationRef.current = session.duration_minutes * 60;
        setTimeLeft(session.duration_minutes * 60);
      }
    } catch { /* sessiz geç */ }

    setLoading(false);
    setError("Bu deneme oturumu için sorular yüklenemedi. Lütfen yeni bir deneme başlatın.");
  }, [token, sessionId, isDemo, router]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // Geri sayım
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Soru değiştiğinde başlangıç zamanını kaydet
  useEffect(() => {
    if (questions[currentIdx]) {
      const qId = questions[currentIdx].id;
      if (!questionStartTimes.current[qId]) {
        questionStartTimes.current[qId] = Date.now();
      }
    }
  }, [currentIdx, questions]);

  const handleAnswer = async (letter: string) => {
    const question = questions[currentIdx];
    if (!question) return;
    const prev = answers[question.id];
    setAnswers((a) => ({ ...a, [question.id]: letter === prev ? null : letter }));

    if (!isDemo && token) {
      const startTime = questionStartTimes.current[question.id] ?? Date.now();
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      api.answerExamQuestion(token, sessionId, {
        question_id: question.id,
        selected_option: letter === prev ? undefined : letter,
        time_spent_seconds: timeSpent,
      }).catch(() => {});
    }
  };

  const toggleFlag = async (questionId: number) => {
    setFlagged((f) => {
      const next = new Set(f);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
    if (!isDemo && token) {
      api.answerExamQuestion(token, sessionId, {
        question_id: questionId,
        is_flagged: !flagged.has(questionId),
      }).catch(() => {});
    }
  };

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (isDemo) {
      // Demo sonuç
      router.push("/ogrenci/deneme");
      return;
    }
    try {
      const result = await api.finishExam(token!, sessionId);
      router.push(`/ogrenci/deneme/${result.session_id}/sonuc`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deneme bitirilemedi");
      setSubmitting(false);
    }
  };

  const question = questions[currentIdx];
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const emptyCount = questions.length - answeredCount;
  const timeRatio = durationRef.current > 0 ? timeLeft / durationRef.current : 1;
  const timerColor = timeRatio > 0.3 ? "text-teal-600" : timeRatio > 0.1 ? "text-amber-600" : "text-red-600";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Deneme yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl border border-slate-200 shadow">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-900 mb-2">{error ?? "Sorular yüklenemedi"}</p>
          <button
            onClick={() => router.push("/ogrenci/deneme")}
            className="mt-4 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Denemeler Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Üst Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-900">
            {isDemo ? "Demo Deneme" : `Deneme #${sessionId}`}
          </span>
          <span className="text-sm text-slate-500">
            {currentIdx + 1} / {questions.length}
          </span>
        </div>

        <div className={`flex items-center gap-2 font-mono font-bold text-xl ${timerColor}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            <span className="text-teal-600 font-semibold">{answeredCount}</span>/{questions.length} cevaplandı
          </span>
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Bitir
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Soru Navigasyon Paneli */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto hidden lg:block">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Sorular</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;
              const isFlagged = flagged.has(q.id);
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-teal-600 text-white shadow-md"
                      : isAnswered && isFlagged
                      ? "bg-amber-100 text-amber-700 border border-amber-300"
                      : isAnswered
                      ? "bg-teal-100 text-teal-700"
                      : isFlagged
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-slate-500">
            {[
              { color: "bg-teal-100", label: `${answeredCount} Cevaplandı` },
              { color: "bg-orange-100", label: `${flagged.size} İşaretli` },
              { color: "bg-slate-100", label: `${emptyCount} Boş` },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${s.color}`} />
                {s.label}
              </div>
            ))}
          </div>
        </aside>

        {/* Ana Soru Alanı */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {question && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-4">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                      Soru {currentIdx + 1}
                    </span>
                    {question.subject && (
                      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                        {question.subject}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFlag(question.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      flagged.has(question.id)
                        ? "bg-orange-100 text-orange-700 border border-orange-300"
                        : "bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {flagged.has(question.id) ? "İşaretlendi" : "İşaretle"}
                  </button>
                </div>

                <p className="text-slate-800 text-base leading-relaxed font-medium mb-8">
                  {question.question_text}
                </p>

                <div className="space-y-3">
                  {question.options.map((opt) => {
                    const isSelected = answers[question.id] === opt.letter;
                    return (
                      <button
                        key={opt.letter}
                        onClick={() => handleAnswer(opt.letter)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                          isSelected
                            ? "border-teal-500 bg-teal-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {opt.letter}
                        </span>
                        <span className={`text-sm ${isSelected ? "text-teal-900 font-semibold" : "text-slate-700"}`}>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigasyon */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Önceki
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                  >
                    Sonraki <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Sınavı Bitir
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
