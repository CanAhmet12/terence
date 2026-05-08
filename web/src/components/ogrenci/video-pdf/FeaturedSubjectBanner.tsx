"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-800 p-4 text-white shadow-lg shadow-violet-900/15 sm:p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <select
        aria-label="Öne çıkan ders seç"
        className="absolute right-3 top-3 z-20 max-w-[9rem] cursor-pointer rounded-md border border-white/25 bg-black/20 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/40 sm:right-4 sm:top-3.5 sm:max-w-[11rem] sm:text-[11px]"
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

      <div className="relative grid gap-4 pr-2 sm:pr-3 lg:grid-cols-[1fr_minmax(0,14rem)_minmax(0,7rem)] lg:items-center lg:gap-5 lg:pr-0">
        <div className="min-w-0 pt-8 sm:pt-9 lg:pt-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white/95 ring-1 ring-white/20 sm:text-xs">
              {gradeLabel}
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white/95 ring-1 ring-white/20 sm:text-xs">
              {examLabel}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-black tracking-tight sm:text-xl lg:text-2xl">{meta.name}</h2>
          <p className="mt-1 max-w-lg text-xs text-violet-100/95 sm:text-sm">
            {examLabel} {meta.name} video ders içerikleri
          </p>
          <Link
            href={`/ogrenci/dersler?slug=${encodeURIComponent(pickSlug)}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-violet-700 shadow-md transition hover:bg-violet-50 sm:text-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" aria-hidden />
            {hasPartial ? "Devam Et" : "Başla"}
          </Link>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200 sm:text-xs">Genel İlerleme</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <span className="text-2xl font-black sm:text-3xl">%{meta.progress_percent ?? 0}</span>
            <span className="pb-0.5 text-[10px] font-medium text-violet-100 sm:text-xs">
              {doneMedia} / {Math.max(totalMedia, 1)} içerik tamamlandı
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${Math.min(100, meta.progress_percent ?? 0)}%` }}
            />
          </div>
        </div>

        <div className="relative hidden h-24 items-center justify-center lg:flex">
          <div className="relative h-20 w-24">
            <div className="absolute bottom-0 left-1 h-10 w-10 rotate-[-12deg] rounded-lg bg-fuchsia-400/90 shadow-md" />
            <div className="absolute bottom-1 left-7 h-10 w-10 rotate-[6deg] rounded-lg bg-amber-300/95 shadow-md" />
            <div className="absolute bottom-0 right-2 h-12 w-10 rotate-[10deg] rounded-lg bg-sky-400/95 shadow-md" />
            <div className="absolute -top-0.5 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-violet-600 shadow-lg">
              <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
