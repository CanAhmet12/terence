"use client";

import { ChevronLeft, BookOpen } from "lucide-react";

export function TopicHero({
  topicTitle,
  unitTitle,
  subjectName,
  gradeLabel,
  examLabel,
  accentColor,
  onBack,
}: {
  topicTitle: string;
  unitTitle?: string;
  subjectName?: string;
  gradeLabel?: string;
  examLabel?: string;
  accentColor: string;
  onBack?: () => void;
}) {
  const subtitle = [subjectName, gradeLabel, examLabel].filter(Boolean).join(" · ");

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200/60 p-6 text-white shadow-lg md:p-8"
      style={{
        background: `linear-gradient(135deg, ${accentColor} 0%, #0f172a 55%, #134e4a 100%)`,
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="relative z-10 mb-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Listeye dön
        </button>
      )}
      <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {unitTitle || "Ünite"}
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{topicTitle}</h1>
          {subtitle && <p className="mt-2 text-sm text-white/80 md:text-base">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
