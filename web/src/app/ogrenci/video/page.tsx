"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Course, ContentItem } from "@/lib/api";
import {
  Play, FileDown, Clock, Search, BookOpen, Lock, ChevronRight,
  ChevronDown, Loader2, X, Settings, CheckCircle
} from "lucide-react";

type VideoItem = ContentItem & { course_title?: string; topic_title?: string; topic_id?: number };

type CourseUnit = {
  id: number;
  title: string;
  topics?: { id: number; title: string }[];
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// Video Player bileşeni — kaldığın yerden devam + hız kontrolü
function VideoPlayerModal({
  item,
  token,
  onClose,
}: {
  item: VideoItem;
  token: string | null;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [saved, setSaved] = useState(false);

  // localStorage'dan son izleme konumunu al
  const storageKey = `video_pos_${item.id}`;
  const savedPos = typeof window !== "undefined" ? parseFloat(localStorage.getItem(storageKey) ?? "0") : 0;

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Kaldığı yerden başlat
    const onLoaded = () => {
      if (savedPos > 5) {
        vid.currentTime = savedPos;
      }
    };
    vid.addEventListener("loadedmetadata", onLoaded);
    return () => vid.removeEventListener("loadedmetadata", onLoaded);
  }, [savedPos]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = playbackRate;
  }, [playbackRate]);

  // 5 sn'de bir konumu kaydet
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleTimeUpdate = () => {
      localStorage.setItem(storageKey, String(Math.floor(vid.currentTime)));
    };

    const handleProgress = () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (!token || !item.topic_id) return;
        try {
          await api.updateProgress(token, {
            content_item_id: item.id,
            topic_id: item.topic_id,
            status: "in_progress",
            watch_seconds: Math.floor(vid.currentTime),
          });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } catch {}
      }, 5000);
    };

    vid.addEventListener("timeupdate", handleTimeUpdate);
    vid.addEventListener("timeupdate", handleProgress);
    return () => {
      vid.removeEventListener("timeupdate", handleTimeUpdate);
      vid.removeEventListener("timeupdate", handleProgress);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [token, item.id, item.topic_id, storageKey]);

  // Video bitince "tamamlandı" kaydet
  const handleEnded = useCallback(async () => {
    localStorage.removeItem(storageKey);
    if (!token || !item.topic_id) return;
    try {
      await api.updateProgress(token, {
        content_item_id: item.id,
        topic_id: item.topic_id,
        status: "completed",
      });
    } catch {}
  }, [token, item.id, item.topic_id, storageKey]);

  const isYoutube = item.url?.includes("youtube.com") || item.url?.includes("youtu.be");
  const isVimeo = item.url?.includes("vimeo.com");
  const isEmbed = isYoutube || isVimeo;

  const getEmbedUrl = () => {
    if (!item.url) return "";
    if (isYoutube) {
      const id = item.url.match(/(?:v=|youtu\.be\/)([\w-]+)/)?.[1] ?? "";
      return `https://www.youtube.com/embed/${id}?autoplay=1&start=${Math.floor(savedPos)}`;
    }
    if (isVimeo) {
      const id = item.url.match(/vimeo\.com\/(\d+)/)?.[1] ?? "";
      return `https://player.vimeo.com/video/${id}?autoplay=1#t=${Math.floor(savedPos)}s`;
    }
    return item.url;
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-white text-sm truncate max-w-sm">{item.title}</p>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-teal-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Kaydedildi
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isEmbed && (
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu((p) => !p)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-10 py-1 min-w-[80px]">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setPlaybackRate(s); setShowSpeedMenu(false); }}
                        className={`w-full text-center px-4 py-1.5 text-sm transition-colors ${
                          playbackRate === s
                            ? "text-teal-400 font-semibold"
                            : "text-slate-300 hover:text-white hover:bg-slate-700"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {savedPos > 10 && (
              <span className="text-xs text-amber-400 font-medium">
                {formatDuration(Math.floor(savedPos))} kaldığın yer
              </span>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="aspect-video bg-black">
          {isEmbed ? (
            <iframe
              src={getEmbedUrl()}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : item.url ? (
            <video
              ref={videoRef}
              src={item.url}
              controls
              autoPlay
              onEnded={handleEnded}
              className="w-full h-full"
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <p>Video bağlantısı bulunamadı.</p>
            </div>
          )}
        </div>

        {/* Alt bilgi */}
        <div className="px-5 py-3 bg-slate-800/60 flex items-center gap-4 text-xs text-slate-400">
          {item.topic_title && <span>Konu: <strong className="text-slate-200">{item.topic_title}</strong></span>}
          {item.duration_seconds && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Toplam: {formatDuration(item.duration_seconds)}
            </span>
          )}
          <span className="ml-auto">İlerleme otomatik kaydedilir</span>
        </div>
      </div>
    </div>
  );
}

export default function VideoPage() {
  const { token, user } = useAuth();
  const isPro = user?.subscription_plan && user.subscription_plan !== "free";

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "video" | "pdf">("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null);
  const [topicContent, setTopicContent] = useState<Record<number, VideoItem[]>>({});
  const [topicLoading, setTopicLoading] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.getCourses(token).then((res) => {
      setCourses(res);
    }).catch(() => setCourses([])).finally(() => setLoading(false));
  }, [token]);

  const handleSelectCourse = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setUnits([]);
    setExpandedUnitId(null);
    setTopicContent({});
    if (!token) return;
    setUnitsLoading(true);
    try {
      const res = await api.getCourseUnits(course.id, token);
      setUnits(res as CourseUnit[]);
    } catch {
      setUnits([]);
    }
    setUnitsLoading(false);
  }, [token]);

  const handleExpandUnit = useCallback(async (unit: CourseUnit) => {
    if (expandedUnitId === unit.id) {
      setExpandedUnitId(null);
      return;
    }
    setExpandedUnitId(unit.id);
    if (!token || !unit.topics) return;
    for (const topic of unit.topics) {
      if (topicContent[topic.id]) continue;
      setTopicLoading(topic.id);
      try {
        const content = await api.getTopicContent(topic.id, token);
        setTopicContent((prev) => ({
          ...prev,
          [topic.id]: content.map((item) => ({
            ...item,
            course_title: selectedCourse?.title,
            topic_title: topic.title,
            topic_id: topic.id,
          })),
        }));
      } catch {}
      setTopicLoading(null);
    }
  }, [token, expandedUnitId, topicContent, selectedCourse]);

  return (
    <>
      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          item={activeVideo}
          token={token}
          onClose={() => setActiveVideo(null)}
        />
      )}

      <div className="p-8 lg:p-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Video & PDF</h1>
          <p className="text-slate-600 mt-1">
            Hız ayarlı izleme · Kaldığın yerden devam · PDF not indirme
          </p>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-100 flex items-start gap-3">
          <Settings className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
          <p className="text-sm text-teal-800">
            <strong>Hız ayarı:</strong> Video oynatıcıda 0.5x — 2x arasında hız seçebilirsin. İzleme konumun otomatik kaydedilir, kaldığın yerden devam edersin.
          </p>
        </div>

        <div className="grid lg:grid-cols-[260px,1fr] gap-8">
          {/* Ders listesi */}
          <div>
            <h2 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Dersler</h2>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-slate-400">Ders bulunamadı.</p>
            ) : (
              <div className="space-y-1">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCourse(c)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${
                      selectedCourse?.id === c.id
                        ? "bg-teal-600 text-white font-semibold"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                  >
                    <span className="truncate">{c.title}</span>
                    <span className={`text-xs ml-2 shrink-0 ${selectedCourse?.id === c.id ? "text-teal-200" : "text-slate-400"}`}>
                      %{c.progress_percent ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ünite / içerik */}
          <div>
            {!selectedCourse ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
                <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-500">Bir ders seç</p>
                <p className="text-sm text-slate-400 mt-1">İçeriklere erişmek için soldan bir ders seçin.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 mb-5">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Video veya konu ara..."
                      className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "" | "video" | "pdf")}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Tüm Türler</option>
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                {unitsLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
                ) : units.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">Bu ders için ünite bulunamadı.</div>
                ) : (
                  <div className="space-y-3">
                    {units.map((unit) => (
                      <div key={unit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <button
                          onClick={() => handleExpandUnit(unit)}
                          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-semibold text-slate-900">{unit.title}</span>
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedUnitId === unit.id ? "rotate-180" : ""}`} />
                        </button>

                        {expandedUnitId === unit.id && (
                          <div className="border-t border-slate-100">
                            {(unit.topics ?? []).length === 0 ? (
                              <p className="text-sm text-slate-400 p-5">Bu ünitede konu yok.</p>
                            ) : (
                              (unit.topics ?? []).map((topic) => {
                                const content = (topicContent[topic.id] ?? []).filter((item) =>
                                  (!typeFilter || item.type === typeFilter) &&
                                  (!search || item.title.toLowerCase().includes(search.toLowerCase()))
                                );
                                const isLoadingTopic = topicLoading === topic.id;

                                return (
                                  <div key={topic.id} className="border-t border-slate-50 first:border-0">
                                    <div className="px-5 py-3 bg-slate-50/60">
                                      <p className="text-sm font-semibold text-slate-700">{topic.title}</p>
                                    </div>
                                    {isLoadingTopic ? (
                                      <div className="px-5 py-3"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                                    ) : content.length === 0 ? (
                                      <p className="text-xs text-slate-400 px-5 py-2">İçerik yok.</p>
                                    ) : (
                                      content.map((item) => {
                                        const locked = !item.is_free && !isPro;
                                        const savedPos = parseFloat(localStorage.getItem(`video_pos_${item.id}`) ?? "0");
                                        const hasProgress = savedPos > 5;
                                        return (
                                          <div
                                            key={item.id}
                                            className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors border-t border-slate-50/60 ${locked ? "opacity-60" : ""}`}
                                          >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === "video" ? "bg-teal-100" : "bg-red-100"}`}>
                                                {item.type === "video"
                                                  ? <Play className="w-4 h-4 text-teal-600" />
                                                  : <FileDown className="w-4 h-4 text-red-600" />
                                                }
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                                                <p className="text-xs text-slate-400 flex items-center gap-2">
                                                  {!item.is_free && <span className="text-amber-500 font-semibold">Pro</span>}
                                                  {item.duration_seconds && (
                                                    <span className="inline-flex items-center gap-1">
                                                      <Clock className="w-3 h-3" />
                                                      {formatDuration(item.duration_seconds)}
                                                    </span>
                                                  )}
                                                  {hasProgress && item.type === "video" && (
                                                    <span className="text-teal-600 font-medium">
                                                      {formatDuration(Math.floor(savedPos))} izlendi
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="shrink-0 ml-3">
                                              {locked ? (
                                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                                  <Lock className="w-3.5 h-3.5" /> Pro
                                                </span>
                                              ) : item.url ? (
                                                item.type === "pdf" ? (
                                                  <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors"
                                                  >
                                                    İndir
                                                  </a>
                                                ) : (
                                                  <button
                                                    onClick={() => setActiveVideo({ ...item, topic_id: topic.id })}
                                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
                                                  >
                                                    <Play className="w-3.5 h-3.5" />
                                                    {hasProgress ? "Devam Et" : "İzle"}
                                                  </button>
                                                )
                                              ) : (
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                  <ChevronRight className="w-3.5 h-3.5" /> Yakında
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
