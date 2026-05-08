"use client";

import { Mic, Sparkles } from "lucide-react";

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
    <section className="rounded-3xl border border-teal-200/60 bg-gradient-to-br from-teal-50 via-white to-slate-50 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Soru Bankası</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Kütüphaneden ders seç veya aşağıdaki KPI ve çalışma modlarıyla odaklan.{" "}
            <span className="font-medium text-slate-800">Sınıf</span> görünümü tüm izinli sınav türlerini kapsar;{" "}
            <span className="font-medium text-slate-800">Sınav</span> görünümünde sekme ile daraltırsın.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Odak</span>
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => onScopeModeChange("class")}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  scopeMode === "class" ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Sınıf
              </button>
              <button
                type="button"
                onClick={() => onScopeModeChange("exam")}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  scopeMode === "exam" ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Sınav
              </button>
            </div>
          </div>

          {scopeMode === "exam" && examTabs.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Sınav türü">
              {examTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeExamTab === tab}
                  onClick={() => onExamTabChange(tab)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeExamTab === tab
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {tab === "ORTAK" ? "Ortak" : tab}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenVoice}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-100"
          >
            <Mic className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Sesli çöz</span>
            <span className="sm:hidden">Ses</span>
          </button>
          <button
            type="button"
            onClick={onOpenPersonalTest}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-purple-600"
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Bana özel test</span>
            <span className="sm:hidden">Test</span>
          </button>
        </div>
      </div>
    </section>
  );
}
