"use client";

import Link from "next/link";
import { ChevronRight, Library } from "lucide-react";
import type { QuestionBankSubjectSummary } from "@/lib/api";
import { SubjectBook3D } from "./SubjectBook3D";
import { cn } from "@/lib/utils";

function formatInt(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

export function SubjectBankCarousel({ subjects }: { subjects: QuestionBankSubjectSummary[] }) {
  const firstHref = subjects[0]?.cta_deep_link ?? "/ogrenci/soru-bankasi";

  if (!subjects.length) {
    return (
      <section
        aria-labelledby="qb-subjects-heading"
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-100 blur-3xl" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 shadow-inner">
              <Library className="h-7 w-7 text-violet-600" aria-hidden />
            </span>
            <div>
              <h2 id="qb-subjects-heading" className="text-lg font-semibold tracking-tight text-slate-900">
                Ders kitaplığı
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                Bu kapsamda henüz ders bazlı özet yok. Müfredatını güncellediğinde her ders için 3 boyutlu kitap
                kartları burada sıralanır.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="qb-subjects-heading" className="relative">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-violet-700">
            <Library className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Kütüphane</span>
          </div>
          <h2 id="qb-subjects-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Derslere göre soru bankaları
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Her kapak müfredatına göre; üzerine gelince kitap raflarından alınmış gibi hafifçe döner.
          </p>
        </div>
        <Link
          href={firstHref}
          className={cn(
            "inline-flex items-center gap-2 self-start rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
          )}
        >
          Tüm içeriği gör
          <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
        </Link>
      </div>

      <div className="relative rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-sm sm:p-7">
        <div
          className="pointer-events-none absolute inset-x-8 bottom-7 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-10 bottom-5 h-6 rounded-[100%] bg-slate-300/30 blur-xl"
          aria-hidden
        />

        <div className="relative flex gap-6 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin] [scrollbar-color:rgba(139,92,246,0.35)_transparent]">
          {subjects.map((row) => {
            const pct =
              row.correct_rate != null && row.correct_rate >= 0 ? Math.round(row.correct_rate) : null;
            const meta =
              pct != null
                ? `${formatInt(row.total)} soru · doğruluk %${pct}`
                : `${formatInt(row.total)} soru`;

            return (
              <SubjectBook3D key={row.subject} subject={row.subject} meta={meta} href={row.cta_deep_link} />
            );
          })}
        </div>
      </div>
    </section>
  );
}
