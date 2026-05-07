"use client";

import type { DailyPlan } from "@/lib/plan-types";
import { PlanSkeleton } from "./plan-ui";
import { CalendarDays } from "lucide-react";
import { DAYS_TR } from "./plan-styles";

export function PlanWeekSection({
  loading,
  weeklyPlans,
  today,
}: {
  loading: boolean;
  weeklyPlans: DailyPlan[];
  today: Date;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <PlanSkeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (weeklyPlans.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center">
        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-700">Bu hafta için plan yok</p>
        <p className="mt-1 text-sm text-slate-500">
          Bugün sekmesini kullanarak görev ekle
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weeklyPlans.map((dayPlan) => {
        const date = new Date(dayPlan.plan_date ?? dayPlan.date ?? "");
        const isToday = date.toDateString() === today.toDateString();
        const dayName = DAYS_TR[date.getDay()];
        const pct =
          (dayPlan.total_tasks ?? 0) > 0
            ? Math.round(
                ((dayPlan.completed_tasks ?? 0) / (dayPlan.total_tasks ?? 1)) *
                  100,
              )
            : 0;

        return (
          <div
            key={String(dayPlan.id ?? dayPlan.plan_date)}
            className={`rounded-2xl border p-5 transition-all ${
              isToday
                ? "border-indigo-300 shadow-sm ring-2 ring-indigo-100"
                : "border-slate-100 shadow-sm hover:shadow-md"
            } bg-white`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${
                    isToday
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {date.getDate()}
                </div>
                <div>
                  <p
                    className={`text-sm font-bold ${isToday ? "text-indigo-700" : "text-slate-800"}`}
                  >
                    {dayName}
                    {isToday && (
                      <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                        Bugün
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(dayPlan.completed_tasks ?? 0)}/{dayPlan.total_tasks ?? 0}{" "}
                    görev
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-black ${
                    pct === 100
                      ? "text-emerald-600"
                      : pct >= 50
                        ? "text-indigo-600"
                        : "text-slate-400"
                  }`}
                >
                  %{pct}
                </p>
              </div>
            </div>

            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct === 100
                    ? "bg-emerald-500"
                    : pct >= 50
                      ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                      : "bg-amber-400"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {dayPlan.tasks && dayPlan.tasks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dayPlan.tasks.slice(0, 4).map((t) => (
                  <span
                    key={t.id}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                      t.is_completed
                        ? "bg-emerald-50 text-emerald-600 line-through"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t.title && t.title.length > 22
                      ? t.title.slice(0, 22) + "…"
                      : t.title}
                  </span>
                ))}
                {(dayPlan.tasks?.length ?? 0) > 4 && (
                  <span className="px-2 py-1 text-[11px] text-slate-400">
                    +{(dayPlan.tasks?.length ?? 0) - 4} daha
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
