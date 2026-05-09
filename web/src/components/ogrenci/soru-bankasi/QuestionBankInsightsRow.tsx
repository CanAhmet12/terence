"use client";

import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, Medal, Sparkles } from "lucide-react";
import type { BadgeData, QuestionBankSubjectSummary, WeakAchievement } from "@/lib/api";
import { cn } from "@/lib/utils";

function truncateSubject(name: string, max = 10): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function QuestionBankInsightsRow({
  subjects,
  weakPreview,
  badgeData,
  goalHint,
  loading,
}: {
  subjects: QuestionBankSubjectSummary[];
  weakPreview: WeakAchievement[];
  badgeData: BadgeData | null;
  goalHint?: string | null;
  loading: boolean;
}) {
  const bullets =
    weakPreview.length > 0
      ? weakPreview.slice(0, 5).map((w) => ({
          text: `${w.konu ?? w.kod}`,
          sub: `Doğruluk %${w.accuracy_rate}`,
          href: `/ogrenci/soru-bankasi?kazanim_code=${encodeURIComponent(w.kod)}`,
        }))
      : [];

  const badges = (badgeData?.badges ?? []).filter(Boolean).slice(0, 12);

  const radarData = subjects.slice(0, 10).map((s) => ({
    ders: truncateSubject(s.subject, 12),
    rate: s.correct_rate != null ? Math.round(Math.min(100, Math.max(0, s.correct_rate))) : 0,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
      <section
        aria-labelledby="qb-rec-heading"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4"
      >
        <div className="flex items-center gap-2 text-violet-700">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Akıllı öneriler</span>
        </div>
        <h2 id="qb-rec-heading" className="mt-2 text-xl font-bold text-slate-900">
          Önce bunları çöz
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {goalHint ?? "Hedef ve müfredatına göre öneriler burada güncellenir."}
        </p>

        {loading ? (
          <div className="mt-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : bullets.length === 0 && !goalHint ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Henüz yeterli çözüm verisi yok. Birkaç soru çözdükten sonra zayıf kazanımların burada listelenir.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {bullets.map((b) => (
              <li key={b.href}>
                <Link
                  href={b.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 transition hover:border-violet-200 hover:bg-violet-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">{b.text}</span>
                    <span className="text-xs text-slate-500">{b.sub}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-violet-600" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/ogrenci/zayif-kazanim"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          Zayıf kazanımlar sayfası
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section
        aria-labelledby="qb-radar-heading"
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-5"
      >
        <div className="pointer-events-none absolute -right-8 top-6 h-32 w-32 rounded-full bg-violet-100/80 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="qb-radar-heading" className="text-xl font-bold text-slate-900">
              Ders doğruluk haritası
            </h2>
            <p className="mt-1 max-w-xs text-sm text-slate-600">
              Hangi derste daha güçlü olduğunu tek bakışta gör.
            </p>
          </div>
          <Link
            href="/ogrenci/rapor"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-200 hover:bg-violet-50"
          >
            Detaylı rapor
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="relative mt-3 h-[220px] w-full">
          {subjects.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Henüz ders bazlı doğruluk verisi yok.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="52%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="ders" tick={{ fill: "#64748b", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Doğruluk"
                  dataKey="rate"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#qbRadarFillLight)"
                  fillOpacity={0.35}
                />
                <defs>
                  <linearGradient id="qbRadarFillLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50">
          <table className="w-full min-w-[300px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-3 py-2 font-semibold">
                  Ders
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Doğruluk
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Çözüm
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.slice(0, 8).map((s) => {
                const pct = s.correct_rate != null ? Math.round(s.correct_rate) : null;
                return (
                  <tr key={s.subject} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-800">{s.subject}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            style={{ width: pct != null ? `${pct}%` : "0%" }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-600">{pct != null ? `%${pct}` : "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{s.total ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-labelledby="qb-badges-heading"
        className="rounded-2xl border border-slate-200 bg-gradient-to-b from-amber-50/50 to-white p-4 shadow-sm lg:col-span-3"
      >
        <div className="flex items-center gap-2 text-amber-800">
          <Medal className="h-4 w-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Rozet vitrin</span>
        </div>
        <h2 id="qb-badges-heading" className="mt-2 text-xl font-bold text-slate-900">
          Rozetlerin
        </h2>

        {loading ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-100" />
            ))}
          </div>
        ) : badges.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">Henüz rozet görünmüyor — çözmeye devam!</p>
        ) : (
          <ul className="mt-5 flex flex-wrap gap-2">
            {badges.map((b) => (
              <li key={b.id}>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
                    b.earned
                      ? "border-amber-200 bg-amber-100 text-amber-950"
                      : "border-slate-200 bg-white text-slate-600"
                  )}
                >
                  <span className="text-base leading-none">{b.emoji ?? "◇"}</span>
                  {b.name}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/ogrenci/rozet"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          Tüm rozetler
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
