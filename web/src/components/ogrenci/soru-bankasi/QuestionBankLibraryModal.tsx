"use client";

import { BookOpen, X } from "lucide-react";
import type { QuestionBankSubjectSummary } from "@/lib/api";
import { SubjectBook3D } from "./SubjectBook3D";

function formatInt(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

export function QuestionBankLibraryModal({
  open,
  onClose,
  subjects,
  onSelectSubject,
}: {
  open: boolean;
  onClose: () => void;
  subjects: QuestionBankSubjectSummary[];
  onSelectSubject: (subject: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[105] flex flex-col items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        aria-label="Kapat"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-modal-title"
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/30 text-violet-200">
              <BookOpen className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 id="library-modal-title" className="text-xl font-bold text-white sm:text-2xl">
                Kütüphane
              </h2>
              <p className="text-sm text-slate-400">Bir ders seç — soru bankası kitabını tam ekranda aç</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-12 pb-4">
            {subjects.map((row) => {
              const pct =
                row.correct_rate != null && row.correct_rate >= 0 ? Math.round(row.correct_rate) : null;
              const meta =
                pct != null
                  ? `${formatInt(row.total)} soru · %${pct}`
                  : `${formatInt(row.total)} soru`;

              return (
                <div key={row.subject} className="origin-bottom scale-[1.06] transition hover:scale-[1.09]">
                  <SubjectBook3D
                    subject={row.subject}
                    meta={meta}
                    href={row.cta_deep_link}
                    onActivate={() => onSelectSubject(row.subject)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
