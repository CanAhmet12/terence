"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Atom, Box, FlaskConical, Leaf, PenLine, Sigma } from "lucide-react";
import type { QuestionBankSubjectSummary } from "@/lib/api";

type SubjectVisual = { gradient: string; Icon: LucideIcon };

function resolveVisual(subject: string): SubjectVisual {
  const s = subject.trim().toLowerCase();
  if (s.includes("geometri")) return { gradient: "from-slate-500 to-slate-700", Icon: Box };
  if (s.includes("matematik")) return { gradient: "from-blue-600 to-blue-800", Icon: Sigma };
  if (s.includes("fizik")) return { gradient: "from-violet-600 to-purple-800", Icon: Atom };
  if (s.includes("kimya")) return { gradient: "from-orange-500 to-amber-700", Icon: FlaskConical };
  if (s.includes("biyoloji")) return { gradient: "from-emerald-500 to-green-700", Icon: Leaf };
  if (s.includes("türkçe") || s.includes("turkce")) return { gradient: "from-red-500 to-rose-700", Icon: PenLine };
  return { gradient: "from-slate-400 to-slate-600", Icon: Sigma };
}

export function SubjectBankCarousel({ subjects }: { subjects: QuestionBankSubjectSummary[] }) {
  if (!subjects.length) {
    return (
      <div className="rounded-[var(--qb-card-radius)] border border-dashed border-indigo-200/80 bg-white/60 px-4 py-10 text-center text-sm text-slate-600">
        Bu kapsamda henüz ders bazlı soru özeti yok. Müfredatını güncellediğinde kartlar burada görünür.
      </div>
    );
  }

  return (
    <section className="mt-2">
      <h2 className="mb-4 text-lg font-bold text-slate-900">Derslere Göre Soru Bankaları</h2>
      <div className="-mx-1 flex gap-5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        {subjects.map((row) => {
          const { gradient, Icon } = resolveVisual(row.subject);
          return (
            <Link
              key={row.subject}
              href={row.cta_deep_link}
              className="group relative flex min-w-[168px] max-w-[180px] shrink-0 flex-col items-center rounded-[var(--qb-card-radius)] border border-white/90 bg-white p-5 shadow-[var(--qb-card-shadow)] transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`relative mb-4 flex h-[140px] w-[100px] items-end justify-center rounded-2xl bg-gradient-to-b ${gradient} shadow-inner`}
              >
                <div className="absolute inset-x-2 top-3 h-3 rounded-sm bg-white/25" />
                <Icon className="relative z-[1] mb-6 h-12 w-12 text-white drop-shadow-md" aria-hidden />
              </div>
              <p className="text-center text-xs font-bold uppercase tracking-wide text-slate-800">{row.subject}</p>
              <p className="mt-1 text-center text-[11px] text-slate-500">
                {row.total} soru · {row.answered} çözülen
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                Çözmeye Devam Et
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
