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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-800 p-6 text-white shadow-xl shadow-violet-900/20 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <select
        aria-label="Öne çıkan ders seç"
        className="absolute right-4 top-4 z-20 max-w-[10rem] cursor-pointer rounded-lg border border-white/25 bg-black/20 px-2 py-1.5 text-[11px] font-bold text-white backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/40 sm:right-6 sm:top-5 sm:max-w-[12rem] sm:text-xs"
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

      <div className="relative grid gap-8 pr-4 lg:grid-cols-[1fr_280px_200px] lg:items-center lg:pr-0">
        <div className="min-w-0 pt-6 lg:pt-0">
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
            {examLabel} {meta.name} video ders içerikleri
          </p>
          <Link
            href={`/ogrenci/dersler?slug=${encodeURIComponent(pickSlug)}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-violet-700 shadow-lg transition hover:bg-violet-50"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden />
            {hasPartial ? "Devam Et" : "Başla"}
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

        <div className="relative hidden h-36 items-center justify-center lg:flex">
          <div className="relative h-28 w-32">
            <div className="absolute bottom-0 left-2 h-14 w-14 rotate-[-12deg] rounded-xl bg-fuchsia-400/90 shadow-lg" />
            <div className="absolute bottom-2 left-10 h-14 w-14 rotate-[6deg] rounded-xl bg-amber-300/95 shadow-lg" />
            <div className="absolute bottom-0 right-4 h-16 w-14 rotate-[10deg] rounded-xl bg-sky-400/95 shadow-lg" />
            <div className="absolute -top-1 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-violet-600 shadow-xl">
              <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
