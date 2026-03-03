"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Question } from "@/lib/api";
import { ArrowLeft, Clock, CheckCircle, XCircle, RefreshCw, Trophy, Zap } from "lucide-react";

const DEMO_QUESTIONS: Question[] = [
  {
    id: 1, question_text: "2³ · 2⁴ işleminin sonucu kaçtır?",
    kazanim_code: "M.8.1.1", difficulty: "easy", type: "classic",
    options: [
      { id: 1, option_letter: "A", option_text: "16" },
      { id: 2, option_letter: "B", option_text: "32" },
      { id: 3, option_letter: "C", option_text: "128" },
      { id: 4, option_letter: "D", option_text: "64" },
    ],
  },
  {
    id: 2, question_text: "√16 + √9 işleminin sonucu kaçtır?",
    kazanim_code: "M.8.2.1", difficulty: "easy", type: "classic",
    options: [
      { id: 5, option_letter: "A", option_text: "5" },
      { id: 6, option_letter: "B", option_text: "6" },
      { id: 7, option_letter: "C", option_text: "7" },
      { id: 8, option_letter: "D", option_text: "8" },
    ],
  },
  {
    id: 3, question_text: "3x + 5 = 20 ise x kaçtır?",
    kazanim_code: "M.8.3.1", difficulty: "medium", type: "classic",
    options: [
      { id: 9, option_letter: "A", option_text: "3" },
      { id: 10, option_letter: "B", option_text: "4" },
      { id: 11, option_letter: "C", option_text: "5" },
      { id: 12, option_letter: "D", option_text: "6" },
    ],
  },
  {
    id: 4, question_text: "Bir çarpım 0'a eşitse en az bir çarpan sıfırdır. Bu kuralın adı nedir?",
    kazanim_code: "M.8.3.2", difficulty: "medium", type: "classic",
    options: [
      { id: 13, option_letter: "A", option_text: "Dağılma özelliği" },
      { id: 14, option_letter: "B", option_text: "Sıfır çarpanlar özelliği" },
      { id: 15, option_letter: "C", option_text: "Birleşme özelliği" },
      { id: 16, option_letter: "D", option_text: "Ötelenme özelliği" },
    ],
  },
  {
    id: 5, question_text: "(-3)² işleminin sonucu kaçtır?",
    kazanim_code: "M.8.1.1", difficulty: "easy", type: "classic",
    options: [
      { id: 17, option_letter: "A", option_text: "-9" },
      { id: 18, option_letter: "B", option_text: "9" },
      { id: 19, option_letter: "C", option_text: "6" },
      { id: 20, option_letter: "D", option_text: "-6" },
    ],
  },
];

// Demo cevap anahtarı: soru id → doğru şık (demo için index 1 / 2 / 1 / 1 / 1)
const DEMO_CORRECT: Record<number, string> = { 1: "C", 2: "C", 3: "C", 4: "B", 5: "B" };

const TEST_DURATION = 300; // 5 dk

type Phase = "start" | "test" | "result";

type AnswerState = {
  selected: string;
  correct_option: string;
  is_correct: boolean;
  explanation?: string;
};

