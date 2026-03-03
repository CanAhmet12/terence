"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Course, ContentItem } from "@/lib/api";
import { Play, FileDown, Clock, Search, BookOpen, Lock, ChevronRight } from "lucide-react";

type VideoItem = ContentItem & { course_title?: string; topic_title?: string };

const DEMO_VIDEOS: VideoItem[] = [
  { id: 1, topic_id: 1, type: "video", title: "Üslü İfadeler — Konu Anlatımı", course_title: "Matematik", topic_title: "Üslü İfadeler", duration_seconds: 754, order: 1, is_free: true, url: "#" },
  { id: 2, topic_id: 1, type: "pdf", title: "Üslü İfadeler — PDF Notlar", course_title: "Matematik", topic_title: "Üslü İfadeler", order: 2, is_free: true, url: "#" },
  { id: 3, topic_id: 2, type: "video", title: "Hareket Denklemleri — Konu Anlatımı", course_title: "Fizik", topic_title: "Hareket", duration_seconds: 1090, order: 1, is_free: true, url: "#" },
  { id: 4, topic_id: 3, type: "video", title: "Paragraf Yorumu — Teknik ve Örnekler", course_title: "Türkçe", topic_title: "Paragraf", duration_seconds: 920, order: 1, is_free: false },
];

const DEMO_COURSES: Course[] = [
  { id: 1, title: "Matematik", slug: "matematik", progress_percent: 65, is_free: true },
  { id: 2, title: "Fizik", slug: "fizik", progress_percent: 40, is_free: true },
  { id: 3, title: "Türkçe", slug: "turkce", progress_percent: 80, is_free: true },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPage() {
  const { token, user } = useAuth();
  const isDemo = token?.startsWith("demo-token-");
  const isPro = user?.subscription_plan && user.subscription_plan !== "free";

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "video" | "pdf">("");
  const [courseFilter, setCourseFilter] = useState("");

  const loadData = useCallback(async () => {
    if (isDemo) {
      setVideos(DEMO_VIDEOS);
      setCourses(DEMO_COURSES);
      setLoading(false);
      return;
    }
    try {
      const coursesRes = await api.getCourses();
      setCourses(coursesRes.data);
      // Tüm kursların içeriklerini yükle (ilk 3 kurs)
      const allContent: VideoItem[] = [];
      await Promise.allSettled(
        coursesRes.data.slice(0, 6).map(async (course) => {
          const unitsRes = await api.getCourseUnits(course.slug, token ?? undefined);
          for (const unit of unitsRes.slice(0, 3)) {
            for (const topic of (unit.topics ?? []).slice(0, 3)) {
              const content = await api.getTopicContent(topic.id, token ?? undefined);
              content.forEach((item) =>
                allContent.push({ ...item, course_title: course.title, topic_title: topic.title })
              );
            }
          }
        })
      );
      setVideos(allContent);
    } catch {
      setVideos(DEMO_VIDEOS);
      setCourses(DEMO_COURSES);
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = videos.filter((v) => {
    const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.course_title?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || v.type === typeFilter;
    const matchCourse = !courseFilter || v.course_title === courseFilter;
    return matchSearch && matchType && matchCourse;
  });

  const inProgressVideos = videos.filter((v) => v.type === "video" && v.is_free);

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Video & PDF</h1>
        <p className="text-slate-600 mt-1">
          Hız ayarlı izleme · Kaldığın yerden devam · PDF not indirme
        </p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
      </div>

      {/* Hız ayarı bilgi */}
      <div className="mb-8 p-4 rounded-xl bg-teal-50 border border-teal-100">
        <p className="text-sm text-teal-800">
          <strong>Hız ayarı:</strong> Video oynatıcıda 0.5x, 1x, 1.25x, 1.5x, 2x hız seçenekleri mevcuttur. İlerleme otomatik kaydedilir.
        </p>
      </div>

      {/* Kaldığın yerden devam */}
      {!loading && inProgressVideos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Kaldığın Yerden Devam Et</h2>
          <div className="space-y-3">
            {inProgressVideos.slice(0, 3).map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <Play className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{v.title}</h3>
                    <p className="text-sm text-slate-500">
                      {v.course_title} · {v.duration_seconds ? formatDuration(v.duration_seconds) : "—"}
                    </p>
                    {v.duration_seconds && (
                      <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden w-full max-w-[200px]">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: "0%" }} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {v.url && v.url !== "#" ? (
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      İzle
                    </a>
                  ) : (
                    <Link
                      href={`/ogrenci/dersler/${v.course_title?.toLowerCase() ?? "matematik"}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Derse Git
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Video veya ders ara..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
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
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
        >
          <option value="">Tüm Dersler</option>
          {courses.map((c) => (
            <option key={c.id} value={c.title}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* İçerik listesi */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {typeFilter === "pdf" ? "PDF Notlar" : typeFilter === "video" ? "Videolar" : "Tüm İçerikler"}
          {!loading && <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length})</span>}
        </h2>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">İçerik bulunamadı</p>
            <p className="text-sm text-slate-500 mt-1">Filtreleri değiştirmeyi deneyin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const locked = !item.is_free && !isPro;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-shadow ${
                    locked ? "border-slate-200 opacity-70" : "border-slate-200 hover:shadow-md hover:border-teal-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === "video" ? "bg-teal-100" : "bg-red-100"
                      }`}>
                        {item.type === "video" ? (
                          <Play className="w-5 h-5 text-teal-600" />
                        ) : (
                          <FileDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                          {!item.is_free && (
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pro</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {item.course_title}
                          {item.topic_title && ` · ${item.topic_title}`}
                          {item.duration_seconds && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(item.duration_seconds)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {locked ? (
                        <Link
                          href="/#paketler"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
                        >
                          <Lock className="w-4 h-4" />
                          Kilidi Aç
                        </Link>
                      ) : item.url && item.url !== "#" ? (
                        item.type === "pdf" ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                          >
                            <FileDown className="w-4 h-4" />
                            PDF İndir
                          </a>
                        ) : (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            İzle
                          </a>
                        )
                      ) : (
                        <Link
                          href={`/ogrenci/dersler/${item.course_title?.toLowerCase() ?? "matematik"}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Derse Git
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ders bazlı hızlı erişim */}
      {!loading && courses.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Derslere Göre</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/ogrenci/dersler/${c.slug}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-teal-200 transition-all flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{c.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">%{c.progress_percent ?? 0} tamamlandı</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
