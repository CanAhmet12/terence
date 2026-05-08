"use client";

import { Calendar, Play, Timer } from "lucide-react";
import type { StudentLiveLessonsSummary } from "@/lib/api";

export function KpiStrip({ summary }: { summary: StudentLiveLessonsSummary | null }) {
  const up = summary?.upcoming_this_week ?? 0;
  const joined = summary?.joined_this_month ?? 0;
  const minutes = summary?.minutes_this_month ?? 0;

  const cards = [
    { icon: Calendar, label: "Bu hafta yaklaşan", value: String(up), tone: "from-indigo-500 to-violet-600" },
    { icon: Play, label: "Bu ay katıldığım", value: String(joined), tone: "from-emerald-500 to-teal-600" },
    { icon: Timer, label: "Bu ay ders dakikası", value: `${minutes} dk`, tone: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      {cards.map(({ icon: Icon, label, value, tone }) => (
        <div
          key={label}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tone} p-5 text-white shadow-lg`}
        >
          <Icon className="absolute right-4 top-4 h-10 w-10 opacity-20" />
          <p className="text-sm font-medium text-white/90">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
        </div>
      ))}
    </div>
  );
}
