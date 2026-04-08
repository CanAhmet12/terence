"use client";

import dynamic from "next/dynamic";

const Library3D = dynamic(() => import("@/components/Library3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl flex items-center justify-center" style={{ minHeight: '380px', background: 'linear-gradient(160deg, #0f172a, #1e293b)' }}>
      <div className="text-center text-white">
        <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-400">Kütüphane yükleniyor...</p>
      </div>
    </div>
  ),
});
      <div className="text-center text-white">
        <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-300">3D Kütüphane yükleniyor...</p>
      </div>
    </div>
  ),
});

const DIFFICULTY_CONFIG = {
  easy: { label: "Kolay", cls: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Orta", cls: "bg-amber-100 text-amber-700" },
  hard: { label: "Zor", cls: "bg-red-100 text-red-700" },
};
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Question, AnswerResult } from "@/lib/api";
import { Search, RefreshCw, CheckCircle, XCircle, ChevronRight, BookOpen, Loader2, Mic, MicOff, Volume2, Sparkles, X, Bot, AlertCircle, Library, List } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"library" | "list">("library");
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

  const handleLibraryBookClick = (bookId: number) => {
    const book = libraryBooks.find((b) => b.id === bookId);
    if (!book) return;
    setSelectedLibrarySubject(book.subject);
    setSubject(book.subject);
    setViewMode("list");
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Soru Bankası</h1>
          <p className="text-slate-600 mt-1">Zorluk & kazanım filtresi · Anında doğrulama · Benzer soru getir</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Görünüm toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("library")}
              title="3D Kütüphane"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "library"
                  ? "bg-white shadow-sm text-teal-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Library className="w-4 h-4" />
              <span className="hidden sm:inline">Kütüphane</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Liste Görünümü"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-white shadow-sm text-teal-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>
          <button
            onClick={() => setShowVoice(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-sm rounded-xl transition-colors"
            title="Sesli soru çöz"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Sesli Çöz</span>
          </button>
          <button
            onClick={() => setShowPersonalTest(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-purple-500/20"
            title="Zayıf konularından kişisel test oluştur"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Bana Özel Test</span>
          </button>
        </div>
      </div>

      {/* ─── 3D KÜTÜPHANE GÖRÜNÜMÜ ──────────────────────────────────────── */}
      {viewMode === "library" && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Ders Kütüphanesi</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Bir derse tıkla — o dersin sorularına geç. Fareyle döndür, kaydır zoom yap.
              </p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
            <Library3D
              books={libraryBooks}
              onBookClick={handleLibraryBookClick}
            />
          </div>
          {/* Özet istatistikler */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Toplam Ders", value: libraryBooks.length, color: "text-teal-600", bg: "bg-teal-50" },
              { label: "Çözülen Soru", value: answeredCount, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Doğru Cevap", value: correctCount, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Başarı Oranı", value: answeredCount > 0 ? `%${Math.round((correctCount/answeredCount)*100)}` : "—", color: "text-purple-600", bg: "bg-purple-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 border border-white shadow-sm`}>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* İstatistik bandı */}
      {answeredCount > 0 && viewMode === "list" && (
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

      {/* Filtreler ve Soru Listesi — sadece liste modunda */}
      {viewMode === "list" && (<>
      {/* Seçili ders etiketi */}
      {selectedLibrarySubject && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-500">Filtre:</span>
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: SUBJECT_COLORS[selectedLibrarySubject] ?? SUBJECT_COLORS.default }}
          >
            {selectedLibrarySubject}
            <button
              onClick={() => { setSelectedLibrarySubject(null); setSubject(""); }}
              className="ml-1 hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}
      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Konu ara (örn: Üslü Sayılar, Olasılık, Hücre...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
          />
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
        >
          {SUBJECT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
        >
          <option value="">Tüm Zorluklar</option>
          <option value="easy">Kolay</option>
          <option value="medium">Orta</option>
          <option value="hard">Zor</option>
        </select>
        {(search || subject || difficulty) && (
          <button
            onClick={() => { setSearch(""); setSubject(""); setDifficulty(""); }}
            className="px-4 py-3 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Temizle
          </button>
        )}
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
                      disabled={!!loadingSimilar}
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

      {!loading && hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              loadQuestions(search, difficulty, subject, nextPage);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
          >
            <ChevronRight className="w-5 h-5 text-teal-600" />
            Sonraki 20 Soru
          </button>
        </div>
      )}
      {!loading && !hasMore && questions.length > 0 && (
        <p className="mt-8 text-center text-sm text-slate-400">Tüm sorular gösterildi.</p>
      )}

      <p className="mt-6 text-sm text-slate-500">
        Yanlış yaptığın sorular kazanım bazlı analiz edilir ve günlük planına otomatik eklenir.
      </p>
      </>)}

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






