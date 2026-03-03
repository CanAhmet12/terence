"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Question, AnswerResult } from "@/lib/api";
import { Search, RefreshCw, CheckCircle, XCircle, ChevronRight, BookOpen, Loader2 } from "lucide-react";

const DEMO_QUESTIONS: Question[] = [
  {
    id: 1,
    question_text: "2³ · 2⁴ işleminin sonucu kaçtır?",
    kazanim_code: "M.8.1.1",
    difficulty: "easy",
    type: "classic",
    options: [
      { id: 1, option_letter: "A", option_text: "16" },
      { id: 2, option_letter: "B", option_text: "32" },
      { id: 3, option_letter: "C", option_text: "64" },
      { id: 4, option_letter: "D", option_text: "128" },
    ],
  },
  {
    id: 2,
    question_text: "Hareket denklemlerinde ivme–zaman grafiğinin altındaki alan neyi verir?",
    kazanim_code: "F.9.1.1",
    difficulty: "medium",
    type: "classic",
    options: [
      { id: 5, option_letter: "A", option_text: "Yer değiştirme" },
      { id: 6, option_letter: "B", option_text: "Hız değişimi" },
      { id: 7, option_letter: "C", option_text: "Konum" },
      { id: 8, option_letter: "D", option_text: "Yol" },
    ],
  },
  {
    id: 3,
    question_text: "Aşağıdaki paragrafta ana düşünce nedir? \"Teknoloji insan hayatını kolaylaştırmaktadır...\"",
    kazanim_code: "T.9.2.1",
    difficulty: "hard",
    type: "paragraph",
    options: [
      { id: 9, option_letter: "A", option_text: "Teknoloji zararlıdır" },
      { id: 10, option_letter: "B", option_text: "Teknoloji hayatı kolaylaştırır" },
      { id: 11, option_letter: "C", option_text: "İnsanlar teknoloji üretemez" },
      { id: 12, option_letter: "D", option_text: "Teknoloji pahalıdır" },
    ],
  },
];

