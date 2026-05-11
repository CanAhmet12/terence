"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, CurriculumSubject, CurriculumUnit, CurriculumTopic } from "@/lib/api";
import {
  ChevronRight,
  Search,
  CheckCircle,
  BookOpen,
  Loader2,
  GraduationCap,
  Menu,
  X,
  Home,
  RefreshCw,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderUserMenu } from "@/components/dashboard/HeaderUserMenu";
import { SUBJECT_COLORS } from "@/components/ogrenci/dersler/constants";
import {
  partitionCurriculumSubjects,
  examSubjectMatchesChip,
  type CurriculumBucket,
} from "@/components/ogrenci/dersler/curriculumBuckets";
import { CurriculumBucketTabs, ExamFilterChips } from "@/components/ogrenci/dersler/CurriculumBucketTabs";
import { TopicHero } from "@/components/ogrenci/dersler/TopicHero";
import { TopicKpiStrip } from "@/components/ogrenci/dersler/TopicKpiStrip";
import { TopicAbout } from "@/components/ogrenci/dersler/TopicAbout";
import { TopicContentList, type ContentListItem } from "@/components/ogrenci/dersler/TopicContentList";
import { TopicMediaModal } from "@/components/ogrenci/dersler/TopicMediaModal";
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
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

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
    setActiveContent(null);
    setMediaModalOpen(false);
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
    <div className="flex w-full min-w-0 flex-col overflow-x-hidden bg-[#f8f9fb]">
      <header className="sticky top-0 z-[60] border-b border-slate-200/90 bg-white shadow-sm">
        <div className="flex w-full flex-col gap-2.5 px-3 py-2.5 sm:px-4 lg:flex-row lg:items-center lg:gap-5 lg:px-5 lg:py-3">
          <div className="flex w-full min-w-0 flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Ders menüsünü aç"
              >
                <Menu className="h-5 w-5" />
              </button>

              <nav
                className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-slate-600 sm:text-sm"
                aria-label="Konum"
              >
                <Link href="/ogrenci" className="shrink-0 text-slate-400 transition-colors hover:text-violet-600" title="Ana sayfa">
                  <Home className="h-4 w-4" aria-hidden />
                </Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
                <span className="shrink-0 font-semibold text-slate-900">Derslerim</span>
                {activeSubject && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
                    <span className="max-w-[7rem] truncate font-medium text-slate-700 sm:max-w-[10rem] md:max-w-none">{activeSubject.name}</span>
                  </>
                )}
                {activeTopic && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
                    <span className="max-w-[9rem] truncate font-semibold text-violet-800 sm:max-w-[14rem] lg:max-w-[20rem]">{activeTopic.title}</span>
                  </>
                )}
              </nav>
            </div>

            <div className="w-full md:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  placeholder="Ders veya konu ara..."
                  value={toolbarSearch}
                  onChange={(e) => setToolbarSearch(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/90 py-2 pl-10 pr-10 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  aria-label="Ders ara"
                />
                {toolbarSearch ? (
                  <button
                    type="button"
                    onClick={() => setToolbarSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Aramayı temizle"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="hidden min-w-0 w-full md:block lg:flex-[1.35] lg:px-2">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  placeholder="Ders veya konu ara..."
                  value={toolbarSearch}
                  onChange={(e) => setToolbarSearch(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/90 py-2 pl-10 pr-10 text-sm outline-none transition-shadow focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  aria-label="Ders ara"
                />
                {toolbarSearch ? (
                  <button
                    type="button"
                    onClick={() => setToolbarSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Aramayı temizle"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              {gradeStr && examStr ? (
                <>
                  <div className="hidden items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm sm:flex">
                    <GraduationCap className="h-3.5 w-3.5 text-violet-600" aria-hidden />
                    {gradeStr === "mezun" ? "Mezun" : `${gradeStr}. Sınıf`}
                  </div>
                  <div className="hidden items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm sm:flex">
                    <BarChart3 className="h-3.5 w-3.5 text-violet-600" aria-hidden />
                    {examStr}
                  </div>
                </>
              ) : null}
              <HeaderUserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row lg:items-start">
        <aside
          className={cn(
            "flex w-80 max-w-[min(100vw-1.5rem,20rem)] shrink-0 flex-col border-r border-slate-200/90 bg-white transition-transform duration-300 ease-in-out",
            "fixed inset-y-0 left-0 z-40 shadow-xl lg:static lg:z-0 lg:shadow-none",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
          id={bucketTab === "school" ? "panel-bucket-school" : "panel-bucket-exam"}
          role="tabpanel"
          aria-labelledby={bucketTab === "school" ? "tab-bucket-school" : "tab-bucket-exam"}
        >
          <div className="flex flex-col">
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

            <div className="p-4 pb-6">
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

        <main className="min-w-0 flex-1 bg-[#f8f9fb]">
          {activeTopic ? (
            <div className="w-full space-y-0 px-3 py-4 pb-16 sm:px-4 md:py-6 md:pb-20 lg:px-5">
              <TopicHero
                topicTitle={activeTopic.title}
                unitTitle={activeUnit?.title}
                subjectName={activeSubject?.name}
                gradeLabel={gradeStr === "mezun" ? "Mezun" : gradeStr ? `${gradeStr}. Sınıf` : undefined}
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
                {activeTopic.status !== "completed" ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/90 to-indigo-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm font-medium text-slate-700">Bu konuyu bitirdiğinizde ilerlemeniz güncellenir.</p>
                    <button
                      type="button"
                      onClick={handleTopicComplete}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                    >
                      <CheckCircle className="h-4 w-4" aria-hidden />
                      <span className="hidden sm:inline">Konuyu tamamla</span>
                      <span className="sm:hidden">Tamamla</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-3 text-sm font-semibold text-cyan-800 sm:px-5">
                    <CheckCircle className="h-5 w-5 shrink-0" aria-hidden />
                    Bu konu tamamlandı.
                  </div>
                )}

                <TopicAbout title="Konu Hakkında" body={activeTopic.description} />

                <TopicContentList
                  items={contentItems}
                  activeId={activeContent?.id ?? null}
                  onSelect={(item) => setActiveContent(item)}
                  onOpenMedia={(item) => {
                    setActiveContent(item);
                    setMediaModalOpen(true);
                  }}
                  topicTitle={activeTopic.title}
                  mebCode={activeTopic.meb_code}
                  accentColor={activeColor}
                  filter={contentFilter}
                  onFilterChange={setContentFilter}
                />
              </div>

              <TopicMediaModal item={activeContent} open={mediaModalOpen} onClose={() => setMediaModalOpen(false)} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24">
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
