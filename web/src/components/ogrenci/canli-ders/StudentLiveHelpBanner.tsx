"use client";

import Link from "next/link";
import { ChevronRight, PlayCircle } from "lucide-react";

export function StudentLiveHelpBanner() {
  return (
    <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/90 px-5 py-5 shadow-[0_10px_15px_-3px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-5">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#6366F1] shadow-sm ring-1 ring-indigo-100">
          <PlayCircle className="h-6 w-6" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-slate-900">Canlı derslere nasıl katılırım?</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
            Derse katıl butonuna tıklayarak öğretmeninizin açtığı canlı derse anında katılabilirsiniz.
          </p>
        </div>
      </div>
      <Link
        href="/iletisim"
        className="inline-flex shrink-0 items-center gap-1 text-[14px] font-bold text-[#6366F1] hover:text-indigo-700 sm:pr-1"
      >
        Rehberi İncele
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
