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
          await api.updateProgress({
            topic_id: item.topic_id,
            status: "in_progress",
          } as Parameters<typeof api.updateProgress>[0]);
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
      await api.updateProgress({
        topic_id: item.topic_id,
        completed: true,
      } as Parameters<typeof api.updateProgress>[0]);
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
    api.getCourses().then((res) => {
      setCourses(Array.isArray(res) ? res as Course[] : []);
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
      const res = await api.getCourseUnits(course.id);
      setUnits(Array.isArray(res) ? res as CourseUnit[] : []);
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
        const content = await api.getTopicContent(topic.id);
        const contentArr = Array.isArray(content) ? content : [];
        setTopicContent((prev) => ({
          ...prev,
          [topic.id]: contentArr.map((item) => ({
            ...(item as Record<string, unknown>),
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

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* ── Başlık ── */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Video & PDF</h1>
            <p className="text-slate-500 mt-1 font-medium">
              Hız ayarlı izleme · Kaldığın yerden devam · PDF not indirme
            </p>
          </div>

          {/* ── Bilgi bandı ── */}
          <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
            <Settings className="w-4 h-4 text-indigo-600 shrink-0" />
            <p className="text-sm text-indigo-800">
              <strong>Hız ayarı:</strong> Video oynatıcıda 0.5x – 2x arasında hız seçebilirsin. İzleme konumun otomatik kaydedilir.
            </p>
          </div>

          <div className="grid lg:grid-cols-[280px,1fr] gap-8">

            {/* ── Ders Listesi ── */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Dersler</p>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Ders bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {courses.map((c, i) => {
                    const COVER_GRADIENTS = [
                      "from-indigo-500 to-violet-600",
                      "from-teal-500 to-emerald-600",
                      "from-rose-500 to-pink-600",
                      "from-amber-500 to-orange-600",
                      "from-sky-500 to-blue-600",
                    ];
                    const gradient = COVER_GRADIENTS[i % COVER_GRADIENTS.length];
                    const isSelected = selectedCourse?.id === c.id;
                    const progress = c.completion_percentage ?? c.progress_percent ?? 0;

                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCourse(c)}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                          isSelected
                            ? "bg-indigo-600 shadow-sm shadow-indigo-500/25"
                            : "bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className="text-base">📚</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-slate-800"}`}>
                            {c.title}
                          </p>
                          {progress > 0 && (
                            <div className={`mt-1 h-1 rounded-full ${isSelected ? "bg-white/30" : "bg-slate-100"} overflow-hidden`}>
                              <div
                                className={`h-full rounded-full ${isSelected ? "bg-white" : "bg-indigo-500"}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                          %{Math.round(progress)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── İçerik Alanı ── */}
            <div>
              {!selectedCourse ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
                    <BookOpen className="w-10 h-10 text-indigo-300" />
                  </div>
                  <p className="font-bold text-slate-700 text-lg">Bir ders seç</p>
                  <p className="text-sm text-slate-400 mt-1.5 max-w-xs text-center">
                    Soldan bir ders seçerek video ve PDF içeriklerine ulaş
                  </p>
                </div>
              ) : (
                <>
                  {/* Filtre bar */}
                  <div className="flex flex-wrap gap-3 mb-5">
                    <div className="flex-1 min-w-[220px] relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Video veya konu ara..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all shadow-sm"
                      />
                    </div>
                    {["", "video", "pdf"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t as "" | "video" | "pdf")}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          typeFilter === t
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t === "" ? "Tümü" : t === "video" ? "▶ Video" : "📄 PDF"}
                      </button>
                    ))}
                  </div>

                  {/* Üniteler */}
                  {unitsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
                    </div>
                  ) : units.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400">
                      Bu ders için ünite bulunamadı.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {units.map((unit) => (
                        <div key={unit.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                          {/* Ünite başlığı */}
                          <button
                            onClick={() => handleExpandUnit(unit)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-black text-indigo-600">{units.indexOf(unit) + 1}</span>
                              </div>
                              <span className="font-bold text-slate-900">{unit.title}</span>
                              {unit.topics && (
                                <span className="text-xs text-slate-400 font-medium">{unit.topics.length} konu</span>
                              )}
                            </div>
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedUnitId === unit.id ? "rotate-180" : ""}`} />
                          </button>

                          {/* Konu listesi */}
                          {expandedUnitId === unit.id && (
                            <div className="border-t border-slate-100">
                              {(unit.topics ?? []).map((topic) => {
                                const content = (topicContent[topic.id] ?? []).filter((item) =>
                                  (!typeFilter || item.type === typeFilter) &&
                                  (!search || item.title.toLowerCase().includes(search.toLowerCase()))
                                );
                                const isLoadingTopic = topicLoading === topic.id;

                                return (
                                  <div key={topic.id} className="border-t border-slate-50 first:border-0">
                                    {/* Konu başlığı */}
                                    <div className="px-5 py-3 bg-slate-50/60 flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                      </div>
                                      <p className="text-sm font-semibold text-slate-700">{topic.title}</p>
                                    </div>

                                    {isLoadingTopic ? (
                                      <div className="flex items-center gap-2 px-5 py-3 text-sm text-slate-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Yükleniyor...
                                      </div>
                                    ) : content.length === 0 ? (
                                      <p className="text-xs text-slate-400 px-5 py-2.5">İçerik yok.</p>
                                    ) : (
                                      content.map((item) => {
                                        const locked = !item.is_free && !isPro;
                                        const savedPos = typeof window !== "undefined" ? parseFloat(localStorage.getItem(`video_pos_${item.id}`) ?? "0") : 0;
                                        const hasProgress = savedPos > 5;

                                        return (
                                          <div
                                            key={item.id}
                                            className={`flex items-center gap-4 px-5 py-3.5 border-t border-slate-50/80 transition-colors ${
                                              locked ? "opacity-60" : "hover:bg-slate-50/50"
                                            }`}
                                          >
                                            {/* Tip ikonu */}
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                              item.type === "video" ? "bg-indigo-100" : "bg-rose-100"
                                            }`}>
                                              {item.type === "video"
                                                ? <Play className="w-4 h-4 text-indigo-600" />
                                                : <FileDown className="w-4 h-4 text-rose-600" />
                                              }
                                            </div>

                                            {/* İçerik bilgisi */}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                                {!item.is_free && (
                                                  <span className="text-amber-500 font-bold">PRO</span>
                                                )}
                                                {item.duration_seconds && (
                                                  <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDuration(item.duration_seconds)}
                                                  </span>
                                                )}
                                                {hasProgress && item.type === "video" && (
                                                  <span className="text-indigo-600 font-semibold">
                                                    {formatDuration(Math.floor(savedPos))} izlendi
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            {/* Aksiyon */}
                                            <div className="shrink-0">
                                              {locked ? (
                                                <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200">
                                                  <Lock className="w-3 h-3" /> Pro
                                                </span>
                                              ) : item.url ? (
                                                item.type === "pdf" ? (
                                                  <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition-colors border border-rose-200"
                                                  >
                                                    <FileDown className="w-3.5 h-3.5" />
                                                    İndir
                                                  </a>
                                                ) : (
                                                  <button
                                                    onClick={() => setActiveVideo({ ...item, topic_id: topic.id })}
                                                    className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-bold transition-colors ${
                                                      hasProgress
                                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/25"
                                                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                                                    }`}
                                                  >
                                                    <Play className="w-3.5 h-3.5" fill={hasProgress ? "white" : "currentColor"} />
                                                    {hasProgress ? "Devam Et" : "İzle"}
                                                  </button>
                                                )
                                              ) : (
                                                <span className="text-xs text-slate-400 px-3 py-1.5">Yakında</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                );
                              })}
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
      </div>
    </>
  );
}
