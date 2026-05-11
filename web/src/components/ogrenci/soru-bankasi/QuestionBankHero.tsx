"use client";

import { Mic, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ScopeMode = "class" | "exam";

type QuestionBankHeroProps = {
  tone?: "exam" | "school";
  scopeMode: ScopeMode;
  onScopeModeChange: (mode: ScopeMode) => void;
  examTabs: string[];
  activeExamTab: string;
  onExamTabChange: (tab: string) => void;
  onOpenVoice: () => void;
  onOpenPersonalTest: () => void;
};

export function QuestionBankHero({
  tone = "exam",
  scopeMode,
  onScopeModeChange,
  examTabs,
  activeExamTab,
  onExamTabChange,
  onOpenVoice,
  onOpenPersonalTest,
}: QuestionBankHeroProps) {
  const school = tone === "school";
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.12)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_-20%,rgba(139,92,246,0.14),transparent_55%),radial-gradient(90%_60%_at_0%_100%,rgba(59,130,246,0.08),transparent_50%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-200/30 via-fuchsia-100/20 to-transparent blur-3xl" aria-hidden />

      <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200/90 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 backdrop-blur-sm">
                Soru bankası
              </span>
              <div
                role="group"
                aria-label="Kapsam"
                className="inline-flex rounded-full border border-slate-200/90 bg-white/70 p-0.5 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => onScopeModeChange("class")}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    scopeMode === "class" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Müfredat
                </button>
                <button
                  type="button"
                  onClick={() => onScopeModeChange("exam")}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    scopeMode === "exam" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {school ? "Pratik" : "Sınav"}
                </button>
              </div>
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
              {school ? (
                <span className="bg-gradient-to-r from-slate-900 via-teal-800 to-slate-900 bg-clip-text text-transparent">
                  Konu kitaplığın
                </span>
              ) : (
                <span className="bg-gradient-to-r from-slate-900 via-violet-800 to-slate-900 bg-clip-text text-transparent">
                  Netini inşa et
                </span>
              )}
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">
              {school ? "Kapaktan seç — çöz, ilerle." : "Kitabı seç — akışa gir."}
            </p>

            {scopeMode === "exam" && examTabs.length > 1 && (
              <div
                role="tablist"
                aria-label={school ? "İçerik türü" : "Sınav türü"}
                className="mt-8 flex flex-wrap gap-1.5"
              >
                {examTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeExamTab === tab}
                    onClick={() => onExamTabChange(tab)}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold transition",
                      activeExamTab === tab
                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                        : "border border-slate-200/90 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    )}
                  >
                    {tab === "ORTAK" ? "Ortak" : tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
            <button
              type="button"
              onClick={onOpenPersonalTest}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 px-8 py-4 text-base font-semibold text-white shadow-[0_20px_50px_-12px_rgba(109,40,217,0.55)] transition hover:shadow-[0_24px_60px_-12px_rgba(109,40,217,0.6)] hover:brightness-[1.03] active:scale-[0.99]"
            >
              <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
              <Wand2 className="relative h-5 w-5" aria-hidden />
              <span className="relative">AI ile set</span>
              <Sparkles className="relative h-4 w-4 text-violet-100" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onOpenVoice}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-violet-200 hover:bg-white"
            >
              <Mic className="h-4 w-4 text-violet-600" aria-hidden />
              Sesli çözüm
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
