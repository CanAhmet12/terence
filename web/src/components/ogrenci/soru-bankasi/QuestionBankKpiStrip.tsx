"use client";

import { BookMarked, Target, TrendingUp, Trophy } from "lucide-react";
import type { QuestionBankSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

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
    { label: "Kütüphane", value: k != null ? formatInt(k.total_questions) : "—", icon: BookMarked },
    { label: "Çözülen", value: k != null ? formatInt(k.answered_distinct) : "—", icon: Trophy },
    { label: "Doğruluk", value: k != null && k.attempts > 0 ? `%${k.accuracy_pct}` : "—", icon: TrendingUp },
    { label: "Net tahmini", value: k != null && k.attempts > 0 ? k.net_estimate.toFixed(1) : "—", icon: Target },
  ];

  return (
    <section
      aria-label="Performans özeti"
      className="flex flex-wrap items-stretch justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-2 py-2 shadow-sm backdrop-blur-sm sm:gap-0 sm:rounded-full sm:px-4 sm:py-2.5"
    >
      {items.map(({ label, value, icon: Icon }, i) => (
        <div
          key={label}
          className={cn(
            "flex min-w-[calc(50%-4px)] flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 sm:min-w-0 sm:flex-none sm:rounded-none sm:px-5 sm:py-1",
            i > 0 && "sm:border-l sm:border-slate-100"
          )}
        >
          <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
            <p className="font-mono text-lg font-semibold tabular-nums leading-tight tracking-tight text-slate-900 sm:text-xl">
              {loading ? (
                <span className="inline-block h-6 w-14 animate-pulse rounded-md bg-slate-100" aria-hidden />
              ) : (
                value
              )}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
