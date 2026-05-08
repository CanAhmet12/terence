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
      Icon: BarChart3,
      iconWrap: "bg-indigo-50 text-indigo-600",
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
      {items.map(({ label, value, hint, Icon, iconWrap }) => (
        <div
          key={label}
          className="rounded-[var(--qb-card-radius)] border border-white/80 bg-white/95 p-3 shadow-[var(--qb-card-shadow)] backdrop-blur-sm"
          title={hint}
        >
          <div className="flex items-start gap-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium leading-tight text-slate-500">{label}</p>
              <p className="mt-0.5 text-base font-bold tabular-nums leading-tight text-slate-900">
                {loading ? (
                  <span className="inline-block h-6 w-14 animate-pulse rounded-md bg-slate-100" />
                ) : (
                  value
                )}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
