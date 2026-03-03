"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Exam, ExamQuestion, KonuAnaliz } from "@/lib/api";
import {
  ArrowLeft, Clock, BarChart3, Lightbulb, Trophy,
  CheckCircle, ChevronLeft, ChevronRight, Flag, AlertCircle, Loader2
} from "lucide-react";

type Phase = "basla" | "sinav" | "submitting" | "sonuc";

type AnswerMap = Record<number, string>; // question_id -> option_letter

// Demo analiz verisi
const DEMO_ANALIZ: KonuAnaliz[] = [
  { kazanim_code: "M.8.1.1", topic_name: "Üslü İfadeler", correct: 6, wrong: 4, empty: 0, success_percent: 60 },
  { kazanim_code: "T.9.2.1", topic_name: "Paragraf Yorumu", correct: 8, wrong: 2, empty: 0, success_percent: 80 },
  { kazanim_code: "F.9.1.1", topic_name: "Hareket", correct: 4, wrong: 5, empty: 1, success_percent: 40 },
];

const DEMO_QUESTIONS: ExamQuestion[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  order: i + 1,
  question_text: `Demo Soru ${i + 1}: Matematik işlemini çöz.`,
  options: [
    { id: i * 4 + 1, option_letter: "A", option_text: "Seçenek A" },
    { id: i * 4 + 2, option_letter: "B", option_text: "Seçenek B" },
    { id: i * 4 + 3, option_letter: "C", option_text: "Seçenek C" },
    { id: i * 4 + 4, option_letter: "D", option_text: "Seçenek D" },
  ],
  kazanim_code: "M.8.1.1",
}));

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function DenemeDetayPage() {
  const params = useParams();
  const examId = Number(params.id);
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [exam, setExam] = useState<Exam | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  const [phase, setPhase] = useState<Phase>("basla");

  // Sınav state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [soruIndex, setSoruIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // Sonuç state
  const [score, setScore] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [konuAnaliz, setKonuAnaliz] = useState<KonuAnaliz[]>([]);

  // Deneme bilgisini yükle
  const loadExam = useCallback(async () => {
    if (!token) { setLoadingExam(false); return; }
    if (isDemo) {
      const mock: Exam = {
        id: examId, title: `TYT Deneme ${examId}`, exam_type: "TYT",
        question_count: 10, duration_minutes: 10, is_completed: examId === 1,
        user_score: examId === 1 ? 42 : undefined, rank: examId === 1 ? 12500 : undefined,
        is_free: true, available_at: null,
      };
      setExam(mock);
      if (mock.is_completed) setPhase("sonuc");
      setLoadingExam(false);
      return;
    }
    try {
      const res = await api.getExams(token);
      const found = res.data.find((e) => e.id === examId) ?? null;
      setExam(found);
      if (found?.is_completed) setPhase("sonuc");
    } catch {
      setExam(null);
    }
    setLoadingExam(false);
  }, [token, examId, isDemo]);

  useEffect(() => { loadExam(); }, [loadExam]);

  // Sınav zamanlayıcı
  useEffect(() => {
    if (phase !== "sinav" || timeLeft <= 0) return;
    if (timeLeft === 0) { submitExam(); return; }
    const t = setInterval(() => setTimeLeft((s) => {
      if (s <= 1) { clearInterval(t); submitExam(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const startExam = async () => {
    if (!exam) return;
    setLoadingQuestions(true);
    if (isDemo || !token) {
      setQuestions(DEMO_QUESTIONS.slice(0, exam.question_count));
      setTimeLeft((exam.duration_minutes) * 60);
      setSoruIndex(0);
      setAnswers({});
      setFlagged(new Set());
      startTimeRef.current = Date.now();
      setPhase("sinav");
      setLoadingQuestions(false);
      return;
    }
    try {
      const session = await api.startExamSession(token, examId);
      setSessionId(session.session_id);
      const qs = await api.getExamSessionQuestions(token, session.session_id);
      setQuestions(qs);
      setTimeLeft((exam.duration_minutes) * 60);
      setSoruIndex(0);
      setAnswers({});
      setFlagged(new Set());
      startTimeRef.current = Date.now();
      setPhase("sinav");
    } catch {
      setQuestions(DEMO_QUESTIONS.slice(0, exam?.question_count ?? 10));
      setTimeLeft((exam?.duration_minutes ?? 10) * 60);
      setPhase("sinav");
    }
    setLoadingQuestions(false);
  };

  const answerQuestion = async (questionId: number, optionLetter: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionLetter }));
    if (!isDemo && token && sessionId) {
      try {
        await api.answerExamQuestion(token, sessionId, {
          question_id: questionId,
          selected_option: optionLetter,
          time_spent_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
        });
        startTimeRef.current = Date.now();
      } catch {}
    }
  };

  const submitExam = async () => {
    setPhase("submitting");
    if (isDemo || !token || !sessionId) {
      const correct = Object.keys(answers).length;
      setScore(correct - Math.floor(correct * 0.1));
      setRank(Math.floor(Math.random() * 20000) + 5000);
      setKonuAnaliz(DEMO_ANALIZ);
      setPhase("sonuc");
      return;
    }
    try {
      const result = await api.finishExamSession(token, sessionId, { answers });
      setScore(result.score);
      setRank(result.rank ?? null);
      setKonuAnaliz(result.konu_analiz ?? DEMO_ANALIZ);
    } catch {
      setScore(Object.keys(answers).length - 2);
      setKonuAnaliz(DEMO_ANALIZ);
    }
    setPhase("sonuc");
  };

  const toggleFlag = (qId: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  const currentQ = questions[soruIndex];
  const answered = Object.keys(answers).length;
  const unanswered = questions.length - answered;

  // --- Yükleniyor ---
  if (loadingExam) {
    return (
      <div className="p-8 lg:p-12 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8">
        <Link href="/ogrenci/deneme" className="text-teal-600 font-medium hover:underline">← Denemelere dön</Link>
        <div className="mt-8 flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <p className="font-semibold">Deneme bulunamadı.</p>
        </div>
      </div>
    );
  }

  // --- SONUÇ ---
  if (phase === "sonuc") {
    const weakTopics = konuAnaliz.filter((k) => k.success_percent < 60);
    return (
      <div className="p-8 lg:p-12">
        <Link href="/ogrenci/deneme" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Denemelere dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{exam.title}</h1>
        <p className="text-slate-600 mb-8">Sonuç özeti · Konu analiz raporu · Net artırma önerileri</p>

        {/* Özet */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Toplam Net",
              value: score !== null ? score : exam.user_score ?? "—",
              color: "text-teal-600",
              sub: exam.exam_type,
            },
            {
              label: "Türkiye Sıralaması",
              value: rank !== null ? `#${rank.toLocaleString("tr-TR")}` : exam.rank ? `#${exam.rank.toLocaleString("tr-TR")}` : "—",
              color: "text-amber-600",
              sub: "Bu denemedeki sıran",
            },
            {
              label: "Cevaplanan Soru",
              value: exam.is_completed ? exam.question_count : answered,
              color: "text-slate-900",
              sub: `${exam.question_count} sorudan`,
            },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Konu Analizi */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Konu Analiz Raporu
            </h2>
            <p className="text-sm text-slate-500 mt-1">Hangi kazanımda kaç yanlış yaptın, netini düşüren konular</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Kazanım</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Konu</th>
                  <th className="text-right px-6 py-3 font-semibold text-slate-600">Doğru</th>
                  <th className="text-right px-6 py-3 font-semibold text-slate-600">Yanlış</th>
                  <th className="text-right px-6 py-3 font-semibold text-slate-600">Başarı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {konuAnaliz.map((k) => (
                  <tr key={k.kazanim_code} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                        {k.kazanim_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{k.topic_name}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-teal-600">{k.correct}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-red-500">{k.wrong}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${k.success_percent >= 70 ? "bg-teal-500" : k.success_percent >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${k.success_percent}%` }}
                          />
                        </div>
                        <span className={`font-semibold ${k.success_percent < 60 ? "text-amber-600" : "text-slate-700"}`}>
                          %{k.success_percent}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Artırma Önerileri */}
        {weakTopics.length > 0 && (
          <div className="bg-teal-50 rounded-2xl border border-teal-200 p-6">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-teal-600" />
              Net Artırma Önerileri
            </h2>
            <ul className="space-y-3">
              {weakTopics.map((k) => (
                <li key={k.kazanim_code} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Trophy className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <span>
                    <strong>{k.kazanim_code}</strong> {k.topic_name} — %{k.success_percent} başarı.{" "}
                    Bu konuyu tekrar et, video izle ve günlük planına eklendi.
                  </span>
                </li>
              ))}
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                </div>
                <span>Hedef netine ulaşmak için haftada <strong>+1 net</strong> artışı hedefle.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  // --- BAŞLA ---
  if (phase === "basla") {
    return (
      <div className="p-8 lg:p-12">
        <Link href="/ogrenci/deneme" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Denemelere dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{exam.title}</h1>
        <p className="text-slate-600 mb-8">
          Gerçek ÖSYM formatı · {exam.question_count} soru · {exam.duration_minutes} dakika
        </p>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md shadow-sm">
          <ul className="space-y-3 text-sm text-slate-600 mb-8">
            {[
              "Geri sayım sayacı ile gerçek sınav deneyimi",
              "Soruları atlayıp sonra dönebilirsin",
              "Şüpheli soruları işaretle, sonra tekrar gözden geçir",
              "Bitirince Türkiye geneli sıralama ve konu analizi",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={startExam}
            disabled={loadingQuestions}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
          >
            {loadingQuestions ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor...</>
            ) : (
              "Denemeyi Başlat"
            )}
          </button>
        </div>
      </div>
    );
  }

  // --- TESLİM EDİLİYOR ---
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="font-semibold text-slate-700">Sınav teslim ediliyor...</p>
          <p className="text-sm text-slate-500 mt-1">Konu analizi ve sıralamanız hesaplanıyor.</p>
        </div>
      </div>
    );
  }

  // --- SINAV MODU ---
  const timeColor = timeLeft <= 60 ? "text-red-600" : timeLeft <= 300 ? "text-amber-600" : "text-teal-600";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Üst bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-3 flex items-center justify-between shadow-sm">
        <span className="font-semibold text-slate-700 truncate max-w-xs">{exam.title}</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:block">
            {answered} / {questions.length} cevaplandı
          </span>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timeColor}`}>
            <Clock className="w-5 h-5" />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Soru */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-500">
                  Soru {soruIndex + 1} / {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  {currentQ?.kazanim_code && (
                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                      {currentQ.kazanim_code}
                    </span>
                  )}
                  <button
                    onClick={() => currentQ && toggleFlag(currentQ.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      currentQ && flagged.has(currentQ.id) ? "bg-amber-100 text-amber-600" : "hover:bg-slate-100 text-slate-400"
                    }`}
                    title="Şüpheli işaretle"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* İlerleme çubuğu */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${((soruIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              <p className="text-slate-800 font-medium leading-relaxed mb-7 text-base lg:text-lg">
                {currentQ?.question_text}
              </p>

              <div className="space-y-3">
                {currentQ?.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.option_letter;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => answerQuestion(currentQ.id, opt.option_letter)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all font-medium text-sm ${
                        isSelected
                          ? "border-teal-400 bg-teal-50 text-teal-800 shadow-sm"
                          : "border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 text-slate-700"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        isSelected ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {opt.option_letter}
                      </span>
                      {opt.option_text}
                    </button>
                  );
                })}
              </div>

              {/* Navigasyon */}
              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSoruIndex((i) => Math.max(0, i - 1))}
                  disabled={soruIndex === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-sm font-medium transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Önceki
                </button>
                {soruIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setSoruIndex((i) => i + 1)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
                  >
                    Sonraki
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (unanswered > 0) {
                        if (!confirm(`${unanswered} soru boş bırakıldı. Yine de teslim et?`)) return;
                      }
                      submitExam();
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Sınavı Teslim Et
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Soru navigasyon paneli */}
          <div className="lg:w-64">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm sticky top-20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700">Sorular</h3>
                <span className="text-xs text-slate-500">{answered}/{questions.length}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {questions.map((q, i) => {
                  const isAnswered = !!answers[q.id];
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = soruIndex === i;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSoruIndex(i)}
                      className={`h-8 w-full rounded-lg text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-teal-600 text-white ring-2 ring-teal-300"
                          : isFlagged
                          ? "bg-amber-100 text-amber-700 border border-amber-300"
                          : isAnswered
                          ? "bg-teal-100 text-teal-700"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Renk açıklaması */}
              <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-teal-100 shrink-0" /> Cevaplandı</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 shrink-0" /> Şüpheli</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-100 shrink-0" /> Boş</div>
              </div>

              <button
                onClick={() => {
                  if (unanswered > 0) {
                    if (!confirm(`${unanswered} soru boş bırakıldı. Yine de teslim et?`)) return;
                  }
                  submitExam();
                }}
                className="mt-4 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Teslim Et
              </button>
              {unanswered > 0 && (
                <p className="mt-2 text-center text-xs text-amber-600 font-medium">
                  {unanswered} soru boş
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
