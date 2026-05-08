"use client";

import { ChevronLeft, LayoutGrid } from "lucide-react";

export function TopicHero({
  topicTitle,
  unitTitle,
  subjectName,
  gradeLabel,
  examLabel,
  accentColor,
  onBack,
  onOverview,
}: {
  topicTitle: string;
  unitTitle?: string;
  subjectName?: string;
  gradeLabel?: string;
  examLabel?: string;
  accentColor: string;
  onBack?: () => void;
  onOverview?: () => void;
}) {
  const meta = [subjectName, gradeLabel, examLabel].filter(Boolean).join(" · ");

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-violet-950/10">
      <div
        className="relative px-5 pb-14 pt-5 text-white md:px-8 md:pb-16 md:pt-7"
        style={{
          background: `linear-gradient(125deg, #0f172a 0%, #1e1b4b 38%, ${accentColor} 92%, #4c1d95 100%)`,
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/[0.07] blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-fuchsia-400/10 blur-2xl" aria-hidden />

        <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Geri
            </button>
          ) : (
            <span />
          )}
          {onOverview && (
            <button
              type="button"
              onClick={onOverview}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white/95 backdrop-blur transition hover:bg-white/20"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Derse Genel Bakış
            </button>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-5 text-center md:flex-row md:items-start md:gap-8 md:text-left">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-bold shadow-inner backdrop-blur-sm md:h-24 md:w-24 md:text-3xl"
            aria-hidden
          >
            <span className="select-none font-serif tracking-tight">
              ƒ(x)<sup className="align-super text-base font-semibold opacity-90 md:text-lg">x</sup>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-200/95">{unitTitle || "Ünite"}</p>
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl lg:text-4xl">{topicTitle}</h1>
            {meta && <p className="mt-2 text-sm text-violet-100 md:text-base">{meta}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
