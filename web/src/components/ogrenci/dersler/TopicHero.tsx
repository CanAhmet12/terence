"use client";

import { ChevronLeft, LayoutGrid, BookOpen, GraduationCap } from "lucide-react";

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
  const gradeExam =
    gradeLabel && examLabel
      ? `${gradeLabel} - ${examLabel}`
      : gradeLabel || examLabel || "";

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-violet-950/10">
      <div
        className="relative px-5 pb-16 pt-5 text-white md:px-8 md:pb-20 md:pt-7"
        style={{
          background: `linear-gradient(125deg, #0c1a3a 0%, #152a5c 28%, #1e1b4b 52%, ${accentColor} 88%, #312e81 100%)`,
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/[0.08] blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-sky-400/10 blur-2xl" aria-hidden />

        <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/25"
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
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/25"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Derse Genel Bakış
            </button>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:gap-8 md:text-left">
          <div
            className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-2xl font-bold shadow-inner backdrop-blur-sm md:h-24 md:w-24 md:text-3xl"
            aria-hidden
          >
            <span className="select-none font-serif tracking-tight">
              ƒ(x)<sup className="align-super text-base font-semibold opacity-90 md:text-lg">x</sup>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            {unitTitle ? (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-100/90">{unitTitle}</p>
            ) : null}
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl lg:text-[2rem] lg:leading-tight">{topicTitle}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/95 md:justify-start">
              {subjectName ? (
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 shrink-0 text-indigo-100" aria-hidden />
                  {subjectName}
                </span>
              ) : null}
              {gradeExam ? (
                <span className="inline-flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 shrink-0 text-indigo-100" aria-hidden />
                  {gradeExam}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
