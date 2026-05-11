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
  const rows = [
    {
      label: "Kütüphanedeki soru",
      value: k != null ? formatInt(k.total_questions) : "—",
      hint: "Seçtiğin kapsamdaki toplam",
      icon: BookMarked,
      accent: "from-violet-50 to-indigo-50/80 border-violet-100",
    },
    {
      label: "Çözdüğün (benzersiz)",
      value: k != null ? formatInt(k.answered_distinct) : "—",
      hint: "Tekrarlar hariç",
      icon: Trophy,
      accent: "from-fuchsia-50 to-violet-50/80 border-fuchsia-100",
    },
    {
      label: "Doğruluk",
      value: k != null && k.attempts > 0 ? `%${k.accuracy_pct}` : "—",
      hint: k != null && k.attempts > 0 ? `${formatInt(k.attempts)} deneme` : "Henüz deneme yok",
      icon: TrendingUp,
      accent: "from-emerald-50 to-teal-50/80 border-emerald-100",
    },
    {
      label: "Net tahmini",
      value:
        k != null && k.attempts > 0
          ? new Intl.NumberFormat("tr-TR", {
              maximumFractionDigits: 3,
              minimumFractionDigits: 0,
            }).format(k.net_estimate)
          : "—",
      hint: "Son çözümlerine göre",
      icon: Target,
      accent: "from-amber-50 to-orange-50/80 border-amber-100",
    },
  ];

  return (
    <section aria-label="Performans özeti" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(({ label, value, hint, icon: Icon, accent }) => (
        <div
          key={label}
          className={cn(
            "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition hover:shadow-md",
            accent
          )}
        >
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/60 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white text-violet-600 shadow-sm">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                {loading ? (
                  <span className="inline-block h-8 w-24 animate-pulse rounded-lg bg-slate-200/80" aria-hidden />
                ) : (
                  value
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
