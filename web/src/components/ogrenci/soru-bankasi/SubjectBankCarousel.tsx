"use client";

import { ChevronRight, Library } from "lucide-react";
import type { QuestionBankSubjectSummary } from "@/lib/api";
import { SubjectBook3D } from "./SubjectBook3D";
import { cn } from "@/lib/utils";

function formatInt(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

export function SubjectBankCarousel({
  subjects,
  onSelectSubject,
  onOpenLibrary,
}: {
  subjects: QuestionBankSubjectSummary[];
  onSelectSubject?: (subject: string) => void;
  /** "Tüm içeriği gör" — kütüphane modalı */
  onOpenLibrary?: () => void;
}) {
  if (!subjects.length) {
    return (
      <section
        aria-labelledby="qb-subjects-heading"
        className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white px-8 py-14 shadow-sm"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-100/60 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 shadow-inner">
            <Library className="h-8 w-8 text-violet-500" aria-hidden />
          </span>
          <h2 id="qb-subjects-heading" className="mt-6 text-xl font-semibold tracking-tight text-slate-900">
            Kitaplık hazırlanıyor
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">Müfredatın güncellendiğinde ders kapakları burada görünür.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="qb-subjects-heading" className="relative">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="qb-subjects-heading" className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Kitaplık
          </h2>
          <p className="mt-1 text-sm text-slate-500">Bir kapak seç — çözmeye başla.</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenLibrary?.()}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-violet-200 hover:bg-slate-50"
          )}
        >
          Tümü
          <ChevronRight className="h-4 w-4 opacity-60" aria-hidden />
        </button>
      </div>

      <div className="relative rounded-[2rem] border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/50 px-6 py-8 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.2)] sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute inset-x-12 bottom-10 h-px bg-gradient-to-r from-transparent via-slate-200/90 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-16 bottom-7 h-10 rounded-[100%] bg-slate-400/[0.12] blur-2xl"
          aria-hidden
        />

        <div className="relative flex gap-8 overflow-x-auto pb-4 pt-2 [scrollbar-width:thin] [scrollbar-color:rgba(139,92,246,0.35)_transparent] sm:gap-10">
          {subjects.map((row) => {
            const pct =
              row.correct_rate != null && row.correct_rate >= 0 ? Math.round(row.correct_rate) : null;
            const meta =
              pct != null ? `${formatInt(row.total)} soru · %${pct}` : `${formatInt(row.total)} soru`;

            return (
              <SubjectBook3D
                key={row.subject}
                subject={row.subject}
                meta={meta}
                href={row.cta_deep_link}
                bookDisplay={row.book_display}
                onActivate={onSelectSubject ? () => onSelectSubject(row.subject) : undefined}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
