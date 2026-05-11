"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { BadgeData, QuestionBankSubjectSummary, WeakAchievement } from "@/lib/api";
import { cn } from "@/lib/utils";

export function QuestionBankInsightsRow({
  subjects: _subjects,
  weakPreview,
  badgeData,
  goalHint,
  loading,
}: {
  subjects?: QuestionBankSubjectSummary[];
  weakPreview: WeakAchievement[];
  badgeData: BadgeData | null;
  goalHint?: string | null;
  loading: boolean;
}) {
  const bullets =
    weakPreview.length > 0
      ? weakPreview.slice(0, 8).map((w) => ({
          text: `${w.konu ?? w.kod}`,
          sub: `%${w.accuracy_rate}`,
          href: `/ogrenci/soru-bankasi?kazanim_code=${encodeURIComponent(w.kod)}`,
        }))
      : [];

  const badges = (badgeData?.badges ?? []).filter(Boolean).slice(0, 10);

  return (
    <section
      aria-labelledby="qb-insights-heading"
      className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
            <h2 id="qb-insights-heading" className="text-sm font-semibold tracking-tight text-slate-900">
              Önerilen odak
            </h2>
            {goalHint ? (
              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                {goalHint}
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-4 flex gap-2 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-slate-100" />
              ))}
            </div>
          ) : bullets.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">Zayıf kazanım verisi için birkaç soru çöz.</p>
          ) : (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {bullets.map((b) => (
                <Link
                  key={b.href}
                  href={b.href}
                  className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/80 py-2 pl-3.5 pr-3 text-xs font-semibold text-slate-800 transition hover:border-violet-200 hover:bg-violet-50/80"
                >
                  <span className="max-w-[140px] truncate">{b.text}</span>
                  <span className="tabular-nums text-[10px] font-bold text-violet-600">{b.sub}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" aria-hidden />
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/ogrenci/zayif-kazanim"
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800"
          >
            Zayıf kazanımlar
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>

        <div className="min-w-0 shrink-0 sm:max-w-[min(100%,320px)] sm:border-l sm:border-slate-100 sm:pl-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rozetler</p>
            <Link
              href="/ogrenci/rapor"
              className="text-[11px] font-semibold text-slate-500 hover:text-violet-600"
            >
              Rapor
            </Link>
          </div>
          {loading ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : badges.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Çözdükçe açılır.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <li key={b.id}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition",
                      b.earned
                        ? "border-amber-200/80 bg-gradient-to-b from-amber-50 to-white text-amber-950 shadow-amber-100/50"
                        : "border-slate-200/80 bg-white text-slate-500"
                    )}
                  >
                    <span className="text-sm leading-none">{b.emoji ?? "◇"}</span>
                    <span className="max-w-[100px] truncate">{b.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/ogrenci/rozet"
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800"
          >
            Tüm rozetler
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
