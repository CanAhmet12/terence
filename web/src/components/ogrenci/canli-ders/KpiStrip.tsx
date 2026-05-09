"use client";

import { Wifi, Calendar, Check } from "lucide-react";
import type { StudentLiveLessonsSummary } from "@/lib/api";

/** Ay içi toplam dakikayı mockuptaki "36s 45dk" biçimine yakın gösterir (s = saat kısaltması). */
function formatMonthMinutes(totalMin: number): string {
  if (!totalMin || totalMin < 1) return "0 dk";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} dk`;
  return `${h}s ${m.toString().padStart(2, "0")}dk`;
}

export function KpiStrip({ summary }: { summary: StudentLiveLessonsSummary | null }) {
  const up = summary?.upcoming_this_week ?? 0;
  const joined = summary?.joined_this_month ?? 0;
  const minutes = summary?.minutes_this_month ?? 0;

  const cards = [
    {
      Icon: Wifi,
      title: "Yaklaşan Ders",
      value: String(up),
      sub: "Bu hafta",
      iconWrap: "bg-indigo-100 text-[#6366F1]",
    },
    {
      Icon: Calendar,
      title: "Katıldığın Ders",
      value: String(joined),
      sub: "Bu ay",
      iconWrap: "bg-sky-100 text-sky-600",
    },
    {
      Icon: Check,
      title: "Toplam Süre",
      value: formatMonthMinutes(minutes),
      sub: "Bu ay",
      iconWrap: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ Icon, title, value, sub, iconWrap }) => (
        <div
          key={title}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_10px_15px_-3px_rgba(15,23,42,0.06)]"
        >
          <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconWrap}`}>
            <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </div>
          <p className="text-[13px] font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-[28px] font-bold tabular-nums leading-none tracking-tight text-slate-900 lg:text-[32px]">
            {value}
          </p>
          <p className="mt-2 text-[12px] font-medium text-slate-400">{sub}</p>
        </div>
      ))}
    </div>
  );
}
