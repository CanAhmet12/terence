"use client";

import { Wifi, Calendar, Check } from "lucide-react";
import type { StudentLiveLessonsSummary } from "@/lib/api";

function formatMonthMinutes(totalMin: number): string {
  if (!totalMin || totalMin < 1) return "0 dk";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} dk`;
  return `${h}s ${m.toString().padStart(2, "0")}dk`;
}

/** Kompakt özet şeridi — canlı ders kartlarına sahne bırakır */
export function KpiStrip({ summary }: { summary: StudentLiveLessonsSummary | null }) {
  const up = summary?.upcoming_this_week ?? 0;
  const joined = summary?.joined_this_month ?? 0;
  const minutes = summary?.minutes_this_month ?? 0;

  const cards = [
    {
      Icon: Wifi,
      title: "Yaklaşan",
      value: String(up),
      sub: "bu hafta",
      iconWrap: "bg-indigo-50 text-[#6366F1] ring-1 ring-indigo-100/80",
    },
    {
      Icon: Calendar,
      title: "Katılım",
      value: String(joined),
      sub: "bu ay",
      iconWrap: "bg-sky-50 text-sky-600 ring-1 ring-sky-100/80",
    },
    {
      Icon: Check,
      title: "Süre",
      value: formatMonthMinutes(minutes),
      sub: "bu ay",
      iconWrap: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map(({ Icon, title, value, sub, iconWrap }) => (
        <div
          key={title}
          className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:gap-3 sm:px-3.5 sm:py-3"
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${iconWrap}`}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">{title}</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
              <span className="text-[17px] font-bold tabular-nums tracking-tight text-slate-900 sm:text-[18px]">{value}</span>
              <span className="text-[10px] font-medium text-slate-400">{sub}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
