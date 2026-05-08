"use client";

import type { QuestionBankSummary } from "@/lib/api";

export function QuestionBankKpiStrip({
  summary,
  loading,
}: {
  summary: QuestionBankSummary | null;
  loading: boolean;
}) {
  const k = summary?.kpis;
  const items = [
    { label: "Kapsamdaki soru", value: k?.total_questions ?? "—", hint: "Aktif, sınıf + sınav kapsamın" },
    { label: "Çözdüğün (benzersiz)", value: k?.answered_distinct ?? "—", hint: "Soru bankası kaynaklı" },
    { label: "Doğruluk", value: k != null && k.attempts > 0 ? `%${k.accuracy_pct}` : "—", hint: "Tüm denemeler" },
    { label: "Net (tahmini)", value: k != null && k.attempts > 0 ? String(k.net_estimate) : "—", hint: "Yanlış / 4 düşümü" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, hint }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          title={hint}
        >
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
            {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" /> : value}
          </p>
        </div>
      ))}
    </div>
  );
}
