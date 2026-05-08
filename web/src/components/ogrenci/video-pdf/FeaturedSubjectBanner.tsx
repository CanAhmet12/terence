"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MediaHubSubjectSummary, UnifiedMediaItem } from "./types";
import { readFeaturedSubjectSlug, writeFeaturedSubjectSlug, getStoredSeconds } from "./utils";

type Props = {
  items: UnifiedMediaItem[];
  subjectsSummary: MediaHubSubjectSummary[];
};

export function FeaturedSubjectBanner({ items, subjectsSummary }: Props) {
  const curriculumSubjects = useMemo(
    () => subjectsSummary.filter((s) => !s.isCourseArchive && s.media_count > 0),
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
      (a, b) => (b.progress_percent ?? 0) - (a.progress_percent ?? 0)
    )[0];
    setPickSlug(best?.slug ?? curriculumSubjects[0]?.slug ?? null);
  }, [curriculumSubjects]);

  const meta = pickSlug ? curriculumSubjects.find((s) => s.slug === pickSlug) : undefined;

  if (!meta || !pickSlug) {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-5 py-4 text-sm text-indigo-900">
        Öne çıkan ders için henüz müfredat içeriği yok. Dersleriniz güncellendiğinde burada görünecek.
      </div>
    );
  }

  const subjectItems = items.filter((i) => i.subjectSlug === pickSlug);
  const hasPartial =
    subjectItems.some((i) => i.contentType === "video" && getStoredSeconds(i) > 5) ||
    (meta.progress_percent ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Öne çıkan ders</p>
        <h2 className="mt-1 truncate text-xl font-bold text-slate-900">{meta.name}</h2>
        <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{ width: `${meta.progress_percent ?? 0}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Konu ilerlemesi %{meta.progress_percent ?? 0} · {meta.media_count} medya
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <select
          aria-label="Öne çıkan ders seç"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm sm:w-56"
          value={pickSlug}
          onChange={(e) => {
            const v = e.target.value;
            setPickSlug(v);
            writeFeaturedSubjectSlug(v);
          }}
        >
          {curriculumSubjects.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <Link
          href={`/ogrenci/dersler?slug=${encodeURIComponent(pickSlug)}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-600"
        >
          {hasPartial ? "Devam et" : "Derslerim’de aç"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
