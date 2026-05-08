"use client";

import Image from "next/image";
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

/** Sağdaki 3D sahne: `1icon.png` (kitaplar + kep + mor soru kitabı — mockup ile aynı kaynak görsel) */
const HERO_SCENE_SRC = "/images/soru-bankasi/1icon.png";

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
        <h1 className="sb-hero-title text-slate-900">Soru Bankası</h1>
        <p className="sb-hero-lead mt-1">Sınıfına ve hedeflerine uygun soruları çöz, eksiklerini tamamla!</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-indigo-100 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => onScopeModeChange("class")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
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
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
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
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-indigo-800 shadow-sm transition-colors hover:bg-indigo-50"
            aria-label="Sesli çözüm"
          >
            <Mic className="h-3 w-3 shrink-0" aria-hidden />
            Sesli çöz
          </button>
          <button
            type="button"
            onClick={onOpenPersonalTest}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700"
          >
            <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
            Bana özel test
          </button>
        </div>

        {scopeMode === "exam" && examTabs.length > 1 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sınav türü</p>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Sınav türü">
              {examTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeExamTab === tab}
                  onClick={() => onExamTabChange(tab)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
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

      <div className="sb-hero-visual qb-hero-scene-wrap relative flex min-h-0 flex-col items-center justify-center overflow-visible py-1">
        <div
          className="relative z-[1] flex h-[clamp(100px,18vh,200px)] w-full max-w-[min(100%,320px)] items-center justify-center"
          aria-hidden
        >
          <Image
            src={HERO_SCENE_SRC}
            alt=""
            width={640}
            height={520}
            priority
            sizes="(max-width: 768px) 85vw, 320px"
            className="h-full w-full object-contain object-center drop-shadow-[0_20px_40px_rgba(91,63,212,0.25)]"
          />
        </div>
      </div>
    </section>
  );
}
