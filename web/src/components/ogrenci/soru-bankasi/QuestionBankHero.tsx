"use client";

import { BookMarked, GraduationCap, HelpCircle, Mic, Sparkles } from "lucide-react";

type ScopeMode = "class" | "exam";

type QuestionBankHeroProps = {
  scopeMode: ScopeMode;
  onScopeModeChange: (mode: ScopeMode) => void;
  examTabs: string[];
  activeExamTab: string;
  onExamTabChange: (tab: string) => void;
  onOpenVoice: () => void;
  onOpenPersonalTest: () => void;
};

export function QuestionBankHero({
  scopeMode,
  onScopeModeChange,
  examTabs,
  activeExamTab,
  onExamTabChange,
  onOpenVoice,
  onOpenPersonalTest,
}: QuestionBankHeroProps) {
  return (
    <section className="sb-hero">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.35rem]">
          Soru Bankası
        </h1>
        <p className="sb-hero-lead mt-2 max-w-xl text-[15px] leading-relaxed">
          Sınıfına ve hedeflerine uygun soruları çöz, eksiklerini tamamla!
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full border border-indigo-100 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => onScopeModeChange("class")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                scopeMode === "class"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-indigo-50"
              }`}
            >
              Sınıf
            </button>
            <button
              type="button"
              onClick={() => onScopeModeChange("exam")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                scopeMode === "exam"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-indigo-50"
              }`}
            >
              Sınav
            </button>
          </span>

          <button
            type="button"
            onClick={onOpenVoice}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-800 shadow-sm transition-colors hover:bg-indigo-50"
            aria-label="Sesli çözüm"
          >
            <Mic className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Sesli çöz
          </button>
          <button
            type="button"
            onClick={onOpenPersonalTest}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/30 transition-all hover:from-indigo-700 hover:to-violet-700"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Bana özel test
          </button>
        </div>

        {scopeMode === "exam" && examTabs.length > 1 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sınav türü</p>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sınav türü">
              {examTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeExamTab === tab}
                  onClick={() => onExamTabChange(tab)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeExamTab === tab
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                  }`}
                >
                  {tab === "ORTAK" ? "Ortak" : tab}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sb-hero-visual relative flex min-h-[200px] flex-col items-center justify-center gap-4">
        <div className="relative z-[1] flex items-end justify-center gap-4">
          <div className="flex h-24 w-20 flex-col items-center justify-end rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 shadow-lg shadow-blue-900/20">
            <BookMarked className="mb-3 h-10 w-10 text-white/95" aria-hidden />
          </div>
          <div className="flex h-28 w-24 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-indigo-500 to-violet-700 shadow-xl shadow-indigo-900/25">
            <HelpCircle className="h-14 w-14 text-white" aria-hidden />
          </div>
          <div className="flex h-24 w-20 flex-col items-center justify-start rounded-2xl bg-gradient-to-b from-amber-400 to-orange-600 pt-4 shadow-lg">
            <GraduationCap className="h-11 w-11 text-white" aria-hidden />
          </div>
        </div>
        <p className="relative z-[1] text-center text-xs font-medium text-slate-500">Binlerce soru, tek yerde</p>
      </div>
    </section>
  );
}
