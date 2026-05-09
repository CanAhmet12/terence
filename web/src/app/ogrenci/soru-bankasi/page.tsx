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
  const [timedRemaining, setTimedRemaining] = useState<number | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [answerResults, setAnswerResults] = useState<Record<number, AnswerResult & { selected: string; solution_video?: string }>>({});
  const [loadingSimilar, setLoadingSimilar] = useState<number | null>(null);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimes = useRef<Record<number, number>>({});
  const [showVoice, setShowVoice] = useState(false);
  const [showPersonalTest, setShowPersonalTest] = useState(false);
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

  const timerActive = timedRemaining != null && timedRemaining > 0;
  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => {
      setTimedRemaining((r) => (r == null || r <= 1 ? null : r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive]);

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
        setBookModalSubject(rows[0].subject ?? first.subject ?? "Matematik");
        setBookModalTitle(first.konu ?? "Kazanım seti");
      }
    } catch {
      /* ignore */
    }
  }, [loadQuestions, effectiveExamTab]);

  const onTimedPractice = useCallback(() => {
    setTimedRemaining(300);
    void loadQuestions({
      page: 1,
      perPage: 15,
      q: qParam,
      kazanimCode: kazanimFromUrl || undefined,
      difficulty: undefined,
      subject: subject || undefined,
      examType: effectiveExamTab,
    });
  }, [loadQuestions, qParam, kazanimFromUrl, subject, effectiveExamTab]);

  const openBookForSubject = useCallback(
    (subjectName: string) => {
      setSubject(subjectName);
      setBookModalTitle(subjectName);
      setBookModalSubject(subjectName);
      setSelectedAnswers({});
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

          {typeof timedRemaining === "number" && timedRemaining > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-center text-sm font-semibold text-cyan-900 shadow-sm"
            >
              Süreli pratik: kalan{" "}
              <span className="tabular-nums text-base text-cyan-950">{timedRemaining}</span> sn
            </div>
          )}

          <QuestionBankKpiStrip summary={bankSummary} loading={bankSummaryLoading} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-6">
            <div className="min-w-0 space-y-4">
              <SubjectBankCarousel
                subjects={bankSummary?.subjects ?? []}
                onSelectSubject={openBookForSubject}
              />
              <QuestionBankQuickActions
                onQuick10={onQuick10}
                onWeakFocus={onWeakFocus}
                onTimedPractice={onTimedPractice}
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
            setSelectedAnswers({});
            setAnswerResults({});
          }}
        />
      )}

      {bookModalSubject && (
        <BookQuestionsModal
          subject={bookModalSubject}
          title={bookModalTitle}
          questions={questions}
          loading={loading}
          answerResults={answerResults}
          selectedAnswers={selectedAnswers}
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

function diffLabel(d?: string): string {
  if (d === "easy") return "Kolay";
  if (d === "hard") return "Zor";
  if (d === "medium") return "Orta";
  return d ?? "—";
}

function BookQuestionsModal({
  subject,
  title,
  questions,
  loading,
  answerResults,
  selectedAnswers: _selectedAnswers,
  answeringId,
  loadingSimilar,
  onAnswer,
  onSimilar,
  onClose,
}: {
  subject: string;
  title: string;
  questions: Question[];
  loading: boolean;
  answerResults: Record<number, AnswerResult & { selected: string; solution_video?: string }>;
  selectedAnswers: Record<number, string>;
  answeringId: number | null;
  loadingSimilar?: number | null;
  onAnswer: (q: Question, opt: string) => void;
  onSimilar?: (questionId: number) => void;
  onClose: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 2;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const pageQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );
  const answeredCount = Object.keys(answerResults).length;

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
        aria-labelledby="book-modal-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
      >
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">{subject}</p>
            <h2 id="book-modal-title" className="mt-1 text-2xl font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Çözülen:{" "}
              <span className="font-semibold text-slate-900">
                {answeredCount} / {questions.length || "—"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kapat
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" aria-hidden />
              <p className="text-sm text-slate-500">Sorular yükleniyor…</p>
            </div>
          ) : questions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-500">
              Bu derse ait soru bulunamadı.
            </p>
          ) : (
            <>
              <div className="space-y-6">
                {pageQuestions.map((soru, idx) => {
                  const result = answerResults[soru.id];
                  const qNum = currentPage * questionsPerPage + idx + 1;
                  return (
                    <article
                      key={soru.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">
                          Soru {qNum}
                        </span>
                        {soru.kazanim_code && (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-600">
                            {soru.kazanim_code}
                          </span>
                        )}
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-500">
                          {diffLabel(soru.difficulty)}
                        </span>
                      </div>
                      <p className="mt-4 text-base leading-relaxed text-slate-900">{soru.question_text}</p>
                      <ul className="mt-4 space-y-2">
                        {soru.options?.map((opt) => (
                          <li key={opt.id}>
                            <button
                              type="button"
                              disabled={!!result || answeringId === soru.id}
                              onClick={() => onAnswer(soru, opt.option_letter)}
                              className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-violet-300 hover:bg-violet-50 disabled:pointer-events-none disabled:opacity-60"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 font-bold text-violet-800">
                                {opt.option_letter}
                              </span>
                              <span className="text-slate-800">{opt.option_text}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      {result && (
                        <div
                          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                            result.is_correct
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-rose-200 bg-rose-50 text-rose-900"
                          }`}
                        >
                          <span className="font-semibold">{result.is_correct ? "Doğru" : "Yanlış"}</span>
                          {result.explanation && <span className="mt-1 block text-slate-700">{result.explanation}</span>}
                        </div>
                      )}
                      {result?.solution_video && (
                        <p className="mt-3">
                          <a
                            href={result.solution_video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-violet-700 underline-offset-4 hover:text-violet-900 hover:underline"
                          >
                            Video çözüm
                          </a>
                        </p>
                      )}
                      {result && onSimilar && (
                        <div className="mt-4">
                          <button
                            type="button"
                            disabled={loadingSimilar === soru.id}
                            onClick={() => onSimilar(soru.id)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {loadingSimilar === soru.id ? "Yükleniyor…" : "Benzer sorular"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 disabled:opacity-30"
                >
                  Önceki
                </button>
                <p className="text-sm text-slate-500">
                  Sayfa{" "}
                  <span className="font-semibold text-slate-900">
                    {currentPage + 1} / {Math.max(totalPages, 1)}
                  </span>
                </p>
                <button
                  type="button"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 disabled:opacity-30"
                >
                  Sonraki
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

