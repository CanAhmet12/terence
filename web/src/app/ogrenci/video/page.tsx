"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Course, ContentItem, getVideoThumbnail } from "@/lib/api";
import { VideoCard } from "@/components/VideoCard";
import { GradientThumbnail } from "@/components/GradientThumbnail";
import { CategoryDropdown, FilterState } from "@/components/CategoryDropdown";
import {
  Play, Search, X, Loader2, ChevronLeft, ChevronRight, Film
} from "lucide-react";

type EnrichedVideo = ContentItem & {
  course_title?: string;
  topic_title?: string;
  topic_id?: number;
  course_id?: number;
  thumbnail?: string | null;
  video?: {
    cdn_url?: string;
    thumbnail_url?: string;
    duration_seconds?: number;
  };
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className ?? ""}`} />;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Video Player Modal (Enhanced)
function VideoPlayerModal({
  video,
  token,
  onClose,
}: {
  video: EnrichedVideo;
  token: string | null;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const storageKey = `video_pos_${video.id}`;
  const savedPos =
    typeof window !== "undefined" ? parseFloat(localStorage.getItem(storageKey) ?? "0") : 0;

  const videoUrl = video.video?.cdn_url || video.url;

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !savedPos) return;

    const onLoaded = () => {
      if (savedPos > 5) vid.currentTime = savedPos;
    };
    vid.addEventListener("loadedmetadata", onLoaded);
    return () => vid.removeEventListener("loadedmetadata", onLoaded);
  }, [savedPos]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = playbackRate;
  }, [playbackRate]);

  const handleEnded = useCallback(async () => {
    localStorage.removeItem(storageKey);
    if (!token || !video.topic_id) return;
    try {
      await api.updateProgress({
        topic_id: video.topic_id,
        completed: true,
      } as Parameters<typeof api.updateProgress>[0]);
    } catch {}
  }, [token, video.id, video.topic_id, storageKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <div className="flex items-center gap-3">
            <Play className="h-5 w-5 text-red-600" fill="currentColor" />
            <p className="max-w-md truncate font-semibold text-white">{video.title}</p>
          </div>
          <div className="flex items-center gap-3">
            {!videoUrl?.includes("youtube") && !videoUrl?.includes("vimeo") && (
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu((p) => !p)}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[80px] rounded-xl border border-slate-700 bg-slate-800 py-1 shadow-lg">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setPlaybackRate(s);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-4 py-1.5 text-center text-sm transition-colors ${
                          playbackRate === s
                            ? "font-semibold text-red-400"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="aspect-video bg-black">
          {videoUrl ? (
            videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
              <iframe
                src={videoUrl.replace("watch?v=", "embed/")}
                className="h-full w-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                onEnded={handleEnded}
                className="h-full w-full"
                controlsList="nodownload"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              Video bulunamadı
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 bg-slate-800/60 px-5 py-3 text-xs text-slate-400">
          {video.topic_title && (
            <span>
              Konu: <strong className="text-slate-200">{video.topic_title}</strong>
            </span>
          )}
          {video.duration_seconds && (
            <span>Süre: {formatDuration(video.duration_seconds)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Horizontal Section Component
function VideoSection({
  title,
  videos,
  onVideoPlay,
  emptyMessage = "İçerik yok",
}: {
  title: string;
  videos: EnrichedVideo[];
  onVideoPlay: (video: EnrichedVideo) => void;
  emptyMessage?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [videos]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (videos.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400">
        <Film className="mx-auto mb-2 h-12 w-12 text-slate-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="group/section relative">
      {/* Section Header */}
      <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>

      {/* Scroll Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white opacity-0 shadow-xl backdrop-blur-sm transition-opacity hover:bg-black/90 group-hover/section:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white opacity-0 shadow-xl backdrop-blur-sm transition-opacity hover:bg-black/90 group-hover/section:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Video Cards */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-4"
      >
        {videos.map((video) => {
          const thumbnail = getVideoThumbnail(video.url, video.video?.thumbnail_url);
          const progress =
            typeof window !== "undefined"
              ? parseFloat(localStorage.getItem(`video_pos_${video.id}`) ?? "0")
              : 0;
          const duration = video.video?.duration_seconds || video.duration_seconds || 0;
          const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

          return (
            <div key={video.id} className="w-64 flex-shrink-0 md:w-80">
              {thumbnail ? (
                <VideoCard
                  id={video.id}
                  title={video.title}
                  thumbnail={thumbnail}
                  duration={duration}
                  progress={progressPercent}
                  instructor={video.course_title}
                  isPro={!video.is_free}
                  locked={!video.is_free}
                  onPlay={() => onVideoPlay(video)}
                />
              ) : (
                <div onClick={() => onVideoPlay(video)} className="cursor-pointer">
                  <GradientThumbnail
                    courseId={video.course_id}
                    videoId={video.id}
                    title={video.title}
                    duration={duration}
                  />
                  <div className="mt-2 px-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">
                      {video.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{video.course_title}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VideoPage() {
  const { token, user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    selectedCourses: [],
    contentType: "all",
    status: "all",
  });
  const [quickFilter, setQuickFilter] = useState<"all" | "continue" | "new" | "pro">("all");
  const [allVideos, setAllVideos] = useState<EnrichedVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<EnrichedVideo | null>(null);

  // Load courses
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getCourses()
      .then((res) => setCourses(Array.isArray(res) ? (res as Course[]) : []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [token]);

  // Load all videos from all courses
  useEffect(() => {
    if (!token || courses.length === 0) return;

    const loadAllVideos = async () => {
      setVideosLoading(true);
      const allVids: EnrichedVideo[] = [];

      for (const course of courses) {
        try {
          const units = await api.getCourseUnits(course.id);
          const unitsArray = Array.isArray(units) ? units : [];

          for (const unit of unitsArray) {
            if (unit.topics && Array.isArray(unit.topics)) {
              for (const topic of unit.topics) {
                try {
                  const content = await api.getTopicContent(topic.id);
                  const contentArray = Array.isArray(content) ? content : [];

                  contentArray.forEach((item) => {
                    if (item.type === "video") {
                      allVids.push({
                        ...(item as Record<string, unknown>),
                        course_title: course.title,
                        topic_title: topic.title,
                        topic_id: topic.id,
                        course_id: course.id,
                      } as EnrichedVideo);
                    }
                  });
                } catch {}
              }
            }
          }
        } catch {}
      }

      setAllVideos(allVids);
      setVideosLoading(false);
    };

    loadAllVideos();
  }, [token, courses]);

  // Filter videos
  const filteredVideos = allVideos.filter((video) => {
    // Search filter
    if (search && !video.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Course filter
    if (
      filters.selectedCourses.length > 0 &&
      !filters.selectedCourses.includes(video.course_id || 0)
    ) {
      return false;
    }

    // Content type filter
    if (filters.contentType !== "all" && video.type !== filters.contentType) {
      return false;
    }

    // Status filter
    if (filters.status !== "all") {
      const progress =
        typeof window !== "undefined"
          ? parseFloat(localStorage.getItem(`video_pos_${video.id}`) ?? "0")
          : 0;
      const duration = video.video?.duration_seconds || video.duration_seconds || 0;

      if (filters.status === "not_started" && progress > 0) return false;
      if (filters.status === "in_progress" && (progress === 0 || progress >= duration - 10))
        return false;
      if (filters.status === "completed" && progress < duration - 10) return false;
    }

    // Quick filter
    if (quickFilter === "continue") {
      const progress =
        typeof window !== "undefined"
          ? parseFloat(localStorage.getItem(`video_pos_${video.id}`) ?? "0")
          : 0;
      if (progress === 0) return false;
    }
    if (quickFilter === "pro" && video.is_free) return false;

    return true;
  });

  // Group videos by course
  const videosByCourse = filteredVideos.reduce(
    (acc, video) => {
      const courseTitle = video.course_title || "Diğer";
      if (!acc[courseTitle]) acc[courseTitle] = [];
      acc[courseTitle].push(video);
      return acc;
    },
    {} as Record<string, EnrichedVideo[]>
  );

  // Continue watching videos
  const continueWatching = filteredVideos
    .filter((v) => {
      const progress =
        typeof window !== "undefined"
          ? parseFloat(localStorage.getItem(`video_pos_${v.id}`) ?? "0")
          : 0;
      return progress > 10;
    })
    .sort((a, b) => {
      const timeA =
        typeof window !== "undefined"
          ? parseInt(localStorage.getItem(`video_last_${a.id}`) ?? "0")
          : 0;
      const timeB =
        typeof window !== "undefined"
          ? parseInt(localStorage.getItem(`video_last_${b.id}`) ?? "0")
          : 0;
      return timeB - timeA;
    })
    .slice(0, 10);

  return (
    <>
      {activeVideo && (
        <VideoPlayerModal video={activeVideo} token={token} onClose={() => setActiveVideo(null)} />
      )}

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-black tracking-tight text-white">
              Video Kütüphanesi
            </h1>
            <p className="text-slate-400">
              Tüm derslerinizi istediğiniz hızda izleyin, kaldığınız yerden devam edin
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Video ara..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-400 backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* Category Dropdown */}
            <CategoryDropdown courses={courses} filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Quick Filters */}
          <div className="mb-8 flex gap-3">
            {[
              { value: "all", label: "Tümü" },
              { value: "continue", label: "İzlemeye Devam Et" },
              { value: "new", label: "Yeni" },
              { value: "pro", label: "PRO" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setQuickFilter(value as typeof quickFilter)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  quickFilter === value
                    ? "bg-red-600 text-white shadow-lg shadow-red-500/25"
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading || videosLoading ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i}>
                  <Skeleton className="mb-4 h-8 w-48" />
                  <div className="flex gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-48 w-64 flex-shrink-0" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Film className="mb-4 h-20 w-20 text-slate-700" />
              <h3 className="mb-2 text-xl font-bold text-white">Video bulunamadı</h3>
              <p className="text-slate-400">
                Filtrelerinizi değiştirmeyi deneyin veya daha sonra tekrar kontrol edin
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Continue Watching */}
              {continueWatching.length > 0 && quickFilter === "all" && (
                <VideoSection
                  title="İzlemeye Devam Et"
                  videos={continueWatching}
                  onVideoPlay={setActiveVideo}
                />
              )}

              {/* Videos by Course */}
              {Object.entries(videosByCourse).map(([courseTitle, videos]) => (
                <VideoSection
                  key={courseTitle}
                  title={courseTitle}
                  videos={videos}
                  onVideoPlay={setActiveVideo}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
