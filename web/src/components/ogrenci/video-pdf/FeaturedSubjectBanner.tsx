"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Play } from "lucide-react";
import type { MediaHubSubjectSummary, UnifiedMediaItem } from "./types";
import { readFeaturedSubjectSlug, writeFeaturedSubjectSlug, getStoredSeconds, videoProgressRatio } from "./utils";

type Props = {
  items: UnifiedMediaItem[];
  subjectsSummary: MediaHubSubjectSummary[];
};

export function FeaturedSubjectBanner({ items, subjectsSummary }: Props) {
  const curriculumSubjects = useMemo(
    () =>
      subjectsSummary.filter(
        (s) => !s.isCourseArchive && ((s.media_count ?? 0) > 0 || (s.total_topics ?? 0) > 0)
      ),
    [subjectsSummary]
  );
  const [pickSlug, setPickSlug] = useState<string | null>(null);

  useEffect(() => {
    if (curriculumSubjects.length === 0) {
      setPickSlug(null);
      return;
    }
    const saved = readFeaturedSubjectSlug();
    if (saved && curriculumSubjects.some((s) => s.slug === saved)) {
      setPickSlug(saved);
      return;
    }
    const best = [...curriculumSubjects].sort(
      (a, b) => (b.media_count ?? 0) - (a.media_count ?? 0) || (b.progress_percent ?? 0) - (a.progress_percent ?? 0)
    )[0];
    setPickSlug(best?.slug ?? curriculumSubjects[0]?.slug ?? null);
  }, [curriculumSubjects]);

  const meta = pickSlug ? curriculumSubjects.find((s) => s.slug === pickSlug) : undefined;

  if (!meta || !pickSlug) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-5 py-4 text-sm text-violet-900">
        Öne çıkan ders için henüz müfredat içeriği yok. Dersleriniz güncellendiğinde burada görünecek.
      </div>
    );
  }

  const subjectItems = items.filter((i) => i.subjectSlug === pickSlug);
  const doneMedia = subjectItems.filter((i) => {
    if (i.contentType === "video" && i.durationSeconds > 0) return videoProgressRatio(i) >= 0.92;
    return false;
  }).length;
  const totalMedia = subjectItems.length || meta.media_count || 0;
  const hasPartial =
    subjectItems.some((i) => i.contentType === "video" && getStoredSeconds(i) > 5) ||
    (meta.progress_percent ?? 0) > 0;

  const examLabel = (meta.exam_type && meta.exam_type !== "all" ? meta.exam_type : "TYT").toString().toUpperCase();
  const gradeLabel = meta.grade && meta.grade !== "all" ? `${meta.grade}. Sınıf` : "12. Sınıf";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-800 p-6 text-white shadow-xl shadow-violet-900/20 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto_200px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/95 ring-1 ring-white/20">
              {gradeLabel}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/95 ring-1 ring-white/20">
              {examLabel}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{meta.name}</h2>
          <p className="mt-2 max-w-lg text-sm text-violet-100/95">
            {examLabel} {meta.name} video ve PDF içerikleri. Derslerim üzerinden konu konu ilerleyin.
          </p>
          <Link
            href={`/ogrenci/dersler?slug=${encodeURIComponent(pickSlug)}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-violet-700 shadow-lg transition hover:bg-violet-50"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden />
            {hasPartial ? "Devam Et" : "Derse git"}
          </Link>
        </div>

        <div className="min-w-0 lg:max-w-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-200">Genel İlerleme</p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <span className="text-3xl font-black">%{meta.progress_percent ?? 0}</span>
            <span className="pb-1 text-xs font-medium text-violet-100">
              {doneMedia} / {Math.max(totalMedia, 1)} içerik tamamlandı
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${Math.min(100, meta.progress_percent ?? 0)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 lg:border-l lg:border-white/15 lg:pl-8">
          <select
            aria-label="Öne çıkan ders seç"
            className="w-full max-w-xs rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/40"
            value={pickSlug}
            onChange={(e) => {
              const v = e.target.value;
              setPickSlug(v);
              writeFeaturedSubjectSlug(v);
            }}
          >
            {curriculumSubjects.map((s) => (
              <option key={s.slug} value={s.slug} className="text-slate-900">
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <BarChart3 className="h-8 w-8 text-white/90" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
