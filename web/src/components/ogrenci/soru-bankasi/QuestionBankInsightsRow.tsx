"use client";

import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Target } from "lucide-react";
import type { BadgeData, QuestionBankSubjectSummary, WeakAchievement } from "@/lib/api";

function buildRadarSeries(
  subjects: QuestionBankSubjectSummary[],
  weak: WeakAchievement[]
): { label: string; value: number }[] {
  const fromSubjects = subjects.map((s) => ({
    label: s.subject.length > 16 ? `${s.subject.slice(0, 14)}…` : s.subject,
    value: Math.round(s.correct_rate ?? 0),
  }));
  if (fromSubjects.length >= 3) return fromSubjects.slice(0, 6);

  const extra = weak.map((w) => ({
    label: (w.konu ?? w.kod).length > 16 ? `${(w.konu ?? w.kod).slice(0, 14)}…` : (w.konu ?? w.kod),
    value: Math.max(0, Math.min(100, Math.round(w.accuracy_rate ?? 0))),
  }));

  const merged = [...fromSubjects];
  for (const e of extra) {
    if (merged.length >= 6) break;
    if (!merged.some((m) => m.label === e.label)) merged.push(e);
  }

  while (merged.length < 3 && merged.length < 5) {
    merged.push({ label: `Alan ${merged.length + 1}`, value: 0 });
  }

  return merged.slice(0, 6);
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
  const radarData = buildRadarSeries(subjects, weakPreview);
  const hasRadar = radarData.some((d) => d.value > 0) || subjects.length > 0;

  const bullets =
    weakPreview.length > 0
      ? weakPreview.slice(0, 4).map((w) => ({
          text: `${w.konu ?? w.kod}: doğruluk %${w.accuracy_rate}`,
          href: `/ogrenci/soru-bankasi?kazanim_code=${encodeURIComponent(w.kod)}`,
        }))
      : [];

  const badges = (badgeData?.badges ?? []).filter(Boolean).slice(0, 3);

  return (
    <div className="qb-insights-root mt-6 grid gap-4 lg:grid-cols-3 lg:gap-4">
      {/* Öneriler */}
      <div className="rounded-[var(--qb-card-radius)] border border-indigo-100/80 bg-white/95 p-4 shadow-[var(--qb-card-shadow)]">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Target className="h-4 w-4" aria-hidden />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Sınıfına Özel Öneriler</h3>
        </div>
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : bullets.length === 0 && !goalHint ? (
          <p className="text-sm text-slate-600">Henüz yeterli veri yok; çözmeye devam et, öneriler burada belirecek.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {goalHint && <li className="leading-relaxed text-slate-700">{goalHint}</li>}
            {bullets.map((b) => (
              <li key={b.href}>
                <Link href={b.href} className="font-medium text-indigo-700 underline-offset-2 hover:underline">
                  {b.text}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/ogrenci/zayif-kazanim"
          className="mt-4 inline-flex text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          Önerileri Gör →
        </Link>
      </div>

      {/* Radar */}
      <div className="rounded-[var(--qb-card-radius)] border border-indigo-100/80 bg-white/95 p-4 shadow-[var(--qb-card-shadow)]">
        <h3 className="mb-1 text-sm font-bold text-slate-900">Kazanım Analizi</h3>
        <p className="mb-3 text-[11px] leading-snug text-slate-500">Ders bazlı doğruluk özeti (%).</p>
        <div className="qb-fit-radar h-[200px] w-full sm:h-[220px]" role="img" aria-label="Kazanım radar grafiği">
          {!hasRadar || radarData.length < 3 ? (
            <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
              Grafik için en az birkaç dersden çözüm verisi gerekir.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
                <Radar
                  name="Doğruluk"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rozetler */}
      <div className="rounded-[var(--qb-card-radius)] border border-indigo-100/80 bg-white/95 p-4 shadow-[var(--qb-card-shadow)]">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Başarı Rozetlerin</h3>
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : badges.length === 0 ? (
          <p className="text-sm text-slate-600">Rozetler için çözmeye devam et.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex h-[88px] w-[80px] flex-col items-center justify-center rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-white p-1.5 text-center shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-base text-white shadow-inner">
                  {b.emoji ?? "🏅"}
                </div>
                <p className="mt-2 line-clamp-2 text-[10px] font-bold leading-tight text-slate-800">{b.name}</p>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/ogrenci/rozet"
          className="mt-4 inline-flex text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          Tüm rozetler →
        </Link>
      </div>
    </div>
  );
}
