"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { QuestionBankSubjectSummary } from "@/lib/api";

export function SubjectBankCarousel({ subjects }: { subjects: QuestionBankSubjectSummary[] }) {
  if (!subjects.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
        Bu kapsamda henüz ders bazlı soru özeti yok. Müfredatını güncellediğinde kartlar burada görünür.
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Dersler</h2>
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {subjects.map((s) => (
          <Link
            key={s.subject}
            href={s.cta_deep_link}
            className="min-w-[220px] max-w-[260px] shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">{s.subject}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {s.total} soru · {s.answered} çözülmüş
                  {s.correct_rate != null ? ` · %${s.correct_rate} doğruluk` : ""}
                </p>
              </div>
              <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" aria-hidden />
            </div>
            <span className="mt-3 inline-block text-xs font-semibold text-teal-700">Derse git</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
