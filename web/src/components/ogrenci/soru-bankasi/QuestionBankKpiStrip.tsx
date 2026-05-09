"use client";

import type { QuestionBankSummary } from "@/lib/api";

function formatInt(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

export function QuestionBankKpiStrip({
  summary,
  loading,
}: {
  summary: QuestionBankSummary | null;
  loading: boolean;
}) {
  const k = summary?.kpis;
  const rows = [
    {
      label: "Toplam Soru",
      value: k != null ? formatInt(k.total_questions) : "—",
    },
    {
      label: "Çözülen Soru",
      value: k != null ? formatInt(k.answered_distinct) : "—",
    },
    {
      label: "Doğru Oranı",
      value: k != null && k.attempts > 0 ? `%${k.accuracy_pct}` : "—",
    },
    {
      label: "Net",
      value:
        k != null && k.attempts > 0
          ? new Intl.NumberFormat("tr-TR", {
              maximumFractionDigits: 3,
              minimumFractionDigits: 0,
            }).format(k.net_estimate)
          : "—",
    },
  ];

  return (
    <section aria-label="Özet">
      <table>
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{loading ? "…" : value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
