"use client";

import Link from "next/link";
import { ChevronRight, PlayCircle } from "lucide-react";

export function StudentLiveHelpBanner() {
  return (
    <div className="mt-12 flex w-full flex-col gap-4 rounded-2xl border border-indigo-100/80 bg-white/90 p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-white shadow-md shadow-indigo-500/20">
          <PlayCircle className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-bold leading-snug text-[#6366F1] sm:text-[15px]">Canlı derslere nasıl katılırım?</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600 sm:text-[13px]">
            Derse katıl butonuna tıklayarak öğretmeninizin açtığı canlı derse anında katılabilirsiniz.
          </p>
        </div>
      </div>
      <Link
        href="/iletisim"
        className="inline-flex shrink-0 items-center gap-1 self-start text-[13px] font-semibold text-[#6366F1] transition hover:text-indigo-700 sm:self-center sm:text-[14px]"
      >
        Rehberi İncele
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
