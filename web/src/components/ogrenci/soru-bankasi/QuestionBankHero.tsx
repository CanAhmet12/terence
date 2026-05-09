"use client";

import { Mic, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <section className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-gradient-to-br from-violet-950/90 via-[#12081f] to-slate-950 p-6 shadow-[0_28px_100px_rgba(76,29,149,0.35)] sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-500/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            Öğrenci · Soru Bankası
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Sorularla{" "}
            <span className="bg-gradient-to-r from-violet-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
              netini inşa et
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Sınıfına ve sınav hedefine göre filtrelenmiş binlerce soru; zayıf kazanımlarına özel setler ve sesli çözüm
            asistanı tek ekranda.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Kapsam"
              className="inline-flex rounded-2xl border border-white/10 bg-black/30 p-1 shadow-inner backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => onScopeModeChange("class")}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  scopeMode === "class"
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Sınıf müfredatı
              </button>
              <button
                type="button"
                onClick={() => onScopeModeChange("exam")}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  scopeMode === "exam"
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Sınav odaklı
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenVoice}
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-400/35 bg-violet-600/25 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:border-violet-300/60 hover:bg-violet-500/35"
            >
              <Mic className="h-4 w-4" aria-hidden />
              Sesli çözüm
            </button>
          </div>

          {scopeMode === "exam" && examTabs.length > 1 && (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sınav türü</p>
              <div role="tablist" aria-label="Sınav türü seçimi" className="mt-3 flex flex-wrap gap-2">
                {examTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeExamTab === tab}
                    onClick={() => onExamTabChange(tab)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      activeExamTab === tab
                        ? "border-violet-400/60 bg-violet-500/25 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {tab === "ORTAK" ? "Ortak" : tab}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg">
                <Wand2 className="h-5 w-5 text-white" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Bana özel test</h2>
                <p className="text-sm text-slate-400">Seviyene uygun AI destekli set</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Zayıf kazanımlarından başlayarak soru seçilir; süreyi ve zorluğu sen belirlersin.
            </p>
            <button
              type="button"
              onClick={onOpenPersonalTest}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-slate-900 shadow-xl transition hover:bg-violet-100"
            >
              Test oluştur
              <Sparkles className="h-4 w-4 text-violet-600" aria-hidden />
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
