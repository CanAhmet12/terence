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
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      {/* Öneriler */}
      <section
        aria-labelledby="qb-rec-heading"
        className="lg:col-span-4 rounded-3xl border border-white/[0.07] bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-xl backdrop-blur-md"
      >
        <div className="flex items-center gap-2 text-violet-300/90">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Akıllı öneriler</span>
        </div>
        <h2 id="qb-rec-heading" className="mt-3 text-xl font-bold text-white">
          Önce bunları çöz
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {goalHint ?? "Hedef ve müfredatına göre öneriler burada güncellenir."}
        </p>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : bullets.length === 0 && !goalHint ? (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-slate-500">
            Henüz yeterli çözüm verisi yok. Birkaç soru çözdükten sonra zayıf kazanımların burada listelenir.
          </p>
        ) : (
          <ul className="mt-6 space-y-2">
            {bullets.map((b) => (
              <li key={b.href}>
                <Link
                  href={b.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition hover:border-violet-500/30 hover:bg-violet-500/10"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-100">{b.text}</span>
                    <span className="text-xs text-slate-500">{b.sub}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-violet-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/ogrenci/zayif-kazanim"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200"
        >
          Zayıf kazanımlar sayfası
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      {/* Radar */}
      <section
        aria-labelledby="qb-radar-heading"
        className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0f0a18] via-slate-950 to-[#06060d] p-6 shadow-xl lg:col-span-5"
      >
        <div className="pointer-events-none absolute -right-12 top-8 h-40 w-40 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="qb-radar-heading" className="text-xl font-bold text-white">
              Ders doğruluk haritası
            </h2>
            <p className="mt-1 max-w-xs text-sm text-slate-400">
              Hangi derste daha güçlü olduğunu tek bakışta gör.
            </p>
          </div>
          <Link
            href="/ogrenci/rapor"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-violet-400/40 hover:text-white"
          >
            Detaylı rapor
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="relative mt-4 h-[280px] w-full">
          {subjects.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/25 text-sm text-slate-500">
              Henüz ders bazlı doğruluk verisi yok.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="52%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.15)" />
                <PolarAngleAxis
                  dataKey="ders"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Doğruluk"
                  dataKey="rate"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#qbRadarFill)"
                  fillOpacity={0.45}
                />
                <defs>
                  <linearGradient id="qbRadarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#5b21b6" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-2 overflow-x-auto rounded-xl border border-white/[0.05] bg-black/20">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Ders
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Doğruluk
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Çözüm
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.slice(0, 8).map((s) => {
                const pct = s.correct_rate != null ? Math.round(s.correct_rate) : null;
                return (
                  <tr key={s.subject} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-200">{s.subject}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 max-w-[120px] overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                            style={{ width: pct != null ? `${pct}%` : "0%" }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-400">{pct != null ? `%${pct}` : "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-500">{s.total ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rozetler */}
      <section
        aria-labelledby="qb-badges-heading"
        className="rounded-3xl border border-white/[0.07] bg-gradient-to-b from-slate-900/95 to-violet-950/20 p-6 shadow-xl lg:col-span-3"
      >
        <div className="flex items-center gap-2 text-amber-200/90">
          <Medal className="h-4 w-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Rozet vitrin</span>
        </div>
        <h2 id="qb-badges-heading" className="mt-3 text-xl font-bold text-white">
          Rozetlerin
        </h2>

        {loading ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-white/5" />
            ))}
          </div>
        ) : badges.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">Henüz rozet görünmüyor — çözmeye devam!</p>
        ) : (
          <ul className="mt-6 flex flex-wrap gap-2">
            {badges.map((b) => (
              <li key={b.id}>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-inner backdrop-blur-sm",
                    b.earned
                      ? "border-amber-400/25 bg-amber-500/10 text-amber-100"
                      : "border-white/10 bg-white/[0.04] text-slate-400"
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
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200"
        >
          Tüm rozetler
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
