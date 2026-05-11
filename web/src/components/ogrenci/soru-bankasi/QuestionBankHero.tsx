"use client";

import { Mic, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ScopeMode = "class" | "exam";

type QuestionBankHeroProps = {
  /** Okul odaklı öğrencilerde sınav/net dili yerine gelişim tonu */
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
    <section className="relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_8px_40px_rgba(99,102,241,0.08)] sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-fuchsia-200/35 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%236366f1\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:gap-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            Öğrenci · Soru Bankası
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            {school ? (
              <>
                Sınıfına uygun sorularla{" "}
                <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  güçlen
                </span>
              </>
            ) : (
              <>
                Sorularla{" "}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
                  netini inşa et
                </span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {school
              ? "Okul müfredatına uygun sorular; konu pekiştirme, zayıf alanları güçlendirme ve sesli çözüm asistanı aynı ekranda."
              : "Sınıfına ve sınav hedefine göre filtrelenmiş binlerce soru; zayıf kazanımlarına özel setler ve sesli çözüm asistanı tek ekranda."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Kapsam"
              className="inline-flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1 shadow-inner"
            >
              <button
                type="button"
                onClick={() => onScopeModeChange("class")}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  scopeMode === "class"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:text-slate-900"
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
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {school ? "Sınav pratiği" : "Sınav odaklı"}
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenVoice}
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:border-violet-300 hover:bg-violet-100"
            >
              <Mic className="h-4 w-4" aria-hidden />
              Sesli çözüm
            </button>
          </div>

          {scopeMode === "exam" && examTabs.length > 1 && (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {school ? "İçerik türü" : "Sınav türü"}
              </p>
              <div
                role="tablist"
                aria-label={school ? "İçerik türü seçimi" : "Sınav türü seçimi"}
                className="mt-3 flex flex-wrap gap-2"
              >
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
                        ? "border-violet-400 bg-violet-100 text-violet-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-slate-900"
                    )}
                  >
                    {tab === "ORTAK" ? "Ortak" : tab}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="relative rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-violet-100/80" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-md">
                <Wand2 className="h-5 w-5 text-white" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bana özel test</h2>
                <p className="text-sm text-slate-600">Seviyene uygun AI destekli set</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Zayıf kazanımlarından başlayarak soru seçilir; süreyi ve zorluğu sen belirlersin.
            </p>
            <button
              type="button"
              onClick={onOpenPersonalTest}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-violet-700"
            >
              Test oluştur
              <Sparkles className="h-4 w-4 text-violet-100" aria-hidden />
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
