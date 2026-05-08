"use client";

import { useRef } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Atom,
  Box,
  ChevronLeft,
  ChevronRight,
  Feather,
  FlaskConical,
  Leaf,
  Sigma,
} from "lucide-react";
import type { QuestionBankSubjectSummary } from "@/lib/api";
import { SubjectBook3D } from "@/components/ogrenci/soru-bankasi/SubjectBook3D";

type SubjectStyle = { g1: string; g2: string; Icon: LucideIcon; accent: string };

function formatInt(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

/** Mockup: Σ Matematik, atom Fizik, flask Kimya, yaprak Biyoloji, tüy Türkçe, küp Geometri */
function resolveStyle(subject: string): SubjectStyle {
  const s = subject.trim().toLowerCase();
  if (s.includes("geometri"))
    return { g1: "#94a3b8", g2: "#475569", Icon: Box, accent: "text-slate-600" };
  if (s.includes("matematik"))
    return { g1: "#60a5fa", g2: "#1d4ed8", Icon: Sigma, accent: "text-blue-600" };
  if (s.includes("fizik"))
    return { g1: "#a78bfa", g2: "#6d28d9", Icon: Atom, accent: "text-violet-600" };
  if (s.includes("kimya"))
    return { g1: "#fb923c", g2: "#c2410c", Icon: FlaskConical, accent: "text-orange-600" };
  if (s.includes("biyoloji"))
    return { g1: "#4ade80", g2: "#15803d", Icon: Leaf, accent: "text-emerald-600" };
  if (s.includes("türkçe") || s.includes("turkce"))
    return { g1: "#f87171", g2: "#b91c1c", Icon: Feather, accent: "text-red-600" };
  return { g1: "#94a3b8", g2: "#64748b", Icon: Sigma, accent: "text-slate-600" };
}

export function SubjectBankCarousel({ subjects }: { subjects: QuestionBankSubjectSummary[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(320, el.clientWidth * 0.85), behavior: "smooth" });
  };

  if (!subjects.length) {
    return (
      <div className="rounded-[var(--qb-card-radius)] border border-dashed border-indigo-200/80 bg-white px-[var(--qb-card-pad)] py-10 text-center text-[13px] text-slate-600 shadow-[var(--qb-card-shadow)]">
        Bu kapsamda henüz ders bazlı soru özeti yok. Müfredatını güncellediğinde kartlar burada görünür.
      </div>
    );
  }

  const firstHref = subjects[0]?.cta_deep_link ?? "/ogrenci/soru-bankasi";

  return (
    <section className="qb-subjects-section">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-tight text-slate-900 lg:text-lg">
          Derslere Göre Soru Bankaları
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={firstHref}
            className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Tümü
          </Link>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label="Önceki dersler"
              onClick={() => scrollBy(-1)}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label="Sonraki dersler"
              onClick={() => scrollBy(1)}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-1 flex gap-4 overflow-x-auto pb-2 pt-0.5 scrollbar-thin [scrollbar-color:rgba(148,163,184,0.6)_transparent]"
      >
        {subjects.map((row) => {
          const { g1, g2, Icon, accent } = resolveStyle(row.subject);
          const pct =
            row.correct_rate != null && row.correct_rate >= 0
              ? Math.round(row.correct_rate)
              : null;
          const meta =
            pct != null
              ? `${formatInt(row.total)} Soru / %${pct}`
              : `${formatInt(row.total)} Soru`;

          return (
            <Link
              key={row.subject}
              href={row.cta_deep_link}
              className="group relative flex w-[156px] min-w-[148px] shrink-0 flex-col items-center rounded-[18px] border border-slate-100 bg-white px-4 pb-4 pt-5 shadow-[var(--qb-card-shadow)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md md:min-w-[156px] md:w-[164px]"
            >
              <SubjectBook3D g1={g1} g2={g2} Icon={Icon} size="carousel" />
              <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-900">
                {row.subject}
              </p>
              <p className="mt-1 text-center text-[10px] leading-snug text-slate-500">{meta}</p>
              <span
                className={`mt-3 inline-flex items-center gap-0.5 text-[11px] font-bold ${accent} group-hover:opacity-90`}
              >
                Çözmeye Devam Et
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
