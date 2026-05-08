"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, CurriculumSubject, CurriculumUnit, CurriculumTopic } from "@/lib/api";
import {
  ChevronRight,
  Search,
  CheckCircle,
  BookOpen,
  Loader2,
  GraduationCap,
  Play,
  FileText,
  Menu,
  X,
  Home,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_COLORS } from "@/components/ogrenci/dersler/constants";
import {
  partitionCurriculumSubjects,
  examSubjectMatchesChip,
  type CurriculumBucket,
} from "@/components/ogrenci/dersler/curriculumBuckets";
import { CurriculumBucketTabs, ExamFilterChips } from "@/components/ogrenci/dersler/CurriculumBucketTabs";
import { VideoPanel } from "@/components/ogrenci/dersler/VideoPanel";
import { PdfPanel } from "@/components/ogrenci/dersler/PdfPanel";
import { TopicHero } from "@/components/ogrenci/dersler/TopicHero";
import { TopicKpiStrip } from "@/components/ogrenci/dersler/TopicKpiStrip";
import { TopicAbout } from "@/components/ogrenci/dersler/TopicAbout";
import { TopicContentList, type ContentListItem } from "@/components/ogrenci/dersler/TopicContentList";
import { UnitAccordion } from "@/components/ogrenci/dersler/UnitAccordion";