const DIFFICULTY_CONFIG = {
  easy: { label: "Kolay", cls: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Orta", cls: "bg-amber-100 text-amber-700" },
  hard: { label: "Zor", cls: "bg-red-100 text-red-700" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function SoruBankasiPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [answerResults, setAnswerResults] = useState<Record<number, AnswerResult & { selected: string }>>({});
  const [loadingSimilar, setLoadingSimilar] = useState<number | null>(null);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimes = useRef<Record<number, number>>({});

  const loadQuestions = useCallback(async (kazanim?: string, diff?: string) => {
    setLoading(true);
    if (isDemo) {
      let filtered = DEMO_QUESTIONS;
      if (kazanim) filtered = filtered.filter((q) => q.kazanim_code?.toLowerCase().includes(kazanim.toLowerCase()));
      if (diff) filtered = filtered.filter((q) => q.difficulty === diff);
      setQuestions(filtered);
      const now = Date.now();
      filtered.forEach((q) => { questionStartTimes.current[q.id] = now; });
      setLoading(false);
      return;
    }
    if (!token) { setLoading(false); return; }
    try {
      const params: Record<string, string | number> = { per_page: 20 };
      if (kazanim) params.kazanim_code = kazanim;
      if (diff) params.difficulty = diff;
      const res = await api.getQuestions(token, params as Parameters<typeof api.getQuestions>[1]);
      setQuestions(res.data);
      const now2 = Date.now();
      res.data.forEach((q: Question) => { questionStartTimes.current[q.id] = now2; });
    } catch {
      setQuestions(DEMO_QUESTIONS);
    }
    setLoading(false);
  }, [token, isDemo]);

  // Debounced arama
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadQuestions(search, difficulty);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, difficulty, loadQuestions]);

  const handleAnswer = async (question: Question, optionLetter: string) => {
    if (answerResults[question.id] || answeringId === question.id) return;
    setSelectedAnswers((prev) => ({ ...prev, [question.id]: optionLetter }));
    setAnsweringId(question.id);

    const startTime = questionStartTimes.current[question.id] ?? Date.now();
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    if (isDemo || !token) {
      // Demo: İlk şık doğru kabul et
      const isCorrect = optionLetter === question.options[0]?.option_letter;
      setTimeout(() => {
        setAnswerResults((prev) => ({
          ...prev,
          [question.id]: { is_correct: isCorrect, correct_option: question.options[0]?.option_letter ?? "A", selected: optionLetter },
        }));
        setAnsweringId(null);
      }, 300);
      return;
    }

    try {
      const result = await api.answerQuestion(token, {
        question_id: question.id,
        selected_option: optionLetter,
        time_spent_seconds: timeSpentSeconds > 0 ? timeSpentSeconds : 1,
      });
      setAnswerResults((prev) => ({
        ...prev,
        [question.id]: { ...result, selected: optionLetter },
      }));
    } catch {
      setAnswerResults((prev) => ({
        ...prev,
        [question.id]: { is_correct: false, correct_option: "", selected: optionLetter },
      }));
    }
    setAnsweringId(null);
  };

  const handleSimilar = async (questionId: number) => {
    if (!token || isDemo) return;
    setLoadingSimilar(questionId);
    try {
      const res = await api.getSimilarQuestions(token, questionId);
      if (res.data.length > 0) {
        setQuestions((prev) => {
          const idx = prev.findIndex((q) => q.id === questionId);
          const next = [...prev];
          next.splice(idx + 1, 0, ...res.data.slice(0, 2));
          return next;
        });
      }
    } catch {}
    setLoadingSimilar(null);
  };

  const correctCount = Object.values(answerResults).filter((r) => r.is_correct).length;
  const answeredCount = Object.keys(answerResults).length;

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Soru Bankası</h1>
        <p className="text-slate-600 mt-1">Zorluk & kazanım filtresi · Anında doğrulama · Benzer soru getir</p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
      </div>

      {/* İstatistik bandı */}
      {answeredCount > 0 && (
        <div className="mb-6 flex items-center gap-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <p className="text-xs text-slate-500 font-medium">Cevaplanan</p>
            <p className="text-xl font-bold text-slate-900">{answeredCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Doğru</p>
            <p className="text-xl font-bold text-teal-600">{correctCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Yanlış</p>
            <p className="text-xl font-bold text-red-500">{answeredCount - correctCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Net</p>
            <p className="text-xl font-bold text-slate-900">
              {(correctCount - (answeredCount - correctCount) / 4).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Kazanım kodu veya konu ara (örn: M.8.1.1)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
        >
          <option value="">Tüm Zorluklar</option>
          <option value="easy">Kolay</option>
          <option value="medium">Orta</option>
          <option value="hard">Zor</option>
        </select>
      </div>

      {/* Sorular */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Soru bulunamadı</p>
          <p className="text-sm text-slate-500 mt-1">Arama kriterlerini değiştirmeyi dene.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((soru) => {
            const result = answerResults[soru.id];
            const selected = selectedAnswers[soru.id];
            const diffConf = DIFFICULTY_CONFIG[soru.difficulty ?? "medium"] ?? DIFFICULTY_CONFIG.medium;

            return (
              <div
                key={soru.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all ${
                  result
                    ? result.is_correct
                      ? "border-teal-200 shadow-teal-100/50"
                      : "border-red-200 shadow-red-100/50"
                    : "border-slate-200 hover:shadow-md"
                }`}
              >
                <div className="p-6">
                  {/* Başlık */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {soru.kazanim_code && (
                        <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                          {soru.kazanim_code}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${diffConf.cls}`}>
                        {diffConf.label}
                      </span>
                      {result && (
                        result.is_correct
                          ? <span className="flex items-center gap-1 text-xs font-bold text-teal-600"><CheckCircle className="w-4 h-4" /> Doğru</span>
                          : <span className="flex items-center gap-1 text-xs font-bold text-red-600"><XCircle className="w-4 h-4" /> Yanlış</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSimilar(soru.id)}
                      disabled={!!loadingSimilar || isDemo}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold shrink-0 disabled:opacity-50 transition-colors"
                      title="Benzer soru getir"
                    >
                      {loadingSimilar === soru.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Benzer Soru
                    </button>
                  </div>

                  {/* Soru metni */}
                  <p className="text-slate-800 font-medium mb-5 leading-relaxed">{soru.question_text}</p>

                  {/* Şıklar */}
                  <div className="grid sm:grid-cols-2 gap-2">
                    {soru.options.map((opt) => {
                      const isSelected = selected === opt.option_letter;
                      const isCorrectOpt = result?.correct_option === opt.option_letter;
                      const isWrongSelected = result && isSelected && !result.is_correct;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleAnswer(soru, opt.option_letter)}
                          disabled={!!result || answeringId === soru.id}
                          className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 transition-all text-sm font-medium ${
                            isCorrectOpt && result
                              ? "border-teal-400 bg-teal-50 text-teal-800"
                              : isWrongSelected
                              ? "border-red-400 bg-red-50 text-red-800"
                              : isSelected
                              ? "border-teal-300 bg-teal-50/50"
                              : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                          } disabled:cursor-not-allowed`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCorrectOpt && result ? "bg-teal-500 text-white" :
                            isWrongSelected ? "bg-red-500 text-white" :
                            "bg-slate-200 text-slate-600"
                          }`}>
                            {opt.option_letter}
                          </span>
                          <span className="flex-1">{opt.option_text}</span>
                          {isCorrectOpt && result && <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />}
                          {isWrongSelected && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Açıklama */}
                  {result?.explanation && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Açıklama: </span>{result.explanation}
                      </p>
                    </div>
                  )}

                  {/* Sonraki soru önerisi */}
                  {result && !result.is_correct && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="font-medium">Bu kazanıma benzer sorular günlük planına eklendi.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => loadQuestions(search, difficulty)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
          >
            <ChevronRight className="w-5 h-5 text-teal-600" />
            Daha Fazla Soru Yükle
          </button>
        </div>
      )}

      <p className="mt-6 text-sm text-slate-500">
        Yanlış yaptığın sorular kazanım bazlı analiz edilir ve günlük planına otomatik eklenir.
      </p>
    </div>
  );
}
