"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Course, Unit } from "@/lib/api";
import { BookOpen, ChevronDown, ChevronRight, Play, FileText, RefreshCw, BarChart3 } from "lucide-react";

// Demo ders verisi
const DEMO_COURSES: Course[] = [
  { id: 1, title: "Matematik", slug: "matematik", exam_type: "TYT", units_count: 5, progress_percent: 72, is_free: true },
  { id: 2, title: "Fizik", slug: "fizik", exam_type: "TYT", units_count: 3, progress_percent: 55, is_free: true },
];

const DEMO_UNITS: Record<string, Unit[]> = {
  matematik: [
    {
      id: 1, course_id: 1, title: "Sayılar ve Cebir", order: 1,
      topics: [
        { id: 1, unit_id: 1, title: "Üslü İfadeler", kazanim_code: "M.10.1.1", kazanim_desc: "Üslü ifadeleri tanır ve hesaplar", order: 1, progress: "completed" },
        { id: 2, unit_id: 1, title: "Köklü İfadeler", kazanim_code: "M.10.1.2", kazanim_desc: "Köklü sayıları hesaplar", order: 2, progress: "in_progress" },
        { id: 3, unit_id: 1, title: "Denklemler", kazanim_code: "M.10.1.3", kazanim_desc: "Birinci dereceden denklemleri çözer", order: 3, progress: "not_started" },
      ],
    },
    {
      id: 2, course_id: 1, title: "Fonksiyonlar", order: 2,
      topics: [
        { id: 4, unit_id: 2, title: "Fonksiyon Tanımı", kazanim_code: "M.10.2.1", kazanim_desc: "Fonksiyon kavramını açıklar", order: 1, progress: "in_progress" },
        { id: 5, unit_id: 2, title: "Bileşke Fonksiyon", kazanim_code: "M.10.2.2", kazanim_desc: "Bileşke fonksiyon hesaplar", order: 2, progress: "not_started" },
      ],
    },
  ],
  fizik: [
    {
      id: 3, course_id: 2, title: "Kuvvet ve Hareket", order: 1,
      topics: [
        { id: 6, unit_id: 3, title: "Newton Yasaları", kazanim_code: "F.11.1.1", kazanim_desc: "Newton'un hareket yasalarını uygular", order: 1, progress: "completed" },
        { id: 7, unit_id: 3, title: "Sürtünme Kuvveti", kazanim_code: "F.11.1.2", kazanim_desc: "Sürtünme kuvvetini hesaplar", order: 2, progress: "in_progress" },
      ],
    },
  ],
};

const PROGRESS_COLOR: Record<string, string> = {
  completed: "bg-teal-500",
  in_progress: "bg-amber-500",
  not_started: "bg-slate-200",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function OgretmenDerslerPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(null);
  const [openUnitId, setOpenUnitId] = useState<number | null>(null);

  const loadCourses = useCallback(async () => {
    if (isDemo || !token) {
      setCourses(DEMO_COURSES);
      setSelectedCourseSlug("matematik");
      setLoading(false);
      return;
    }
    try {
      const res = await api.getCourses();
      setCourses(res.data);
      if (res.data.length > 0) setSelectedCourseSlug(res.data[0].slug);
    } catch {
      setCourses(DEMO_COURSES);
      setSelectedCourseSlug("matematik");
    }
    setLoading(false);
  }, [token, isDemo]);

  const loadUnits = useCallback(async (slug: string) => {
    setLoadingUnits(true);
    if (isDemo) {
      setUnits(DEMO_UNITS[slug] ?? []);
      setOpenUnitId(DEMO_UNITS[slug]?.[0]?.id ?? null);
      setLoadingUnits(false);
      return;
    }
    try {
      const res = await api.getCourseUnits(slug, token ?? undefined);
      setUnits(res);
      if (res.length > 0) setOpenUnitId(res[0].id);
    } catch {
      setUnits(DEMO_UNITS[slug] ?? []);
    }
    setLoadingUnits(false);
  }, [token, isDemo]);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => {
    if (selectedCourseSlug) loadUnits(selectedCourseSlug);
  }, [selectedCourseSlug, loadUnits]);

  const selectedCourse = courses.find((c) => c.slug === selectedCourseSlug);

  // Tüm öğrenci ilerleme ortalaması (konu progress bazlı)
  const allTopics = units.flatMap((u) => u.topics ?? []);
  const completedTopics = allTopics.filter((t) => t.progress === "completed").length;
  const overallPct = allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0;

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Derslerim</h1>
          <p className="text-slate-600 mt-1">Ünite → Konu → Kazanım · Sınıf bazlı ilerleme · İçerik durumu</p>
        </div>
        <Link
          href="/ogretmen/icerik"
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          + İçerik Ekle
        </Link>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          <div className="lg:col-span-3 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Ders listesi */}
          <div className="space-y-2">
            {courses.map((c) => {
              const pct = c.progress_percent ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseSlug(c.slug)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedCourseSlug === c.slug
                      ? "bg-teal-50 border-teal-200 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.units_count ?? "?"} ünite</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">%{pct} tamamlandı</p>
                </button>
              );
            })}
          </div>

          {/* Ünite-Konu-Kazanım */}
          <div className="lg:col-span-3">
            {selectedCourse && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-slate-900 text-lg">{selectedCourse.title}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${overallPct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-teal-600">%{overallPct}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Tamamlandı</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Devam</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200" /> Başlanmadı</div>
                </div>
              </div>
            )}

            {loadingUnits ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : units.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Bu ders için ünite tanımlanmamış</p>
                <Link href="/ogretmen/icerik" className="mt-3 inline-block text-sm text-teal-600 hover:underline font-semibold">
                  İçerik ekle →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {units.map((unit) => {
                  const topics = unit.topics ?? [];
                  const unitCompleted = topics.filter((t) => t.progress === "completed").length;
                  const unitPct = topics.length > 0 ? Math.round((unitCompleted / topics.length) * 100) : 0;
                  const isOpen = openUnitId === unit.id;

                  return (
                    <div key={unit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => setOpenUnitId(isOpen ? null : unit.id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{unit.title}</p>
                            <p className="text-xs text-slate-500">{topics.length} konu</p>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                          <div className="w-32">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${unitPct}%` }} />
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 text-right">Öğrenci ort. %{unitPct}</p>
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 divide-y divide-slate-50">
                          {topics.map((topic) => {
                            const progColor = PROGRESS_COLOR[topic.progress ?? "not_started"];
                            return (
                              <div key={topic.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${progColor}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-slate-900 text-sm">{topic.title}</span>
                                    {topic.kazanim_code && (
                                      <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                                        {topic.kazanim_code}
                                      </span>
                                    )}
                                  </div>
                                  {topic.kazanim_desc && (
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{topic.kazanim_desc}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-600 rounded-lg text-xs font-medium">
                                    <Play className="w-3 h-3" /> Video
                                  </span>
                                  <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                                    <FileText className="w-3 h-3" /> PDF
                                  </span>
                                  <Link
                                    href={`/ogretmen/analiz?konu=${topic.kazanim_code ?? topic.id}`}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 transition-colors"
                                    title="Konu analizini gör"
                                  >
                                    <BarChart3 className="w-3 h-3" /> Analiz
                                  </Link>
                                  <button
                                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs hover:bg-amber-100 transition-colors"
                                    title="Tekrar planına ekle"
                                  >
                                    <RefreshCw className="w-3 h-3" /> Tekrar
                                  </button>
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
