"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Atom, Box, Feather, FlaskConical, Leaf, Sigma } from "lucide-react";
import type { QuestionBankSubjectSummary } from "@/lib/api";
import { SubjectBook3D } from "@/components/ogrenci/soru-bankasi/SubjectBook3D";

type SubjectStyle = { g1: string; g2: string; Icon: LucideIcon };

/** Mockup: Σ Matematik, atom Fizik, flask Kimya, yaprak Biyoloji, tüy Türkçe, küp Geometri */
function resolveStyle(subject: string): SubjectStyle {
  const s = subject.trim().toLowerCase();
  if (s.includes("geometri")) return { g1: "#94a3b8", g2: "#475569", Icon: Box };
  if (s.includes("matematik")) return { g1: "#60a5fa", g2: "#1d4ed8", Icon: Sigma };
  if (s.includes("fizik")) return { g1: "#a78bfa", g2: "#6d28d9", Icon: Atom };
  if (s.includes("kimya")) return { g1: "#fb923c", g2: "#c2410c", Icon: FlaskConical };
  if (s.includes("biyoloji")) return { g1: "#4ade80", g2: "#15803d", Icon: Leaf };
  if (s.includes("türkçe") || s.includes("turkce")) return { g1: "#f87171", g2: "#b91c1c", Icon: Feather };
  return { g1: "#94a3b8", g2: "#64748b", Icon: Sigma };
}

export function SubjectBankCarousel({ subjects }: { subjects: QuestionBankSubjectSummary[] }) {
  if (!subjects.length) {
    return (
      <div className="rounded-[var(--qb-card-radius)] border border-dashed border-indigo-200/80 bg-white/60 px-3 py-8 text-center text-[13px] text-slate-600">
        Bu kapsamda henüz ders bazlı soru özeti yok. Müfredatını güncellediğinde kartlar burada görünür.
      </div>
    );
  }

  return (
    <section className="mt-1">
      <h2 className="mb-3 text-[15px] font-bold tracking-tight text-slate-900">Derslere Göre Soru Bankaları</h2>
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-0.5 scrollbar-thin md:gap-4">
        {subjects.map((row) => {
          const { g1, g2, Icon } = resolveStyle(row.subject);
          return (
            <Link
              key={row.subject}
              href={row.cta_deep_link}
              className="group relative flex min-w-[132px] max-w-[148px] shrink-0 flex-col items-center rounded-[var(--qb-card-radius)] border border-white/90 bg-white px-3 pb-3 pt-3 shadow-[var(--qb-card-shadow)] transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <SubjectBook3D g1={g1} g2={g2} Icon={Icon} size="carousel" />
              <p className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-800">{row.subject}</p>
              <p className="mt-0.5 text-center text-[10px] leading-snug text-slate-500">
                {row.total} soru · {row.answered} çözülen
              </p>
              <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700">
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
