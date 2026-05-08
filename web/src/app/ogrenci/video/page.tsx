"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Film, RefreshCw } from "lucide-react";
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
import { ProPromoCard } from "@/components/ogrenci/video-pdf/ProPromoCard";
import { MediaContentCard } from "@/components/ogrenci/video-pdf/MediaContentCard";
import { MediaSubjectChips } from "@/components/ogrenci/video-pdf/MediaSubjectChips";
import { RecentlyWatchedPanel } from "@/components/ogrenci/video-pdf/RecentlyWatchedPanel";
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
  const [recentTick, setRecentTick] = useState(0);

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
    setRecentTick((t) => t + 1);
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-16">
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

      <div className="min-h-screen bg-[#f4f5f8]">
        <MediaHubPageHeader search={search} onSearchChange={setSearch} />

        <div className="mx-auto w-full max-w-[1760px] space-y-6 px-3 py-6 sm:px-5 lg:space-y-8 lg:py-8">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void handleCatalogRefresh()}
              disabled={loading || catalogRefreshing || !token}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${catalogRefreshing ? "animate-spin" : ""}`} aria-hidden />
              Kataloğu yenile
            </button>
          </div>

          <MediaHubHero />

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          {loading ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
              <Skeleton className="h-40 w-full rounded-3xl" />
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

              <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  checked={includeCourseArchive}
                  onChange={(e) => setIncludeCourseArchive(e.target.checked)}
                />
                Kurs arşivini göster (kayıtlı kurs içerikleri, müfredatla çakışan URL’ler gizlenir)
              </label>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <MediaFilterTabs value={quickFilter} onChange={setQuickFilter} />
                <MediaSortSelect value={sort} onChange={setSort} />
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <MediaTypeFilter value={typeFilter} onChange={setTypeFilter} />
              </div>

              <MediaSubjectChips rows={subjectsSummary} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-24 text-center shadow-sm">
                  <Film className="mb-3 h-14 w-14 text-slate-300" aria-hidden />
                  <p className="text-base font-bold text-slate-800">Sonuç bulunamadı</p>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Filtreleri veya aramayı değiştirmeyi deneyin. Kurs arşivini göstermek için alttaki kutuyu işaretleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((item) => (
                    <MediaContentCard
                      key={item.key}
                      item={item}
                      subscriptionPlan={user?.subscription_plan}
                      onOpen={openItem}
                    />
                  ))}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <RecentlyWatchedPanel items={items} recentTick={recentTick} onPick={openItem} />
                <ProPromoCard />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
