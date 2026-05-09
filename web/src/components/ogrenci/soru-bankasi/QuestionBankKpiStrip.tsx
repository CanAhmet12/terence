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
      accent: "from-violet-500/30 to-indigo-600/10",
    },
    {
      label: "Çözdüğün (benzersiz)",
      value: k != null ? formatInt(k.answered_distinct) : "—",
      hint: "Tekrarlar hariç",
      icon: Trophy,
      accent: "from-fuchsia-500/25 to-violet-600/10",
    },
    {
      label: "Doğruluk",
      value: k != null && k.attempts > 0 ? `%${k.accuracy_pct}` : "—",
      hint: k != null && k.attempts > 0 ? `${formatInt(k.attempts)} deneme` : "Henüz deneme yok",
      icon: TrendingUp,
      accent: "from-emerald-500/25 to-teal-900/10",
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
      accent: "from-amber-500/20 to-orange-950/20",
    },
  ];

  return (
    <section aria-label="Performans özeti" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(({ label, value, hint, icon: Icon, accent }) => (
        <div
          key={label}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br p-5 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-violet-500/25",
            accent
          )}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl transition group-hover:bg-white/10" />
          <div className="relative flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-violet-200 shadow-inner">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-white">
                {loading ? (
                  <span className="inline-block h-8 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />
                ) : (
                  value
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