export default function MiniTestPage() {
  const { token } = useAuth();


  const [phase, setPhase] = useState<Phase>("start");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [soruIndex, setSoruIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [sure, setSure] = useState(TEST_DURATION);
  const [startTime, setStartTime] = useState<number>(0);

  // Süre sayacı
  useEffect(() => {
    if (phase !== "test") return;
    if (sure <= 0) { setPhase("result"); return; }
    const t = setInterval(() => setSure((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, sure]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    if (!token) {
      setQuestions(DEMO_QUESTIONS);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getQuestions(token, { per_page: 5, difficulty: "easy" });
      setQuestions(res.data.length >= 3 ? res.data : DEMO_QUESTIONS);
    } catch {
      setQuestions(DEMO_QUESTIONS);
    }
    setLoading(false);
  }, [token]);

  const startTest = async () => {
    await loadQuestions();
    setSoruIndex(0);
    setAnswers({});
    setSure(TEST_DURATION);
    setStartTime(Date.now());
    setPhase("test");
  };

  const currentQ = questions[soruIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  const handleAnswer = async (optionLetter: string) => {
    if (!currentQ || currentAnswer) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    let correctOption = "";
    let isCorrect = false;
    let explanation: string | undefined;

    if (!token) {
      correctOption = DEMO_CORRECT[currentQ.id] ?? currentQ.options[0]?.option_letter;
      isCorrect = optionLetter === correctOption;
    } else {
      try {
        const res = await api.answerQuestion(token, {
          question_id: currentQ.id,
          selected_option: optionLetter,
          time_spent_seconds: timeSpent,
        });
        correctOption = res.correct_option;
        isCorrect = res.is_correct;
        explanation = res.explanation;
      } catch {
        correctOption = optionLetter;
        isCorrect = true;
      }
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { selected: optionLetter, correct_option: correctOption, is_correct: isCorrect, explanation },
    }));
    setStartTime(Date.now());
  };

  const nextQuestion = () => {
    if (soruIndex < questions.length - 1) {
      setSoruIndex((i) => i + 1);
    } else {
      setPhase("result");
    }
  };

  const retryWrong = () => {
    const wrongQs = questions.filter((q) => answers[q.id] && !answers[q.id].is_correct);
    if (wrongQs.length === 0) return;
    const newAnswers: Record<number, AnswerState> = {};
    Object.entries(answers).forEach(([k, v]) => {
      if (v.is_correct) newAnswers[parseInt(k)] = v;
    });
    setQuestions(wrongQs);
    setAnswers(newAnswers);
    setSoruIndex(0);
    setSure(TEST_DURATION);
    setStartTime(Date.now());
    setPhase("test");
  };

  const correctCount = Object.values(answers).filter((a) => a.is_correct).length;
  const totalAnswered = Object.keys(answers).length;
  const net = (correctCount - (totalAnswered - correctCount) / 4).toFixed(2);
  const wrongAnswers = questions.filter((q) => answers[q.id] && !answers[q.id].is_correct);
  const successRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  // --- Başlangıç ekranı ---
  if (phase === "start") {
    return (
      <div className="p-8 lg:p-12">
        <Link href="/ogrenci" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Ana panele dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Mini Test</h1>
        <p className="text-slate-600 mb-8">
          Anında doğru/yanlış · Süre sayacı · Yanlış sorulara otomatik tekrar
        </p>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md shadow-sm">
          <ul className="space-y-3 text-sm text-slate-600 mb-8">
            {[
              "5 dakika süre",
              "Her soruda anında doğru/yanlış gösterilir",
              "Yanlış yaptıkların kazanım planına eklenir",
              "Net hesabı otomatik yapılır",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={startTest}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Yükleniyor...</>
            ) : (
              <><Zap className="w-5 h-5" /> Testi Başlat</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // --- Sonuç ekranı ---
  if (phase === "result") {
    return (
      <div className="p-8 lg:p-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Test Tamamlandı</h1>

        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Soru", value: totalAnswered, color: "text-slate-900" },
            { label: "Doğru", value: correctCount, color: "text-teal-600" },
            { label: "Yanlış", value: totalAnswered - correctCount, color: "text-red-500" },
            { label: "Net", value: net, color: "text-slate-900" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Başarı oranı */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">Başarı Oranı</span>
            <span className="font-bold text-teal-600">%{successRate}</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${successRate >= 70 ? "bg-teal-500" : successRate >= 40 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${successRate}%` }}
            />
          </div>
          {successRate >= 70 && (
            <div className="mt-3 flex items-center gap-2 text-teal-600">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-semibold">Harika! Bu konuyu iyi biliyorsun.</span>
            </div>
          )}
        </div>

        {/* Yanlış sorular özeti */}
        {wrongAnswers.length > 0 && (
          <div className="bg-red-50 rounded-2xl border border-red-100 p-5 mb-6">
            <h3 className="font-bold text-red-800 mb-3">Yanlış Yaptığın Sorular ({wrongAnswers.length})</h3>
            <ul className="space-y-2">
              {wrongAnswers.map((q) => (
                <li key={q.id} className="flex items-start gap-2 text-sm text-red-700">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{q.question_text.slice(0, 80)}...</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {wrongAnswers.length > 0 && (
            <button
              onClick={retryWrong}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Yanlışları Tekrarla ({wrongAnswers.length})
            </button>
          )}
          <button
            onClick={startTest}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
          >
            <Zap className="w-4 h-4" />
            Yeni Test
          </button>
          <Link
            href="/ogrenci"
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
          >
            Panele Dön
          </Link>
        </div>
      </div>
    );
  }

  // --- Test ekranı ---
  if (!currentQ) return null;

  const timeColor = sure <= 60 ? "text-red-600" : sure <= 120 ? "text-amber-600" : "text-teal-600";

  return (
    <div className="p-8 lg:p-12">
      {/* Üst bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setPhase("result")}
          className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors"
        >
          ← Çıkış
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium">
            {soruIndex + 1} / {questions.length}
          </span>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timeColor}`}>
            <Clock className="w-5 h-5" />
            {Math.floor(sure / 60)}:{(sure % 60).toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* İlerleme çubuğu */}
      <div className="h-1.5 bg-slate-200 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all"
          style={{ width: `${((soruIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Soru kartı */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        {currentQ.kazanim_code && (
          <span className="inline-block font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg mb-4">
            {currentQ.kazanim_code}
          </span>
        )}
        <p className="text-lg text-slate-800 font-medium mb-7 leading-relaxed">{currentQ.question_text}</p>

        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = currentAnswer?.selected === opt.option_letter;
            const isCorrectOpt = currentAnswer?.correct_option === opt.option_letter;
            const isWrong = currentAnswer && isSelected && !currentAnswer.is_correct;
            const showResult = !!currentAnswer;

            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.option_letter)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all font-medium ${
                  showResult
                    ? isCorrectOpt
                      ? "border-teal-400 bg-teal-50 text-teal-800"
                      : isWrong
                      ? "border-red-400 bg-red-50 text-red-800"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                    : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/30"
                } disabled:cursor-not-allowed`}
              >
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                  showResult
                    ? isCorrectOpt ? "bg-teal-500 text-white" : isWrong ? "bg-red-500 text-white" : "bg-slate-200 text-slate-500"
                    : "bg-slate-200 text-slate-600 group-hover:bg-teal-100"
                }`}>
                  {opt.option_letter}
                </span>
                <span className="flex-1">{opt.option_text}</span>
                {showResult && isCorrectOpt && <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />}
                {showResult && isWrong && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Sonuç + açıklama */}
        {currentAnswer && (
          <div className="mt-6 space-y-3">
            <div className={`flex items-center gap-2 text-sm font-bold ${currentAnswer.is_correct ? "text-teal-600" : "text-red-600"}`}>
              {currentAnswer.is_correct ? (
                <><CheckCircle className="w-5 h-5" /> Doğru! Harika!</>
              ) : (
                <><XCircle className="w-5 h-5" /> Yanlış. Doğru cevap: {currentAnswer.correct_option}</>
              )}
            </div>
            {currentAnswer.explanation && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Açıklama: </span>{currentAnswer.explanation}
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={nextQuestion}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
              >
                {soruIndex < questions.length - 1 ? "Sonraki Soru →" : "Testi Bitir"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


