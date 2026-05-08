"use client";

import Image from "next/image";
import { GraduationCap, Mic, Target } from "lucide-react";

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

/** Şeffaf arka planlı 3D sahne — çerçeve yok, doğrudan beyaz üzerinde */
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
    <section className="sb-hero sb-hero--mockup-top">
      <div className="sb-hero-top-grid">
        {/* Sol: başlık + segment (ikonlu) + sesli */}
        <div className="sb-hero-left min-w-0">
          <h1 className="sb-hero-title text-slate-900">Soru Bankası</h1>
          <p className="sb-hero-lead mt-1.5">
            Sınıfına ve hedeflerine uygun soruları çöz, eksiklerini tamamla!
          </p>

          <div
            className="inline-flex rounded-xl bg-slate-100/95 p-1 ring-1 ring-slate-200/80"
            role="group"
            aria-label="Kapsam"
          >
            <button
              type="button"
              onClick={() => onScopeModeChange("class")}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12px] font-bold transition-all ${
                scopeMode === "class"
                  ? "bg-[#6d28d9] text-white shadow-[0_4px_14px_rgba(109,40,217,0.35)]"
                  : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              Sınıf
            </button>
            <button
              type="button"
              onClick={() => onScopeModeChange("exam")}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12px] font-bold transition-all ${
                scopeMode === "exam"
                  ? "bg-[#6d28d9] text-white shadow-[0_4px_14px_rgba(109,40,217,0.35)]"
                  : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              }`}
            >
              <Target className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              Sınav
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenVoice}
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 underline-offset-2 hover:underline"
            aria-label="Sesli çözüm"
          >
            <Mic className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Sesli çöz
          </button>

          {scopeMode === "exam" && examTabs.length > 1 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Sınav türü
              </p>
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

        {/* Orta: PNG doğrudan beyaz zemin — kutu/çerçeve yok */}
        <div className="sb-hero-art relative flex min-h-[120px] items-center justify-center lg:min-h-[140px]">
          <Image
            src={HERO_SCENE_SRC}
            alt=""
            width={640}
            height={520}
            priority
            sizes="(max-width: 1024px) 72vw, 280px"
            className="max-h-[min(200px,26vh)] w-auto max-w-full object-contain"
          />
        </div>

        {/* Sağ: mor CTA (mockup) */}
        <div className="sb-hero-cta-wrap min-w-0">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] p-6 text-white shadow-[0_16px_40px_rgba(91,33,182,0.28)]">
            <div className="relative z-[1] flex gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-bold leading-tight tracking-tight">Bana Özel Test</h2>
                <p className="mt-2 text-[11px] leading-snug text-white/90">
                  Kendi seviyene uygun özel test oluştur ve hemen çözmeye başla!
                </p>
                <button
                  type="button"
                  onClick={onOpenPersonalTest}
                  className="mt-4 w-full rounded-xl bg-white py-2.5 text-[12px] font-bold text-violet-700 shadow-md transition-colors hover:bg-violet-50 sm:w-auto sm:px-6"
                >
                  Test Oluştur
                </button>
              </div>
              <div
                className="relative hidden h-[88px] w-[88px] shrink-0 sm:flex sm:items-center sm:justify-center"
                aria-hidden
              >
                <div className="absolute inset-0 rounded-full bg-white/10 blur-xl" />
                <Target className="relative h-14 w-14 text-white/95 drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
