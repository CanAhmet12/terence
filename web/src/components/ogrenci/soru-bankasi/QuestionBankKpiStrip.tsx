"use client";

import { BarChart3, CheckCircle2, LineChart } from "lucide-react";
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
  const items = [
    {
      label: "Toplam Soru",
      value: k != null ? formatInt(k.total_questions) : "—",
      hint: "Kapsamdaki soru sayısı",
      Icon: LineChart,
      iconWrap: "bg-violet-50 text-violet-600",
    },
    {
      label: "Çözülen Soru",
      value: k != null ? formatInt(k.answered_distinct) : "—",
      hint: "Benzersiz çözülen soru",
      Icon: CheckCircle2,
      iconWrap: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Doğru Oranı",
      value: k != null && k.attempts > 0 ? `%${k.accuracy_pct}` : "—",
      hint: "Tüm deneme girişlerine göre",
      Icon: LineChart,
      iconWrap: "bg-orange-50 text-orange-600",
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
      hint: "Yanlış başına 0,25 düşüm",
      Icon: BarChart3,
      iconWrap: "bg-sky-50 text-sky-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
      {items.map(({ label, value, hint, Icon, iconWrap }) => (
        <div
          key={label}
          className="rounded-[18px] border border-slate-100 bg-white p-[var(--qb-card-pad)] shadow-[var(--qb-card-shadow)]"
          title={hint}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium leading-tight text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums leading-tight tracking-tight text-slate-900">
                {loading ? (
                  <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  value
                )}
              </p>
            </div>
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
