"use client";

import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Check, Target } from "lucide-react";
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
    <div className="qb-insights-root mt-0 grid gap-5 lg:grid-cols-3 lg:gap-5">
      {/* Öneriler */}
      <div className="flex min-h-[280px] flex-col rounded-[18px] border border-slate-100 bg-white p-[var(--qb-card-pad)] shadow-[var(--qb-card-shadow)]">
        <h3 className="mb-4 text-[15px] font-bold leading-tight text-slate-900">
          Sınıfına Özel Öneriler
        </h3>
        <div className="flex flex-1 gap-4">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 shadow-inner">
            <Target className="h-9 w-9 text-sky-600" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug text-slate-800">
              {goalHint ?? "12. Sınıf konularına göre sana özel testler"}
            </p>
            {loading ? (
              <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100" />
            ) : bullets.length === 0 && !goalHint ? (
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                Henüz yeterli veri yok; çözmeye devam et, öneriler burada belirecek.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {bullets.map((b) => (
                  <li key={b.href} className="flex gap-2 text-[13px] text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" strokeWidth={2.5} aria-hidden />
                    <Link
                      href={b.href}
                      className="font-medium leading-snug text-indigo-700 underline-offset-2 hover:underline"
                    >
                      {b.text}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <Link
          href="/ogrenci/zayif-kazanim"
          className="mt-auto pt-6 text-[13px] font-bold text-indigo-600 hover:text-indigo-800"
        >
          Önerileri Gör →
        </Link>
      </div>

      {/* Radar */}
      <div className="flex min-h-[280px] flex-col rounded-[18px] border border-slate-100 bg-white p-[var(--qb-card-pad)] shadow-[var(--qb-card-shadow)]">
        <h3 className="text-[15px] font-bold text-slate-900">Kazanım Analizi</h3>
        <p className="mt-1 text-[12px] leading-snug text-slate-500">
          Ders ve konu bazlı doğruluk özeti (%).
        </p>
        <div className="qb-fit-radar mt-4 h-[220px] w-full sm:h-[240px]" role="img" aria-label="Kazanım radar grafiği">
          {!hasRadar || radarData.length < 3 ? (
            <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-[13px] text-slate-500">
              Grafik için en az birkaç dersten çözüm verisi gerekir.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
                <Radar
                  name="Doğruluk"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.32}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
        <Link
          href="/ogrenci/rapor"
          className="mt-4 inline-flex text-[13px] font-bold text-indigo-600 hover:text-indigo-800"
        >
          Detaylı Analiz →
        </Link>
      </div>

      {/* Rozetler */}
      <div className="flex min-h-[280px] flex-col rounded-[18px] border border-slate-100 bg-white p-[var(--qb-card-pad)] shadow-[var(--qb-card-shadow)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold text-slate-900">Başarı Rozetlerin</h3>
          <Link href="/ogrenci/rozet" className="text-[12px] font-bold text-indigo-600 hover:underline">
            Tümü
          </Link>
        </div>
        {loading ? (
          <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ) : badges.length === 0 ? (
          <p className="flex-1 text-[13px] leading-relaxed text-slate-600">
            Rozetler için çözmeye devam et.
          </p>
        ) : (
          <div className="flex flex-1 flex-wrap items-center justify-center gap-5">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex w-[96px] flex-col items-center text-center"
              >
                <div
                  className="flex h-[52px] w-[52px] items-center justify-center bg-indigo-50 text-lg shadow-sm"
                  style={{
                    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                  }}
                >
                  <span className="drop-shadow-sm">{b.emoji ?? "🏅"}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-tight text-slate-800">{b.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
