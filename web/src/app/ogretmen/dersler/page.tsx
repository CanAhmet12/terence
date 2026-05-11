"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Course, CourseUnit, CourseTopic, ContentItem } from "@/lib/api";
import { BookOpen, ChevronDown, ChevronRight, Play, FileText, RefreshCw, BarChart3, AlertCircle } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function getTopicItems(topic: CourseTopic): ContentItem[] {
  const ext = topic as CourseTopic & { content_items?: ContentItem[] };
  return ext.contentItems ?? ext.content_items ?? [];
}

/** Öğretmen görünümünde en az bir video veya PDF içerik var mı */
function topicHasMediaContent(topic: CourseTopic): boolean {
  return getTopicItems(topic).some((it) => it.type === "video" || it.type === "pdf");
}

function contentCoveragePercent(topics: CourseTopic[]): number {
  if (topics.length === 0) return 0;
  const withContent = topics.filter(topicHasMediaContent).length;
  return Math.round((withContent / topics.length) * 100);
}

export default function OgretmenDerslerPage() {
  const { token } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [openUnitId, setOpenUnitId] = useState<number | null>(null);

  const loadCourses = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCourses();
      const list = Array.isArray(res) ? (res as Course[]) : [];
      setCourses(list);
      if (list.length > 0) setSelectedCourseId(list[0].id);
      else setSelectedCourseId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dersler yüklenemedi.");
      setCourses([]);
      setSelectedCourseId(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadUnits = useCallback(async (courseId: number) => {
    setLoadingUnits(true);
    setUnitsError(null);
    try {
      const list = await api.getCourseUnits(courseId);
      setUnits(Array.isArray(list) ? list : []);
      if (list.length > 0) setOpenUnitId(list[0].id);
      else setOpenUnitId(null);
    } catch (err: unknown) {
      setUnits([]);
      setOpenUnitId(null);
      setUnitsError(err instanceof Error ? err.message : "Ünite ve konular yüklenemedi.");
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourseId != null) void loadUnits(selectedCourseId);
  }, [selectedCourseId, loadUnits]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const allTopics = units.flatMap((u) => u.topics ?? []);
  const overallContentPct = contentCoveragePercent(allTopics);

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full min-w-0 overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Derslerim</h1>
            <p className="text-slate-500 mt-1 font-medium">Kurs kataloğu · Ünite ve konu · Video/PDF içerik özeti</p>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Öğrenci çözüm ilerlemesi bu listede yer almaz; öğrenci panelindeki müfredat ve kurs kaydıyla ilişkilidir.
            </p>
          </div>
          <Link
            href="/ogretmen/icerik"
            className="flex shrink-0 items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm shadow-indigo-500/25"
          >
            + İçerik Ekle
          </Link>
        </div>

        {loading ? (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
            <div className="lg:col-span-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              type="button"
              onClick={loadCourses}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <RefreshCw className="w-4 h-4" /> Yenile
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-8 h-8 text-indigo-300" />
            </div>
            <p className="font-bold text-slate-700 text-lg">Henüz ders eklenmemiş</p>
            <Link
              href="/ogretmen/icerik"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              İçerik ekle <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Dersler</p>
              {courses.map((c) => {
                const isSelected = selectedCourseId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCourseId(c.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-300 shadow-sm"
                        : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-indigo-100" : "bg-slate-100"}`}
                      >
                        <BookOpen className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-500"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${isSelected ? "text-indigo-800" : "text-slate-800"}`}>{c.title}</p>
                        <p className="text-[11px] text-slate-400">{c.units_count ?? "?"} ünite · Katalog</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-3">
              {selectedCourse && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-bold text-slate-900">{selectedCourse.title}</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${overallContentPct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-indigo-600">%{overallContentPct}</span>
                      <span className="text-[11px] text-slate-500 font-medium">konuda içerik</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Video/PDF var
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      İçerik yok
                    </span>
                  </div>
                </div>
              )}

              {unitsError && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{unitsError}</span>
                  </div>
                  {selectedCourseId != null && (
                    <button
                      type="button"
                      onClick={() => loadUnits(selectedCourseId)}
                      className="text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tekrar dene
                    </button>
                  )}
                </div>
              )}

              {loadingUnits ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-2xl" />
                  ))}
                </div>
              ) : !unitsError && units.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-500">Bu ders için ünite tanımlanmamış</p>
                  <Link
                    href="/ogretmen/icerik"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    İçerik ekle <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : units.length > 0 ? (
                <div className="space-y-3">
                  {units.map((unit) => {
                    const topics = unit.topics ?? [];
                    const unitContentPct = contentCoveragePercent(topics);
                    const isOpen = openUnitId === unit.id;

                    return (
                      <div key={unit.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenUnitId(isOpen ? null : unit.id)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isOpen ? "bg-indigo-100" : "bg-slate-100"}`}
                            >
                              {isOpen ? (
                                <ChevronDown className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{unit.title}</p>
                              <p className="text-xs text-slate-400">{topics.length} konu</p>
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-3">
                            <div className="w-28">
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${unitContentPct}%` }} />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 text-right">İçerik %{unitContentPct}</p>
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 divide-y divide-slate-50">
                            {topics.map((topic) => {
                              const items = getTopicItems(topic);
                              const hasVideo = items.some((it) => it.type === "video");
                              const hasPdf = items.some((it) => it.type === "pdf");
                              const hasMedia = hasVideo || hasPdf;
                              const statusDot = hasMedia ? "bg-emerald-500" : "bg-slate-300";
                              return (
                                <div
                                  key={topic.id}
                                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                                >
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot}`} title={hasMedia ? "Video veya PDF içerik var" : "Bu konuda video/PDF yok"} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-slate-900 text-sm">{topic.title}</span>
                                      {topic.kazanim_code && (
                                        <span className="font-mono text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                          {topic.kazanim_code}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                                    {hasVideo ? (
                                      <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold border border-indigo-100">
                                        <Play className="w-3 h-3" /> Video
                                      </span>
                                    ) : (
                                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                                        Video yok
                                      </span>
                                    )}
                                    {hasPdf ? (
                                      <span className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-600 rounded-lg text-xs font-semibold border border-sky-100">
                                        <FileText className="w-3 h-3" /> PDF
                                      </span>
                                    ) : (
                                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                                        PDF yok
                                      </span>
                                    )}
                                    <Link
                                      href={`/ogretmen/analiz?course=${encodeURIComponent(selectedCourse?.slug ?? "")}&topic=${topic.id}`}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                                    >
                                      <BarChart3 className="w-3 h-3" /> Analiz
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