export default function DerslerimPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [unitsBySlug, setUnitsBySlug] = useState<Record<string, CurriculumUnit[]>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [bucketTab, setBucketTab] = useState<CurriculumBucket>("school");
  const [examChip, setExamChip] = useState<string>("ALL");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [examSearch, setExamSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [activeSubject, setActiveSubject] = useState<CurriculumSubject | null>(null);
  const [activeUnit, setActiveUnit] = useState<CurriculumUnit | null>(null);
  const [activeTopic, setActiveTopic] = useState<CurriculumTopic | null>(null);
  const [activeContent, setActiveContent] = useState<ContentListItem | null>(null);
  const [contentItems, setContentItems] = useState<ContentListItem[]>([]);
  const [contentFilter, setContentFilter] = useState<"all" | "video" | "pdf">("all");

  const gradeStr = user?.grade != null ? String(user.grade) : undefined;
  const examStr = user?.target_exam ?? user?.exam_goal ?? undefined;
  const hasGrade = !!gradeStr && gradeStr !== "null" && gradeStr !== "";
  const activeColor = SUBJECT_COLORS[activeSubject?.name ?? ""] ?? activeSubject?.color ?? "#6366f1";

  const { school: schoolSubjects, exam: examSubjects } = useMemo(() => partitionCurriculumSubjects(subjects), [subjects]);

  const toolbarSearch = bucketTab === "school" ? schoolSearch : examSearch;
  const setToolbarSearch = (v: string) => {
    if (bucketTab === "school") setSchoolSearch(v);
    else setExamSearch(v);
  };

  const filteredSubjects = useMemo(() => {
    const pool = bucketTab === "school" ? schoolSubjects : examSubjects.filter((s) => examSubjectMatchesChip(s.exam_type, examChip));
    const q = (bucketTab === "school" ? schoolSearch : examSearch).trim().toLowerCase();
    return pool.filter((s) => (q ? s.name.toLowerCase().includes(q) : true));
  }, [bucketTab, schoolSubjects, examSubjects, examChip, schoolSearch, examSearch]);

  const loadSubjects = useCallback(async () => {
    if (!user || !hasGrade) return;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await api.getCurriculum();
      setSubjects(Array.isArray(res?.subjects) ? res.subjects : []);
    } catch (e) {
      setListError((e as Error).message || "Ders listesi yüklenemedi.");
      setSubjects([]);
    } finally {
      setLoadingList(false);
    }
  }, [user, hasGrade]);

  useEffect(() => {
    if (!authLoading) loadSubjects();
  }, [authLoading, loadSubjects]);

  useEffect(() => {
    const ex = (examStr ?? "").toUpperCase();
    if (ex.includes("TYT")) setExamChip("TYT");
    else if (ex.includes("AYT")) setExamChip("AYT");
    else if (ex.includes("LGS")) setExamChip("LGS");
    else if (ex.includes("KPSS")) setExamChip("KPSS");
    else setExamChip("ALL");
  }, [examStr]);

  useEffect(() => {
    const pool =
      bucketTab === "school" ? schoolSubjects : examSubjects.filter((s) => examSubjectMatchesChip(s.exam_type, examChip));
    if (activeSubject && !pool.some((s) => s.slug === activeSubject.slug)) {
      setActiveSubject(null);
      setActiveUnit(null);
      setActiveTopic(null);
      setActiveContent(null);
      setContentItems([]);
    }
  }, [bucketTab, examChip, schoolSubjects, examSubjects, activeSubject]);

  const loadUnits = useCallback(
    async (slug: string): Promise<CurriculumUnit[]> => {
      if (slug in unitsBySlug) {
        return unitsBySlug[slug] ?? [];
      }
      setLoadingSlug(slug);
      try {
        const res = await api.getCurriculumSubject(slug);
        const list = Array.isArray(res.units) ? res.units : [];
        setUnitsBySlug((p) => ({ ...p, [slug]: list }));
        return list;
      } catch {
        setUnitsBySlug((p) => ({ ...p, [slug]: [] }));
        setListError("Ünite ve konular yüklenirken bir sorun oluştu. Aşağıdan yenileyebilirsiniz.");
        return [];
      } finally {
        setLoadingSlug(null);
      }
    },
    [unitsBySlug],
  );

  const handleSubjectSelect = async (subject: CurriculumSubject) => {
    setActiveSubject(subject);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    const units = await loadUnits(subject.slug);
    if (units.length > 0) {
      const firstUnit = units[0];
      setActiveUnit(firstUnit);
      if (firstUnit.topics && firstUnit.topics.length > 0) {
        handleTopicSelect(firstUnit.topics[0], firstUnit);
      }
    }
  };

  const handleTopicSelect = (topic: CurriculumTopic, unit: CurriculumUnit) => {
    setActiveTopic(topic);
    setActiveUnit(unit);
    setContentFilter("all");
    const raw = topic.content_items ?? [];
    const items = raw as ContentListItem[];
    setContentItems(items);
    if (items.length > 0) {
      setActiveContent(items[0]);
    } else {
      setActiveContent(null);
    }
  };

  const handleTopicComplete = async () => {
    if (!activeTopic || !activeSubject) return;

    try {
      await api.updateCurriculumProgress(activeTopic.id, "completed");

      setUnitsBySlug((prev) => {
        const units = prev[activeSubject.slug] ?? [];
        return {
          ...prev,
          [activeSubject.slug]: units.map((u) => ({
            ...u,
            topics: u.topics.map((t) => (t.id === activeTopic.id ? { ...t, status: "completed" as const } : t)),
            completed_topics:
              u.id === activeUnit?.id
                ? u.topics.filter((t) => (t.id === activeTopic.id ? true : t.status === "completed")).length
                : u.completed_topics,
            progress_percent:
              u.id === activeUnit?.id
                ? Math.round(
                    (u.topics.filter((t) => (t.id === activeTopic.id ? true : t.status === "completed")).length / u.total_topics) * 100,
                  )
                : u.progress_percent,
          })),
        };
      });

      setActiveTopic((prev) => (prev ? { ...prev, status: "completed" as const } : prev));

      if (activeUnit) {
        const currentIndex = activeUnit.topics.findIndex((t) => t.id === activeTopic.id);
        if (currentIndex < activeUnit.topics.length - 1) {
          const nextTopic = activeUnit.topics[currentIndex + 1];
          handleTopicSelect(nextTopic, activeUnit);
        } else {
          const units = unitsBySlug[activeSubject.slug] ?? [];
          const unitIndex = units.findIndex((u) => u.id === activeUnit.id);
          if (unitIndex < units.length - 1) {
            const nextUnit = units[unitIndex + 1];
            if (nextUnit.topics.length > 0) {
              handleTopicSelect(nextUnit.topics[0], nextUnit);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to complete topic:", error);
    }
  };

  const scrollToLessonOverview = () => {
    if (typeof document === "undefined") return;
    document.getElementById("ders-icerik-alani")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!hasGrade) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Müfredatın ayarlanmamış.</p>
          <button
            type="button"
            onClick={() => router.push("/ogrenci/onboarding")}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Müfredatı Ayarla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col bg-[#f6f5fb] lg:max-h-[calc(100dvh-7rem)] lg:min-h-0 lg:overflow-hidden">
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur-sm sm:h-16 sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Home className="h-4 w-4" aria-hidden />
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden />
            <span className="font-semibold text-slate-900">Derslerim</span>
            {activeSubject && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden />
                <span className="hidden sm:inline">{activeSubject.name}</span>
              </>
            )}
            {activeTopic && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden />
                <span className="hidden md:inline max-w-xs truncate">{activeTopic.title}</span>
              </>
            )}
          </div>
        </div>

        <div className="mx-4 hidden max-w-md flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              placeholder={bucketTab === "school" ? "Sınıf derslerinde ara..." : "Sınav derslerinde ara..."}
              value={toolbarSearch}
              onChange={(e) => setToolbarSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              aria-label="Ders ara"
            />
            {toolbarSearch && (
              <button type="button" onClick={() => setToolbarSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gradeStr && examStr && (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-900 ring-1 ring-violet-100">
                {gradeStr === "mezun" ? "Mezun" : `${gradeStr}. Sınıf`}
              </div>
              <div className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-900 ring-1 ring-violet-200/60">{examStr}</div>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <aside
          className={cn(
            "flex w-80 max-w-[min(100vw-1.5rem,20rem)] shrink-0 flex-col overflow-hidden border-r border-slate-200/90 bg-white transition-transform duration-300 ease-in-out",
            "fixed inset-y-0 left-0 z-40 shadow-xl lg:static lg:z-0 lg:h-auto lg:max-h-[calc(100dvh-8rem)] lg:shadow-none",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
          id={bucketTab === "school" ? "panel-bucket-school" : "panel-bucket-exam"}
          role="tabpanel"
          aria-labelledby={bucketTab === "school" ? "tab-bucket-school" : "tab-bucket-exam"}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-100 bg-gradient-to-b from-white to-violet-50/40 p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-violet-600" aria-hidden />
                  <h2 className="text-lg font-bold text-slate-900">Derslerim</h2>
                </div>
                <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/80 lg:hidden">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {gradeStr && examStr && (
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-900 ring-1 ring-violet-100">
                    {gradeStr === "mezun" ? "Mezun" : `${gradeStr}. Sınıf`}
                  </div>
                  <div className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 ring-1 ring-violet-200/70">{examStr}</div>
                </div>
              )}
              <CurriculumBucketTabs value={bucketTab} onChange={setBucketTab} />
              {bucketTab === "exam" && <ExamFilterChips value={examChip} onChange={setExamChip} />}
            </div>

            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  placeholder={bucketTab === "school" ? "Sınıf dersinde ara..." : "Sınav dersinde ara..."}
                  value={bucketTab === "school" ? schoolSearch : examSearch}
                  onChange={(e) => (bucketTab === "school" ? setSchoolSearch(e.target.value) : setExamSearch(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  aria-label={bucketTab === "school" ? "Sınıf dersleri araması" : "Sınav dersleri araması"}
                />
              </div>
            </div>

            {listError && (
              <div className="mx-4 mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{listError}</p>
                  <button type="button" onClick={() => loadSubjects()} className="mt-2 inline-flex items-center gap-1 font-bold text-amber-800 underline">
                    <RefreshCw className="h-3 w-3" aria-hidden />
                    Yenile
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {loadingList ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <BookOpen className="h-8 w-8 text-slate-400" aria-hidden />
                  </div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Gösterilecek ders yok</p>
                  <p className="text-xs text-slate-500">
                    Arama veya sınav süzgecini değiştirin
                    <br />
                    veya müfredat henüz eklenmemiş olabilir.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSubjects.map((subject) => {
                    const color = SUBJECT_COLORS[subject.name] ?? subject.color ?? "#6366f1";
                    const isActive = activeSubject?.slug === subject.slug;
                    const unitsLoaded = subject.slug in unitsBySlug;
                    const units = unitsBySlug[subject.slug] ?? [];
                    const totalTopics = units.reduce((sum, u) => sum + u.total_topics, 0);
                    const completedTopics = units.reduce((sum, u) => sum + u.completed_topics, 0);
                    const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

                    return (
                      <div
                        key={subject.slug}
                        className={`rounded-xl border-2 transition-all ${
                          isActive ? "border-violet-200 bg-violet-50/50 shadow-md shadow-violet-100/50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <button type="button" onClick={() => handleSubjectSelect(subject)} className="flex w-full items-center gap-3 p-4 text-left">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-semibold shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                              color,
                            }}
                          >
                            {subject.icon || subject.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="mb-0.5 truncate text-sm font-bold text-slate-900">{subject.name}</p>
                            {loadingSlug === subject.slug ? (
                              <p className="flex items-center gap-1 text-xs text-slate-500">
                                <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
                                Üniteler yükleniyor…
                              </p>
                            ) : !unitsLoaded ? (
                              <p className="text-xs text-slate-400">Konular için dokunun</p>
                            ) : units.length === 0 ? (
                              <p className="text-xs text-amber-700">Bu derste henüz ünite yok</p>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
                                </div>
                                <span className="text-xs font-semibold text-slate-500">{progress}%</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isActive ? "rotate-90" : ""}`} aria-hidden />
                        </button>

                        {isActive && units.length > 0 && (
                          <div className="border-t border-slate-100 bg-white/50 p-2">
                            {units.map((unit) => (
                              <UnitAccordion
                                key={unit.id}
                                unit={unit}
                                color={color}
                                activeTopic={activeTopic}
                                onTopicSelect={(topic) => handleTopicSelect(topic, unit)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f6f5fb] lg:min-h-0">
          {activeTopic ? (
            <div className="container mx-auto max-w-5xl space-y-0 p-4 pb-10 md:p-6 md:pb-12">
              <TopicHero
                topicTitle={activeTopic.title}
                unitTitle={activeUnit?.title}
                subjectName={activeSubject?.name}
                gradeLabel={gradeStr === "mezun" ? "Mezun" : gradeStr ? `${gradeStr}. sınıf` : undefined}
                examLabel={examStr}
                accentColor={activeColor}
                onBack={() => {
                  setActiveTopic(null);
                  setActiveContent(null);
                  setContentItems([]);
                }}
                onOverview={scrollToLessonOverview}
              />

              <TopicKpiStrip items={contentItems} />

              <div id="ders-icerik-alani" className="mt-8 space-y-6 scroll-mt-24 md:mt-10 md:space-y-8">
                <TopicAbout title="Konu hakkında" body={activeTopic.description} />

                <TopicContentList
                  items={contentItems}
                  activeId={activeContent?.id ?? null}
                  onSelect={(item) => setActiveContent(item)}
                  topicTitle={activeTopic.title}
                  mebCode={activeTopic.meb_code}
                  accentColor={activeColor}
                  filter={contentFilter}
                  onFilterChange={setContentFilter}
                />

                <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md ring-1 ring-slate-900/[0.02]">
                  <div className="border-b border-slate-100 px-5 py-4 md:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-bold text-slate-900 md:text-lg">{activeContent?.title || "Önizleme"}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 md:text-sm">
                          <span>{activeUnit?.title}</span>
                          <span aria-hidden>·</span>
                          <span>{activeSubject?.name}</span>
                          {activeContent?.duration_seconds ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" aria-hidden />
                                {Math.round(activeContent.duration_seconds / 60)} dk
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      {activeTopic.status !== "completed" ? (
                        <button
                          type="button"
                          onClick={handleTopicComplete}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden />
                          <span className="hidden sm:inline">Konuyu tamamla</span>
                          <span className="sm:hidden">Tamamla</span>
                        </button>
                      ) : (
                        <div className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white">
                          <CheckCircle className="h-4 w-4" aria-hidden />
                          Tamamlandı
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative h-[min(56vh,520px)] min-h-[220px] bg-slate-950">
                    {activeContent ? (
                      activeContent.type === "video" && activeContent.url ? (
                        <VideoPanel url={activeContent.url} />
                      ) : activeContent.type === "pdf" && activeContent.url ? (
                        <PdfPanel url={activeContent.url} />
                      ) : (
                        <div className="flex h-[min(56vh,520px)] min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center text-white">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                            {activeContent.type === "video" ? <Play className="h-8 w-8" aria-hidden /> : <FileText className="h-8 w-8" aria-hidden />}
                          </div>
                          <p className="text-sm text-white/80">Bu içerik için adres bulunamadı.</p>
                        </div>
                      )
                    ) : contentItems.length === 0 ? (
                      <div className="flex h-[min(40vh,360px)] min-h-[200px] flex-col items-center justify-center gap-3 text-white/90">
                        <BookOpen className="h-14 w-14 text-white/40" aria-hidden />
                        <p className="text-sm">İçerik yakında eklenecek</p>
                      </div>
                    ) : (
                      <div className="flex h-[min(40vh,360px)] min-h-[200px] flex-col items-center justify-center gap-2 px-6 text-center text-white/85">
                        <p className="text-sm">Yukarıdaki listeden bir içerik seçerek önizleyin.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-md text-center">
                <div className="relative mx-auto mb-6">
                  <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-violet-200 to-indigo-100 opacity-50 blur-2xl" aria-hidden />
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl shadow-violet-500/25">
                    <BookOpen className="h-12 w-12 text-white" aria-hidden />
                  </div>
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900">{activeSubject ? "Konu Seçin" : "Ders Seçin"}</h2>
                <p className="mb-6 text-slate-600">
                  {activeSubject ? "Sol menüden bir konu seçerek müfredat içeriklerine ulaşın." : "Sol menüden sınıf veya sınav derslerinden birini seçin."}
                </p>
                {!activeSubject && (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 lg:hidden"
                  >
                    <Menu className="h-5 w-5" aria-hidden />
                    Dersleri Göster
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 animate-in fade-in bg-black/50 duration-300 lg:hidden"
        />
      )}
    </div>
  );
}
