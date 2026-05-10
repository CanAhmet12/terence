"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Film, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMediaHubCatalog } from "@/hooks/useMediaHubCatalog";
import type { MediaHubQuickFilter, MediaHubSort, UnifiedMediaItem } from "@/components/ogrenci/video-pdf/types";
import { MediaHubPageHeader } from "@/components/ogrenci/video-pdf/MediaHubPageHeader";
import { MediaHubHero } from "@/components/ogrenci/video-pdf/MediaHubHero";
import { MediaKpiStrip } from "@/components/ogrenci/video-pdf/MediaKpiStrip";
import { FeaturedSubjectBanner } from "@/components/ogrenci/video-pdf/FeaturedSubjectBanner";
import { MediaFilterTabs } from "@/components/ogrenci/video-pdf/MediaFilterTabs";
import { MediaSortSelect } from "@/components/ogrenci/video-pdf/MediaSortSelect";
import { MediaTypeFilter, type MediaTypeFilter as MediaTypeFilterValue } from "@/components/ogrenci/video-pdf/MediaTypeFilter";
import { MediaContentCard } from "@/components/ogrenci/video-pdf/MediaContentCard";
import { MediaPlayerModal } from "@/components/ogrenci/video-pdf/MediaPlayerModal";
import { getStoredSeconds, pushRecentWatch, videoProgressRatio } from "@/components/ogrenci/video-pdf/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/90 ${className ?? ""}`} />;
}

export default function VideoPage() {
  const { token, user } = useAuth();
  const [includeCourseArchive, setIncludeCourseArchive] = useState(false);
  const { items, subjectsSummary, loading, error, refetch } = useMediaHubCatalog({
    token,
    includeCourseArchive,
  });
  const [catalogRefreshing, setCatalogRefreshing] = useState(false);

  const handleCatalogRefresh = useCallback(async () => {
    setCatalogRefreshing(true);
    try {
      await refetch();
    } finally {
      setCatalogRefreshing(false);
    }
  }, [refetch]);

  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<MediaHubQuickFilter>("all");
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilterValue>("all");
  const [sort, setSort] = useState<MediaHubSort>("order");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<UnifiedMediaItem | null>(null);

  const openItem = useCallback((item: UnifiedMediaItem) => {
    setActiveItem(item);
    pushRecentWatch({
      key: item.key,
      title: item.title,
      subjectName: item.subjectName,
      subjectSlug: item.subjectSlug,
      contentType: item.contentType,
      ts: Date.now(),
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...items];
    if (selectedSlug === "__course_archive__") {
      list = list.filter((i) => i.source === "course");
    } else if (selectedSlug) {
      list = list.filter((i) => i.subjectSlug === selectedSlug);
    }
    if (typeFilter !== "all") {
      list = list.filter((i) => i.contentType === typeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.topicTitle || "").toLowerCase().includes(q) ||
          (i.unitTitle || "").toLowerCase().includes(q) ||
          i.subjectName.toLowerCase().includes(q)
      );
    }
    if (quickFilter === "continue") {
      list = list.filter((i) => {
        if (i.contentType === "video") return getStoredSeconds(i) > 5;
        if (i.source === "curriculum") return i.topicStatus === "in_progress";
        return i.progressStatus === "in_progress";
      });
    }
    if (quickFilter === "new") {
      list = list.filter((i) => {
        const pos = i.contentType === "video" ? getStoredSeconds(i) : 0;
        if (i.source === "curriculum") {
          return (i.topicStatus === "not_started" || !i.topicStatus) && pos === 0;
        }
        return (i.progressStatus === "not_started" || !i.progressStatus) && pos === 0;
      });
    }
    if (quickFilter === "pro") {
      list = list.filter((i) => !i.isFree);
    }

    const sorted = [...list];
    switch (sort) {
      case "title_asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "tr"));
        break;
      case "title_desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title, "tr"));
        break;
      case "progress_desc":
        sorted.sort((a, b) => videoProgressRatio(b) - videoProgressRatio(a));
        break;
      default:
        sorted.sort((a, b) => {
          if (a.subjectSlug !== b.subjectSlug) {
            return a.subjectName.localeCompare(b.subjectName, "tr");
          }
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return a.id - b.id;
        });
    }
    return sorted;
  }, [items, selectedSlug, typeFilter, search, quickFilter, sort]);

  if (!token) {
    return (
      <div className="min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-b from-slate-50 to-white px-3 py-10 sm:px-4 sm:py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <Film className="mx-auto mb-4 h-14 w-14 text-indigo-400" aria-hidden />
          <h1 className="text-xl font-bold text-slate-900">Giriş gerekli</h1>
          <p className="mt-2 text-sm text-slate-600">Video ve PDF kataloğunu görmek için hesabınızla giriş yapın.</p>
          <Link
            href="/giris"
            className="mt-6 inline-flex rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600"
          >
            Giriş yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeItem && (
        <MediaPlayerModal
          item={activeItem}
          token={token}
          subscriptionPlan={user?.subscription_plan}
          onClose={() => setActiveItem(null)}
        />
      )}

      <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#f4f5f8]">
        <MediaHubPageHeader search={search} onSearchChange={setSearch} />

        <div className="mx-auto w-full max-w-[1800px] space-y-3 px-4 py-4 sm:px-6 lg:space-y-4 lg:px-8 lg:py-5">
          <MediaHubHero />

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          {loading ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
              <Skeleton className="h-28 w-full rounded-2xl" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <MediaKpiStrip items={items} subjectsSummary={subjectsSummary} />
              <FeaturedSubjectBanner items={items} subjectsSummary={subjectsSummary} />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <MediaFilterTabs value={quickFilter} onChange={setQuickFilter} />
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <details className="relative z-20 group">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-violet-600" aria-hidden />
                      <span className="hidden sm:inline">Filtreler</span>
                    </summary>
                    <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                      <button
                        type="button"
                        onClick={() => void handleCatalogRefresh()}
                        disabled={loading || catalogRefreshing || !token}
                        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${catalogRefreshing ? "animate-spin" : ""}`} aria-hidden />
                        Kataloğu yenile
                      </button>
                      <label className="flex cursor-pointer items-start gap-2 border-b border-slate-100 pb-3 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600"
                          checked={includeCourseArchive}
                          onChange={(e) => setIncludeCourseArchive(e.target.checked)}
                        />
                        <span>Kurs arşivini göster (müfredatla aynı URL gizlenir)</span>
                      </label>
                      <p className="mb-2 mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">İçerik türü</p>
                      <MediaTypeFilter value={typeFilter} onChange={setTypeFilter} />
                      <p className="mb-1.5 mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">Ders</p>
                      <select
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800"
                        value={selectedSlug ?? ""}
                        onChange={(e) => setSelectedSlug(e.target.value === "" ? null : e.target.value)}
                      >
                        <option value="">Tüm dersler</option>
                        {subjectsSummary.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name} ({s.media_count ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  </details>
                  <MediaSortSelect value={sort} onChange={setSort} />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-24 text-center shadow-sm">
                  <Film className="mb-3 h-14 w-14 text-slate-300" aria-hidden />
                  <p className="text-base font-bold text-slate-800">Sonuç bulunamadı</p>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Filtreleri veya aramayı değiştirmeyi deneyin. Gelişmiş filtrelerden kurs arşivini açabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((item, idx) => (
                    <MediaContentCard
                      key={item.key}
                      item={item}
                      cardIndex={idx}
                      subscriptionPlan={user?.subscription_plan}
                      profileGrade={user?.grade}
                      profileTargetExam={user?.target_exam ?? user?.exam_goal}
                      onOpen={openItem}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
