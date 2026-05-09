"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  api,
  Question,
  AnswerResult,
  type QuestionBankSummary,
  type ExamSession,
  type WeakAchievement,
  type BadgeData,
  type PlanStats,
} from "@/lib/api";
import { QuestionBankHero } from "@/components/ogrenci/soru-bankasi/QuestionBankHero";
import { QuestionBankKpiStrip } from "@/components/ogrenci/soru-bankasi/QuestionBankKpiStrip";
import { SubjectBankCarousel } from "@/components/ogrenci/soru-bankasi/SubjectBankCarousel";
import { QuestionBankSidebar } from "@/components/ogrenci/soru-bankasi/QuestionBankSidebar";
import { QuestionBankInsightsRow } from "@/components/ogrenci/soru-bankasi/QuestionBankInsightsRow";
import { QuestionBankQuickActions } from "@/components/ogrenci/soru-bankasi/QuestionBankQuickActions";
import { QuestionBankLibraryModal } from "@/components/ogrenci/soru-bankasi/QuestionBankLibraryModal";
import { BookQuestionsPaperModal } from "@/components/ogrenci/soru-bankasi/BookQuestionsPaperModal";
import { StudyMotivationBanner } from "@/components/ogrenci/soru-bankasi/StudyMotivationBanner";
import { Loader2, Mic, MicOff, Volume2, AlertCircle } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-assistant-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="voice-assistant-title" className="text-xl font-bold text-slate-900">
              Sesli soru asistanı
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Soruyu sesli oku; yapay zeka kısaca açıklasın.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>

        {!supported && (
          <p className="mt-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> Bu tarayıcı ses tanımayı desteklemiyor.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={!supported}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500 disabled:opacity-40"
          >
            {isListening ? (
              <>
                <MicOff aria-hidden /> Durdur
              </>
            ) : (
              <>
                <Mic aria-hidden /> Dinle
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {isListening ? "Dinleniyor…" : "Soruyu sesli okumak için Dinle’ye bas."}
        </p>

        {transcript && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duyulan soru</p>
            <p className="mt-2 text-slate-900">{transcript}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={askAI}
                disabled={loading}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin" aria-hidden /> Yanıt alınıyor…
                  </>
                ) : (
                  "Yapay zekadan cevap al"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTranscript("");
                  setAiAnswer(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Temizle
              </button>
            </div>
          </div>
        )}

        {aiAnswer && (
          <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">AI cevabı</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {speaking ? (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <MicOff aria-hidden /> Okumayı durdur
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if ("speechSynthesis" in window) {
                      const u = new SpeechSynthesisUtterance(aiAnswer);
                      u.lang = "tr-TR";
                      u.onstart = () => setSpeaking(true);
                      u.onend = () => setSpeaking(false);
                      window.speechSynthesis.speak(u);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  <Volume2 aria-hidden /> Sesli oku
                </button>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-800">{aiAnswer}</p>
          </div>
        )}

        {error && (
          <p className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle aria-hidden /> {error}
          </p>
        )}
      </div>
    </div>
  );
}

const DEFAULT_SUBJECT_OPTIONS = [
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

export default function SoruBankasiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-slate-50">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" aria-hidden />
        </div>
      }
    >
      <SoruBankasiPageWithSearchParams />
    </Suspense>
  );
}

function SoruBankasiPageWithSearchParams() {
  const searchParams = useSearchParams();
  return (
    <SoruBankasiPageInner
      kazanimFromUrl={searchParams.get("kazanim_code") ?? ""}
      topicFromUrl={searchParams.get("topic") ?? ""}
    />
  );
}

function SoruBankasiPageInner({
  kazanimFromUrl,
  topicFromUrl,
}: {
  kazanimFromUrl: string;
  topicFromUrl: string;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const urlSeedDone = useRef(false);

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [subjectsByExamType, setSubjectsByExamType] = useState<Record<string, string[]>>({});
  const [examTabs, setExamTabs] = useState<string[]>(["ALL"]);
  const [activeExamTab, setActiveExamTab] = useState<string>("ALL");
  const [scopeMode, setScopeMode] = useState<"class" | "exam">("class");
  const effectiveExamTab = scopeMode === "class" ? "ALL" : activeExamTab;

  const [bankSummary, setBankSummary] = useState<QuestionBankSummary | null>(null);
  const [bankSummaryLoading, setBankSummaryLoading] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [weakPreview, setWeakPreview] = useState<WeakAchievement[]>([]);
  const [examHistory, setExamHistory] = useState<ExamSession[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats | null>(null);
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [goalHint, setGoalHint] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [answerResults, setAnswerResults] = useState<Record<number, AnswerResult & { selected: string; solution_video?: string }>>({});
  const [loadingSimilar, setLoadingSimilar] = useState<number | null>(null);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimes = useRef<Record<number, number>>({});
  const [showVoice, setShowVoice] = useState(false);
  const [showPersonalTest, setShowPersonalTest] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [bookModalSubject, setBookModalSubject] = useState<string | null>(null);
  const [bookModalTitle, setBookModalTitle] = useState<string>("");

  type LoadQOpts = {
    page?: number;
    q?: string;
    kazanimCode?: string;
    difficulty?: string;
    subject?: string;
    examType?: string;
    perPage?: number;
  };

  const loadQuestions = useCallback(
    async ({
      page = 1,
      q,
      kazanimCode,
      difficulty: diff,
      subject: subj,
      examType,
      perPage = 20,
    }: LoadQOpts): Promise<Question[]> => {
      if (!token) {
        setLoading(false);
        return [];
      }
      setLoading(true);
      let resData: Question[] = [];
      try {
        const params: Record<string, string | number> = { per_page: perPage, page };
        const qt = (q ?? "").trim();
        if (qt) params.q = qt;
        const kz = (kazanimCode ?? "").trim();
        if (kz) params.kazanim_code = kz;
        if (diff) params.difficulty = diff;
        if (subj) params.subject = subj;
        if (examType && examType !== "ALL" && examType !== "ORTAK") params.exam_type = examType;
        const res = await api.getQuestions(params);
        resData = Array.isArray(res.data) ? res.data : [];
        if (page === 1) {
          setQuestions(resData);
        } else {
          setQuestions((prev) => [...prev, ...resData]);
        }
        const now = Date.now();
        resData.forEach((qst: Question) => {
          questionStartTimes.current[qst.id] = now;
        });
      } catch {
        if (page === 1) setQuestions([]);
      }
      setLoading(false);
      return resData;
    },
    [token]
  );

  useEffect(() => {
    let mounted = true;
    const loadScopeSubjects = async () => {
      try {
        const curriculum = await api.getCurriculum();
        const scopeSubjects = Array.isArray(curriculum?.subjects) ? curriculum.subjects : [];
        const names = scopeSubjects.map((item) => item.name).filter(Boolean);
        const byExam: Record<string, string[]> = {};
        scopeSubjects.forEach((item) => {
          const key = item.exam_type || "ALL";
          if (!byExam[key]) byExam[key] = [];
          byExam[key].push(item.name);
        });
        Object.keys(byExam).forEach((key) => {
          byExam[key] = Array.from(new Set(byExam[key]));
        });
        const tabs = (() => {
          const keys = Object.keys(byExam);
          if (keys.includes("TYT") && keys.includes("AYT")) return ["TYT", "AYT", "ORTAK"];
          if (keys.length <= 1) return ["ALL"];
          return keys;
        })();
        if (mounted) {
          setAvailableSubjects(Array.from(new Set(names)));
          setSubjectsByExamType(byExam);
          setExamTabs(tabs);
          setActiveExamTab(tabs[0] ?? "ALL");
        }
      } catch {
        if (mounted) {
          setAvailableSubjects([]);
          setSubjectsByExamType({});
          setExamTabs(["ALL"]);
          setActiveExamTab("ALL");
        }
      }
    };
    loadScopeSubjects();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setBankSummary(null);
      setBankSummaryLoading(false);
      return;
    }
    let cancelled = false;
    setBankSummaryLoading(true);
    void api
      .getBankSummary()
      .then((s) => {
        if (!cancelled) setBankSummary(s);
      })
      .catch(() => {
        if (!cancelled) setBankSummary(null);
      })
      .finally(() => {
        if (!cancelled) setBankSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setSidebarLoading(false);
      return;
    }
    let cancelled = false;
    setSidebarLoading(true);
    void (async () => {
      try {
        const [hist, weak, stats, badges, goalRes] = await Promise.allSettled([
          api.getExamHistory().catch(() => [] as ExamSession[]),
          api.getWeakAchievements().catch(() => [] as WeakAchievement[]),
          api.getPlanStats().catch(() => null as PlanStats | null),
          api.getBadges().catch(() => null as BadgeData | null),
          api.getGoalAnalysis().catch(() => null),
        ]);
        if (cancelled) return;
        if (hist.status === "fulfilled" && Array.isArray(hist.value)) {
          setExamHistory(hist.value);
        } else {
          setExamHistory([]);
        }
        if (weak.status === "fulfilled" && Array.isArray(weak.value)) {
          setWeakPreview(weak.value);
        } else {
          setWeakPreview([]);
        }
        if (stats.status === "fulfilled" && stats.value) {
          setPlanStats(stats.value);
        } else {
          setPlanStats(null);
        }
        if (badges.status === "fulfilled" && badges.value) {
          setBadgeData(badges.value);
        } else {
          setBadgeData(null);
        }
        if (goalRes.status === "fulfilled" && goalRes.value) {
          const g = goalRes.value;
          setGoalHint(
            `Hedef net ${g.target_net}, güncel ${g.current_net}. Kalan gün: ${g.days_remaining}.`
          );
        } else {
          setGoalHint(null);
        }
      } catch {
        if (!cancelled) {
          setExamHistory([]);
          setWeakPreview([]);
          setPlanStats(null);
          setBadgeData(null);
          setGoalHint(null);
        }
      } finally {
        if (!cancelled) setSidebarLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // topic URL → `q` parametresi (header arama ile uyumlu)
  useEffect(() => {
    if (urlSeedDone.current) return;
    if (topicFromUrl && !searchParams.get("q")) {
      const p = new URLSearchParams(searchParams.toString());
      p.set("q", topicFromUrl);
      router.replace(`/ogrenci/soru-bankasi?${p.toString()}`, { scroll: false });
    }
    urlSeedDone.current = true;
  }, [topicFromUrl, searchParams, router]);

  // Debounced arama — `q` adres çubuğundan
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadQuestions({
        page: 1,
        q: qParam,
        kazanimCode: kazanimFromUrl || undefined,
        difficulty: undefined,
        subject: subject || undefined,
        examType: effectiveExamTab,
      });
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [qParam, subject, effectiveExamTab, kazanimFromUrl, loadQuestions]);

  const handleAnswer = async (question: Question, optionLetter: string) => {
    if (!token) return;
    if (answerResults[question.id] || answeringId === question.id) return;
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
      void api.getBankSummary().then(setBankSummary).catch(() => {});
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
    } catch (e) {
      console.error("getSimilarQuestions", e);
    }
    setLoadingSimilar(null);
  };

  const subjectOptions = availableSubjects.length > 0
    ? [{ value: "", label: "Tüm Dersler" }, ...(effectiveExamTab === "ALL"
      ? availableSubjects
      : effectiveExamTab === "ORTAK"
        ? Array.from(new Set([...(subjectsByExamType["Genel"] ?? []), ...(subjectsByExamType["all"] ?? []), ...(subjectsByExamType["TYT-AYT"] ?? [])]))
        : (subjectsByExamType[effectiveExamTab] ?? [])
    ).map((subjectName) => ({ value: subjectName, label: subjectName }))]
    : DEFAULT_SUBJECT_OPTIONS;

  const onQuick10 = useCallback(async () => {
    const rows = await loadQuestions({
      page: 1,
      perPage: 10,
      q: qParam,
      kazanimCode: kazanimFromUrl || undefined,
      difficulty: undefined,
      subject: subject || undefined,
      examType: effectiveExamTab,
    });
    if (rows.length) {
      setAnswerResults({});
      setBookModalSubject(rows[0].subject ?? "Matematik");
      setBookModalTitle("Hızlı 10");
    }
  }, [loadQuestions, qParam, kazanimFromUrl, subject, effectiveExamTab]);

  const onWeakFocus = useCallback(async () => {
    try {
      const wa = await api.getWeakAchievements();
      const first = Array.isArray(wa) ? wa[0] : undefined;
      if (!first?.kod) return;
      const rows = await loadQuestions({
        page: 1,
        kazanimCode: first.kod,
        examType: effectiveExamTab,
      });
      if (rows.length) {
        setAnswerResults({});
        setBookModalSubject(rows[0].subject ?? first.subject ?? "Matematik");
        setBookModalTitle(first.konu ?? "Kazanım seti");
      }
    } catch {
      /* ignore */
    }
  }, [loadQuestions, effectiveExamTab]);

  const openBookForSubject = useCallback(
    (subjectName: string) => {
      setSubject(subjectName);
      setBookModalTitle(subjectName);
      setBookModalSubject(subjectName);
      setAnswerResults({});
      void loadQuestions({
        page: 1,
        q: qParam,
        kazanimCode: kazanimFromUrl || undefined,
        subject: subjectName,
        examType: effectiveExamTab,
      });
    },
    [loadQuestions, qParam, kazanimFromUrl, effectiveExamTab]
  );

  return (
    <div className="relative overflow-x-hidden bg-slate-50 text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.09),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(59,130,246,0.06),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[min(100%,1680px)] px-4 pb-6 pt-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <QuestionBankHero
            scopeMode={scopeMode}
            onScopeModeChange={(m) => {
              setScopeMode(m);
              if (m === "class") {
                setActiveExamTab("ALL");
                setSubject("");
              }
            }}
            examTabs={examTabs}
            activeExamTab={activeExamTab}
            onExamTabChange={(tab) => {
              setActiveExamTab(tab);
              setSubject("");
            }}
            onOpenVoice={() => setShowVoice(true)}
            onOpenPersonalTest={() => setShowPersonalTest(true)}
          />

          <QuestionBankKpiStrip summary={bankSummary} loading={bankSummaryLoading} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-6">
            <div className="min-w-0 space-y-4">
              <SubjectBankCarousel
                subjects={bankSummary?.subjects ?? []}
                onSelectSubject={openBookForSubject}
                onOpenLibrary={() => setShowLibraryModal(true)}
              />
              <QuestionBankQuickActions
                onQuick10={onQuick10}
                onWeakFocus={onWeakFocus}
                disabled={loading || !token}
              />
            </div>

            <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
              <QuestionBankSidebar
                examHistory={examHistory}
                planStats={planStats}
                loading={sidebarLoading}
                onPersonalTest={() => setShowPersonalTest(true)}
                hidePersonalTestCard
              />
            </div>
          </div>

          <QuestionBankInsightsRow
            subjects={bankSummary?.subjects ?? []}
            weakPreview={weakPreview}
            badgeData={badgeData}
            goalHint={goalHint}
            loading={sidebarLoading}
          />

          <StudyMotivationBanner onStartQuick={onQuick10} />
        </div>
      </div>

      {showVoice && (
        <VoiceAssistantModal token={token} onClose={() => setShowVoice(false)} />
      )}

      {showPersonalTest && (
        <PersonalTestModal
          token={token}
          subjects={subjectOptions.filter((item) => item.value !== "").map((item) => item.value)}
          onClose={() => setShowPersonalTest(false)}
          onLoad={(qs) => {
            setQuestions(qs);
            setShowPersonalTest(false);
            setAnswerResults({});
          }}
        />
      )}

      <QuestionBankLibraryModal
        open={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        subjects={bankSummary?.subjects ?? []}
        onSelectSubject={(name) => {
          setShowLibraryModal(false);
          openBookForSubject(name);
        }}
      />

      {bookModalSubject && (
        <BookQuestionsPaperModal
          subject={bookModalSubject}
          title={bookModalTitle}
          questions={questions}
          loading={loading}
          answerResults={answerResults}
          answeringId={answeringId}
          loadingSimilar={loadingSimilar}
          onAnswer={handleAnswer}
          onSimilar={handleSimilar}
          onClose={() => {
            setBookModalSubject(null);
            setSubject("");
          }}
        />
      )}
    </div>
  );
}

// ─── Bana Özel Test Modal (5.4) ───────────────────────────────────────────────
function PersonalTestModal({
  token,
  subjects,
  onClose,
  onLoad,
}: {
  token: string | null;
  subjects: string[];
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Bana özel test</h3>
            <p className="mt-2 text-sm text-slate-600">AI mümkünse zayıf kazanımlarından soru seçer.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>

        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ders (opsiyonel)</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Tüm dersler</option>
              {subjects.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Soru sayısı</span>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Zorluk</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Karışık</option>
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
            </select>
          </label>
        </div>

        {error && (
          <p className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle aria-hidden /> {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-sm font-bold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Oluşturuluyor…
            </>
          ) : (
            `${count} soruluk test oluştur`
          )}
        </button>
      </div>
    </div>
  );
}
