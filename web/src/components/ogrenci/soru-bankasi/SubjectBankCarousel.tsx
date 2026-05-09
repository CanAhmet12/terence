"use client";

import Link from "next/link";
import type { QuestionBankSubjectSummary } from "@/lib/api";

function formatInt(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

export function SubjectBankCarousel({ subjects }: { subjects: QuestionBankSubjectSummary[] }) {
  if (!subjects.length) {
    return (
      <p>
        Bu kapsamda henüz ders bazlı soru özeti yok. Müfredatını güncellediğinde liste burada görünür.
      </p>
    );
  }

  const firstHref = subjects[0]?.cta_deep_link ?? "/ogrenci/soru-bankasi";

  return (
    <section aria-labelledby="qb-subjects-heading">
      <h2 id="qb-subjects-heading">Derslere göre soru bankaları</h2>
      <p>
        <Link href={firstHref}>Tümü</Link>
      </p>
      <ul>
        {subjects.map((row) => {
          const pct =
            row.correct_rate != null && row.correct_rate >= 0
              ? Math.round(row.correct_rate)
              : null;
          const meta =
            pct != null
              ? `${formatInt(row.total)} soru, doğruluk %${pct}`
              : `${formatInt(row.total)} soru`;

          return (
            <li key={row.subject}>
              <Link href={row.cta_deep_link}>
                {row.subject} — {meta}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
