"use client";

import dynamic from "next/dynamic";

const Library3D = dynamic(() => import("@/components/Library3D"), { ssr: false });
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Question, AnswerResult } from "@/lib/api";
import { Loader2, Mic, MicOff, Volume2, Sparkles, X, Bot, AlertCircle } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

// ─── Sesli Soru Asistanı Modal ─────────────────────────────────────────────
function VoiceAssistantModal({ token, onClose }: { token: string | null; onClose: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = () => {
    if (!supported) { setError("Tarayıcınız ses tanımayı desteklemiyor."); return; }
    const SRConstructor = (window as unknown as Record<string, unknown>)["SpeechRecognition"] as (new() => { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null }) | undefined;
    const SRWebkit = (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"] as typeof SRConstructor;
    const SR = SRConstructor || SRWebkit;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
    };
    recognition.onerror = () => { setIsListening(false); setError("Ses alınamadı. Tekrar deneyin."); };
    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    setError(null);
    recognition.start();
  };

  const stopListening = () => {
    const r = recognitionRef.current as { stop: () => void } | null;
    r?.stop();
    setIsListening(false);
  };

  const askAI = async () => {
    if (!transcript.trim() || !token) return;
    setLoading(true);
    setAiAnswer(null);
    setError(null);
    try {
      const res = await api.askCoach(`Şu soruyu Türkçe kısaca açıkla ve cevabını ver: ${transcript}`);
      setAiAnswer(res.reply);
      // Sesli okuma
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(res.reply);
        utterance.lang = "tr-TR";
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      setError((e as Error).message || "AI yanıt veremedi.");
    }
    setLoading(false);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  useEffect(() => {
    return () => {
      const r = recognitionRef.current as { stop: () => void } | null;
      r?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isListening ? "bg-red-100 animate-pulse" : "bg-teal-100"}`}>
              <Mic className={`w-5 h-5 ${isListening ? "text-red-600" : "text-teal-600"}`} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Sesli Soru Çözüm Asistanı</h3>
              <p className="text-xs text-slate-500">Soruyu sesli oku, AI açıklasın</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!supported && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Bu tarayıcı ses tanımayı desteklemiyor. Chrome veya Edge kullanın.
            </div>
          )}

          {/* Ses kaydı alanı */}
          <div className="text-center space-y-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!supported}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all shadow-lg ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/30 scale-110"
                  : "bg-teal-600 hover:bg-teal-700 shadow-teal-500/30 hover:scale-105"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
            </button>
            <p className="text-sm font-medium text-slate-600">
              {isListening ? "Dinleniyor... (durdurmak için tıkla)" : "Soruyu sesli okumak için tıkla"}
            </p>
          </div>

          {/* Transkript */}
          {transcript && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Duyulan Soru</p>
              <p className="text-sm text-slate-800 leading-relaxed">{transcript}</p>
              <div className="flex gap-2">
                <button
                  onClick={askAI}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Yanıt alınıyor...</> : <><Bot className="w-4 h-4" /> AI'dan Cevap Al</>}
                </button>
                <button
                  onClick={() => { setTranscript(""); setAiAnswer(null); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Temizle
                </button>
              </div>
            </div>
          )}

          {/* AI Yanıtı */}
          {aiAnswer && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
                  <Bot className="w-4 h-4" />
                  AI Cevabı
                </div>
                {speaking ? (
                  <button onClick={stopSpeaking} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium">
                    <MicOff className="w-3.5 h-3.5" /> Durdur
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if ("speechSynthesis" in window) {
                        const u = new SpeechSynthesisUtterance(aiAnswer);
                        u.lang = "tr-TR";
                        u.onstart = () => setSpeaking(true);
                        u.onend = () => setSpeaking(false);
                        window.speechSynthesis.speak(u);
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Sesli Oku
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{aiAnswer}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SUBJECT_OPTIONS = [
  { value: "", label: "Tüm Dersler" },
  { value: "Matematik", label: "Matematik" },
  { value: "Türkçe", label: "Türkçe" },
  { value: "Fen Bilimleri", label: "Fen Bilimleri" },
  { value: "Fizik", label: "Fizik" },
  { value: "Kimya", label: "Kimya" },
  { value: "Biyoloji", label: "Biyoloji" },
  { value: "Tarih", label: "Tarih" },
  { value: "Coğrafya", label: "Coğrafya" },
];

// Ders → 3D kitap rengi eşleşmesi
const SUBJECT_COLORS: Record<string, string> = {
  "Matematik":     "#0d9488",
  "Türkçe":        "#2563eb",
  "Fen Bilimleri": "#7c3aed",
  "Fizik":         "#dc2626",
  "Kimya":         "#d97706",
  "Biyoloji":      "#16a34a",
  "Tarih":         "#9333ea",
  "Coğrafya":      "#0891b2",
  "default":       "#64748b",
};

export default function SoruBankasiPage() {
  const { token } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [subject, setSubject] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [answerResults, setAnswerResults] = useState<Record<number, AnswerResult & { selected: string }>>({});
  const [loadingSimilar, setLoadingSimilar] = useState<number | null>(null);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimes = useRef<Record<number, number>>({});
  const [showVoice, setShowVoice] = useState(false);
  const [showPersonalTest, setShowPersonalTest] = useState(false);
  const [selectedLibrarySubject, setSelectedLibrarySubject] = useState<string | null>(null);

  const loadQuestions = useCallback(async (kazanim?: string, diff?: string, subj?: string, p = 1) => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: 20, page: p };
      if (kazanim) params.kazanim_code = kazanim;
      if (diff) params.difficulty = diff;
      if (subj) params.subject = subj;
      const res = await api.getQuestions(params as Record<string, unknown>);
      const resData = Array.isArray((res as Record<string, unknown>).data) ? (res as Record<string, unknown>).data as Question[] : Array.isArray(res) ? res as Question[] : [];
      if (p === 1) {
        setQuestions(resData);
      } else {
        setQuestions((prev) => [...prev, ...resData]);
      }
      setHasMore(resData.length === 20);
      const now = Date.now();
      resData.forEach((q: Question) => { questionStartTimes.current[q.id] = now; });
    } catch {
      if (p === 1) setQuestions([]);
      setHasMore(false);
    }
    setLoading(false);
  }, [token]);

  // Debounced arama — filtre değişince page'i sıfırla
  useEffect(() => {
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadQuestions(search, difficulty, subject, 1);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, difficulty, subject, loadQuestions]);

  const handleAnswer = async (question: Question, optionLetter: string) => {
    if (!token) return;
    if (answerResults[question.id] || answeringId === question.id) return;
    setSelectedAnswers((prev) => ({ ...prev, [question.id]: optionLetter }));
    setAnsweringId(question.id);

    const startTime = questionStartTimes.current[question.id] ?? Date.now();
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);


    try {
      const result = await api.answerQuestion({
        question_id: question.id,
        answer: optionLetter,
        time_spent: timeSpentSeconds > 0 ? timeSpentSeconds : 1,
      } as Parameters<typeof api.answerQuestion>[0]);
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
    if (!token) return;
    setLoadingSimilar(questionId);
    try {
      const res = await api.getSimilarQuestions(questionId);
      const resArr = Array.isArray(res) ? res : (Array.isArray((res as Record<string, unknown>).data) ? (res as Record<string, unknown>).data as Question[] : []);
      if (resArr.length > 0) {
        setQuestions((prev) => {
          const idx = prev.findIndex((q) => q.id === questionId);
          const next = [...prev];
          next.splice(idx + 1, 0, ...resArr.slice(0, 2));
          return next;
        });
      }
    } catch {}
    setLoadingSimilar(null);
  };

  const correctCount = Object.values(answerResults).filter((r) => r.is_correct).length;
  const answeredCount = Object.keys(answerResults).length;

  // 3D Kütüphane için kitap listesi: her ders bir kitap
  const libraryBooks = SUBJECT_OPTIONS.filter((s) => s.value !== "").map((s, i) => ({
    id: i + 1,
    title: s.label,
    subject: s.value,
    color: SUBJECT_COLORS[s.value] ?? SUBJECT_COLORS.default,
    progress: Math.round(
      Object.values(answerResults).filter(() => true).length > 0
        ? (correctCount / Math.max(answeredCount, 1)) * 100
        : Math.floor(Math.random() * 40)
    ),
  }));

  const [bookModalSubject, setBookModalSubject] = useState<string | null>(null);
  const [bookModalTitle, setBookModalTitle]     = useState<string>("");

  const handleLibraryBookClick = (bookId: number) => {
    const book = libraryBooks.find((b) => b.id === bookId);
    if (!book) return;
    // Kitap modalını aç — PDF kitap görünümünde sorular
    setBookModalSubject(book.subject);
    setBookModalTitle(book.title);
    setSelectedLibrarySubject(book.subject);
    setSubject(book.subject);
    // Soruları yükle
    loadQuestions(undefined, undefined, book.subject, 1);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Başlık */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Soru Bankası</h1>
          <p className="text-slate-500 mt-1 text-sm">Kategoriye göre ders seç → soruları çöz → anında doğrula</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowVoice(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-sm rounded-xl transition-colors"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Sesli Çöz</span>
          </button>
          <button
            onClick={() => setShowPersonalTest(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-purple-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Bana Özel Test</span>
          </button>
        </div>
      </div>

      {/* İstatistik bandı */}
      {answeredCount > 0 && (
        <div className="mb-6 flex items-center gap-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex-wrap">
          {[
            { label: "Cevaplanan", value: answeredCount, color: "text-slate-900" },
            { label: "Doğru", value: correctCount, color: "text-teal-600" },
            { label: "Yanlış", value: answeredCount - correctCount, color: "text-red-500" },
            { label: "Net", value: (correctCount - (answeredCount - correctCount) / 4).toFixed(2), color: "text-indigo-600" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 3D Kütüphane */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/40 shadow-2xl mb-6">
        <Library3D
          books={libraryBooks}
          onBookClick={handleLibraryBookClick}
        />
      </div>

      {/* Alt istatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Toplam Ders", value: libraryBooks.length, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
          { label: "Çözülen Soru", value: answeredCount, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Doğru Cevap", value: correctCount, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Başarı Oranı", value: answeredCount > 0 ? `%${Math.round((correctCount/answeredCount)*100)}` : "—", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border ${border} shadow-sm`}>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sesli Asistan Modal */}
      {showVoice && (
        <VoiceAssistantModal token={token} onClose={() => setShowVoice(false)} />
      )}

      {/* Bana Özel Test Modal */}
      {showPersonalTest && (
        <PersonalTestModal
          token={token}
          onClose={() => setShowPersonalTest(false)}
          onLoad={(qs) => {
            setQuestions(qs);
            setShowPersonalTest(false);
            setSelectedAnswers({});
            setAnswerResults({});
          }}
        />
      )}

      {/* Kitap PDF Modalı */}
      {bookModalSubject && (
        <BookQuestionsModal
          subject={bookModalSubject}
          title={bookModalTitle}
          questions={questions}
          loading={loading}
          answerResults={answerResults}
          selectedAnswers={selectedAnswers}
          answeringId={answeringId}
          onAnswer={handleAnswer}
          onClose={() => setBookModalSubject(null)}
        />
      )}
    </div>
  );
}

// ─── Bana Özel Test Modal (5.4) ───────────────────────────────────────────────
function PersonalTestModal({
  token,
  onClose,
  onLoad,
}: {
  token: string | null;
  onClose: () => void;
  onLoad: (questions: Question[]) => void;
}) {
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!token) { setError("Oturum bulunamadı."); return; }
    setGenerating(true);
    setError(null);
    try {
      const res = await api.generatePersonalTest({
        subject: subject || undefined,
        count,
        difficulty: difficulty || undefined,
      } as Parameters<typeof api.generatePersonalTest>[0]);
      const questions = Array.isArray(res) ? res : (Array.isArray((res as Record<string, unknown>).questions) ? (res as Record<string, unknown>).questions as Question[] : []);
      onLoad(questions);
    } catch (e) {
      setError((e as Error).message || "Test oluşturulamadı.");
    }
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Bana Özel Test</h3>
              <p className="text-xs text-slate-500">Zayıf kazanımlarına göre özelleştirilmiş test</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-sm text-purple-700 flex items-start gap-2">
            <Bot className="w-4 h-4 shrink-0 mt-0.5" />
            AI, zayıf kazanımlarını analiz ederek en çok gelişime ihtiyacın olan konulardan soru seçer.
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ders (opsiyonel)</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">Tüm Dersler (AI seçsin)</option>
              {["Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Edebiyat", "Tarih", "Coğrafya"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Soru Sayısı</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} Soru</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Zorluk</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Karışık</option>
                <option value="easy">Kolay</option>
                <option value="medium">Orta</option>
                <option value="hard">Zor</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Test Oluşturuluyor...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {count} Soruluk Test Oluştur</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kitap PDF Modal ─────────────────────────────────────────────────────────
const BOOK_COVER_COLORS: Record<string, { bg: string; accent: string; spine: string }> = {
  'Matematik':     { bg: 'linear-gradient(135deg,#1565c0,#0d47a1)', accent: '#90caf9', spine: '#1a237e' },
  'Türkçe':        { bg: 'linear-gradient(135deg,#c62828,#b71c1c)', accent: '#ef9a9a', spine: '#7f0000' },
  'Fen Bilimleri': { bg: 'linear-gradient(135deg,#2e7d32,#1b5e20)', accent: '#a5d6a7', spine: '#1b5e20' },
  'Fizik':         { bg: 'linear-gradient(135deg,#6a1b9a,#4a148c)', accent: '#ce93d8', spine: '#4a148c' },
  'Kimya':         { bg: 'linear-gradient(135deg,#ef6c00,#e65100)', accent: '#ffcc80', spine: '#e65100' },
  'Biyoloji':      { bg: 'linear-gradient(135deg,#00695c,#004d40)', accent: '#80cbc4', spine: '#004d40' },
  'Tarih':         { bg: 'linear-gradient(135deg,#4e342e,#3e2723)', accent: '#bcaaa4', spine: '#3e2723' },
  'Coğrafya':      { bg: 'linear-gradient(135deg,#01579b,#0d3349)', accent: '#81d4fa', spine: '#0d3349' },
  'default':       { bg: 'linear-gradient(135deg,#37474f,#263238)', accent: '#90a4ae', spine: '#263238' },
}

const DIFF_COLORS: Record<string, { dot: string; label: string }> = {
  easy:   { dot: '#22c55e', label: 'Kolay' },
  medium: { dot: '#f59e0b', label: 'Orta' },
  hard:   { dot: '#ef4444', label: 'Zor' },
}

function BookQuestionsModal({
  subject, title, questions, loading,
  answerResults, selectedAnswers, answeringId,
  onAnswer, onClose,
}: {
  subject: string;
  title: string;
  questions: Question[];
  loading: boolean;
  answerResults: Record<number, AnswerResult & { selected: string }>;
  selectedAnswers: Record<number, string>;
  answeringId: number | null;
  onAnswer: (q: Question, opt: string) => void;
  onClose: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const theme = BOOK_COVER_COLORS[subject] ?? BOOK_COVER_COLORS.default
  const questionsPerPage = 2
  const totalPages = Math.ceil(questions.length / questionsPerPage)
  const pageQuestions = questions.slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage)
  const correctCount = Object.values(answerResults).filter((r) => r.is_correct).length
  const answeredCount = Object.keys(answerResults).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex w-full max-w-5xl"
        style={{
          height: 'min(88vh, 760px)',
          filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.7))',
          animation: 'bookOpen 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`
          @keyframes bookOpen {
            from { opacity:0; transform: perspective(1200px) rotateY(-20deg) scale(0.92); }
            to   { opacity:1; transform: perspective(1200px) rotateY(0deg) scale(1); }
          }
        `}</style>

        {/* ── SOL KAPAK / SIRT ── */}
        <div
          style={{
            width: '52px',
            background: theme.spine,
            borderRadius: '8px 0 0 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 4px',
            boxShadow: 'inset -4px 0 12px rgba(0,0,0,0.5), -2px 0 8px rgba(0,0,0,0.4)',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '28px', height: '28px',
            background: theme.accent,
            borderRadius: '5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 900, color: theme.spine,
          }}>3D</div>

          <div style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '11px', fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>{title} SORU BANKASI</div>

          <div style={{ fontSize: '9px', color: theme.accent, fontWeight: 700 }}>2026</div>
        </div>

        {/* ── SOL SAYFA (KAPAK) ── */}
        <div
          style={{
            width: '200px',
            background: theme.bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 16px',
            borderRight: '2px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset -6px 0 20px rgba(0,0,0,0.3)',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '48px', fontWeight: 900,
              color: 'rgba(255,255,255,0.15)',
              lineHeight: 1, marginBottom: '12px',
              fontStyle: 'italic',
            }}>3D</div>
            <div style={{
              fontSize: '13px', fontWeight: 900,
              color: '#fff', textTransform: 'uppercase',
              letterSpacing: '1px', lineHeight: 1.3,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>{title}</div>
            <div style={{ fontSize: '10px', color: theme.accent, marginTop: '6px', fontWeight: 600, letterSpacing: '2px' }}>
              SORU BANKASI
            </div>
          </div>

          <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '10px', color: 'rgba(255,255,255,0.7)',
              marginBottom: '6px',
            }}>
              <span>Çözülen</span>
              <span>{answeredCount} / {questions.length}</span>
            </div>
            <div style={{
              height: '6px', background: 'rgba(255,255,255,0.2)',
              borderRadius: '3px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: questions.length > 0 ? `${(answeredCount / questions.length) * 100}%` : '0%',
                background: theme.accent, borderRadius: '3px',
                transition: 'width 0.5s',
              }} />
            </div>
            {answeredCount > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '10px', color: 'rgba(255,255,255,0.6)',
                marginTop: '6px',
              }}>
                <span style={{ color: '#4ade80' }}>✓ {correctCount} Doğru</span>
                <span style={{ color: '#f87171' }}>✗ {answeredCount - correctCount} Yanlış</span>
              </div>
            )}
          </div>

          <div style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.4)',
            position: 'relative', zIndex: 1,
          }}>
            Sayfa {currentPage + 1} / {Math.max(totalPages, 1)}
          </div>
        </div>

        {/* ── SAĞ SAYFA (SORULAR) ── */}
        <div
          style={{
            flex: 1,
            background: '#fafaf8',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', left: '52px', top: 0, bottom: 0,
            width: '1px', background: 'rgba(255,100,100,0.3)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          {/* Başlık */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '2px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fff',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: theme.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 900, color: theme.accent,
              }}>
                {subject.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                  {title} — Sorular
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {questions.length} soru bulundu
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#f1f5f9', border: 'none',
                cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b',
              }}
            >✕</button>
          </div>

          {/* Sorular */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', position: 'relative', zIndex: 1 }}>
            {loading ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: '12px',
              }}>
                <div style={{
                  width: '40px', height: '40px',
                  border: '4px solid #e2e8f0',
                  borderTopColor: theme.spine,
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Sorular yükleniyor...</p>
              </div>
            ) : questions.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: '8px',
              }}>
                <div style={{ fontSize: '40px' }}>📭</div>
                <p style={{ fontWeight: 700, color: '#334155' }}>Bu derse ait soru bulunamadı</p>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Yakında eklenecek</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {pageQuestions.map((soru, idx) => {
                  const result = answerResults[soru.id]
                  const selected = selectedAnswers[soru.id]
                  const diff = DIFF_COLORS[soru.difficulty ?? 'medium'] ?? DIFF_COLORS.medium
                  const qNum = currentPage * questionsPerPage + idx + 1

                  return (
                    <div key={soru.id} style={{
                      background: '#fff',
                      borderRadius: '12px',
                      border: result
                        ? result.is_correct ? '2px solid #22c55e' : '2px solid #ef4444'
                        : '2px solid #e2e8f0',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: '8px', marginBottom: '12px',
                      }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: theme.spine,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 900, color: '#fff',
                          flexShrink: 0,
                        }}>{qNum}</div>

                        <div style={{ flex: 1 }}>
                          {soru.kazanim_code && (
                            <span style={{
                              fontSize: '10px', fontWeight: 700,
                              background: `${theme.spine}18`,
                              color: theme.spine,
                              padding: '2px 8px', borderRadius: '4px',
                              marginRight: '6px',
                            }}>{soru.kazanim_code}</span>
                          )}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '10px', fontWeight: 600, color: diff.dot,
                          }}>
                            <span style={{
                              width: '6px', height: '6px', borderRadius: '50%',
                              background: diff.dot, display: 'inline-block',
                            }} />
                            {diff.label}
                          </span>
                        </div>

                        {result && (
                          <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: result.is_correct ? '#22c55e' : '#ef4444',
                          }}>
                            {result.is_correct ? '✓ Doğru' : '✗ Yanlış'}
                          </span>
                        )}
                      </div>

                      <p style={{
                        fontSize: '14px', fontWeight: 600,
                        color: '#1e293b', lineHeight: 1.6,
                        marginBottom: '14px',
                      }}>{soru.question_text}</p>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                      }}>
                        {soru.options?.map((opt) => {
                          const isSelected = selected === opt.option_letter
                          const isCorrectOpt = result?.correct_option === opt.option_letter
                          const isWrong = result && isSelected && !result.is_correct

                          let bg = '#f8fafc', border = '#e2e8f0', color = '#334155'
                          if (isCorrectOpt && result) { bg = '#f0fdf4'; border = '#22c55e'; color = '#15803d' }
                          else if (isWrong) { bg = '#fef2f2'; border = '#ef4444'; color = '#dc2626' }
                          else if (isSelected) { bg = '#f0f9ff'; border = theme.spine; color = '#1e40af' }

                          return (
                            <button
                              key={opt.id}
                              disabled={!!result || answeringId === soru.id}
                              onClick={() => onAnswer(soru, opt.option_letter)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 12px',
                                background: bg, border: `2px solid ${border}`,
                                borderRadius: '10px',
                                cursor: result ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left',
                              }}
                            >
                              <span style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                background: isCorrectOpt && result ? '#22c55e' : isWrong ? '#ef4444' : theme.spine,
                                color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: 800, flexShrink: 0,
                              }}>{opt.option_letter}</span>
                              <span style={{ fontSize: '13px', color, fontWeight: 500, lineHeight: 1.3 }}>
                                {opt.option_text}
                              </span>
                              {isCorrectOpt && result && (
                                <span style={{ marginLeft: 'auto', color: '#22c55e', fontWeight: 700 }}>✓</span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {result?.explanation && (
                        <div style={{
                          marginTop: '12px', padding: '10px 14px',
                          background: '#fffbeb', border: '1px solid #fde68a',
                          borderRadius: '8px',
                        }}>
                          <p style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                            💡 {result.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Alt navigasyon */}
          <div style={{
            padding: '12px 20px',
            borderTop: '2px solid #e2e8f0',
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              style={{
                padding: '8px 16px', borderRadius: '10px',
                background: currentPage === 0 ? '#f1f5f9' : theme.spine,
                color: currentPage === 0 ? '#94a3b8' : '#fff',
                border: 'none', cursor: currentPage === 0 ? 'default' : 'pointer',
                fontSize: '13px', fontWeight: 700,
              }}
            >← Önceki</button>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {Array.from({ length: Math.min(totalPages, 8) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  style={{
                    width: currentPage === i ? '24px' : '8px',
                    height: '8px', borderRadius: '4px',
                    background: currentPage === i ? theme.spine : '#cbd5e1',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              style={{
                padding: '8px 16px', borderRadius: '10px',
                background: currentPage >= totalPages - 1 ? '#f1f5f9' : theme.spine,
                color: currentPage >= totalPages - 1 ? '#94a3b8' : '#fff',
                border: 'none', cursor: currentPage >= totalPages - 1 ? 'default' : 'pointer',
                fontSize: '13px', fontWeight: 700,
              }}
            >Sonraki →</button>
          </div>
        </div>
      </div>
    </div>
  )
}






