"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  api, 
  CurriculumSubject, 
  CurriculumUnit, 
  CurriculumTopic,
  extractYouTubeId,
  extractVimeoId,
  getVideoThumbnail
} from "@/lib/api";
import {
  ChevronDown, ChevronRight, Search, CheckCircle, Circle,
  BookOpen, Loader2, GraduationCap, Play, FileText,
  Menu, X, Home, ExternalLink, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
  "Matematik": "#2563eb", "TYT Matematik": "#2563eb", "AYT Matematik": "#1d4ed8", "LGS Matematik": "#0891b2",
  "Fizik": "#7c3aed", "AYT Fizik": "#6d28d9",
  "Kimya": "#ea580c", "AYT Kimya": "#c2410c",
  "Biyoloji": "#16a34a", "AYT Biyoloji": "#15803d",
  "Türk Dili ve Edebiyatı": "#dc2626", "TYT Türkçe": "#b91c1c", "LGS Türkçe": "#991b1b",
  "Tarih": "#92400e", "Coğrafya": "#0369a1",
  "TYT Fen Bilimleri": "#059669", "LGS Fen Bilimleri": "#047857",
  "TYT Sosyal Bilimler": "#7e22ce",
  "KPSS Genel Yetenek": "#4338ca", "KPSS Genel Kültür": "#5b21b6",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentItem = {
  id: number;
  type: "video" | "pdf" | "quiz" | "text";
  title: string;
  url?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  is_free?: boolean;
  description?: string;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DerslerimPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [unitsBySlug, setUnitsBySlug] = useState<Record<string, CurriculumUnit[]>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Active selection
  const [activeSubject, setActiveSubject] = useState<CurriculumSubject | null>(null);
  const [activeUnit, setActiveUnit] = useState<CurriculumUnit | null>(null);
  const [activeTopic, setActiveTopic] = useState<CurriculumTopic | null>(null);
  const [activeContent, setActiveContent] = useState<ContentItem | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  const gradeStr = user?.grade != null ? String(user.grade) : undefined;
  const examStr = user?.target_exam ?? user?.exam_goal ?? undefined;
  const hasGrade = !!gradeStr && gradeStr !== "null" && gradeStr !== "";
  const activeColor = SUBJECT_COLORS[activeSubject?.name ?? ""] ?? activeSubject?.color ?? "#6366f1";

  // Load subjects
  const loadSubjects = useCallback(async () => {
    if (!user || !hasGrade) return;
    setLoadingList(true);
    try {
      const res = await api.getCurriculum();
      setSubjects(Array.isArray(res?.subjects) ? res.subjects : []);
    } catch {
      /* silent */
    } finally {
      setLoadingList(false);
    }
  }, [user?.grade, user?.target_exam, user?.exam_goal, hasGrade, user]);

  useEffect(() => {
    if (!authLoading) loadSubjects();
  }, [authLoading, loadSubjects]);

  // Set exam filter based on user's target exam
  useEffect(() => {
    if (examStr && !examFilter) {
      // Map target_exam to filter
      if (examStr.includes("TYT")) setExamFilter("TYT");
      else if (examStr.includes("AYT")) setExamFilter("AYT");
      else if (examStr.includes("LGS")) setExamFilter("LGS");
      else if (examStr.includes("KPSS")) setExamFilter("KPSS");
      else setExamFilter("ALL");
    }
  }, [examStr, examFilter]);

  // Load units for subject — returns fresh list so callers are not blocked by async setState
  const loadUnits = useCallback(async (slug: string): Promise<CurriculumUnit[]> => {
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
      return [];
    } finally {
      setLoadingSlug(null);
    }
  }, [unitsBySlug]);

  // Handle subject selection
  const handleSubjectSelect = async (subject: CurriculumSubject) => {
    setActiveSubject(subject);
    // Close curriculum drawer on mobile after selection
    if (window.innerWidth < 1024) {
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

  // Handle topic selection
  const handleTopicSelect = (topic: CurriculumTopic, unit: CurriculumUnit) => {
    setActiveTopic(topic);
    setActiveUnit(unit);
    
    // Load content items
    const items = topic.content_items ?? [];
    setContentItems(items);
    if (items.length > 0) {
      setActiveContent(items[0] as ContentItem);
    } else {
      setActiveContent(null);
    }
  };

  // Handle topic completion
  const handleTopicComplete = async () => {
    if (!activeTopic || !activeSubject) return;

    try {
      await api.updateCurriculumProgress(activeTopic.id, "completed");
      
      // Update local state
      setUnitsBySlug((prev) => {
        const units = prev[activeSubject.slug] ?? [];
        return {
          ...prev,
          [activeSubject.slug]: units.map((u) => ({
            ...u,
            topics: u.topics.map((t) =>
              t.id === activeTopic.id ? { ...t, status: "completed" as const } : t
            ),
            completed_topics:
              u.id === activeUnit?.id
                ? u.topics.filter((t) =>
                    t.id === activeTopic.id ? true : t.status === "completed"
                  ).length
                : u.completed_topics,
            progress_percent:
              u.id === activeUnit?.id
                ? Math.round(
                    (u.topics.filter((t) =>
                      t.id === activeTopic.id ? true : t.status === "completed"
                    ).length /
                      u.total_topics) *
                      100
                  )
                : u.progress_percent,
          })),
        };
      });

      // Update active topic
      setActiveTopic((prev) => (prev ? { ...prev, status: "completed" as const } : prev));

      // Auto-navigate to next topic
      if (activeUnit) {
        const currentIndex = activeUnit.topics.findIndex((t) => t.id === activeTopic.id);
        if (currentIndex < activeUnit.topics.length - 1) {
          const nextTopic = activeUnit.topics[currentIndex + 1];
          handleTopicSelect(nextTopic, activeUnit);
        } else {
          // Find next unit
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

  // Filtered subjects - by default show ALL subjects since backend already filters
  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch = search ? s.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesSearch;
  });

  // Guards
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
    <div className="flex w-full flex-col bg-slate-50 lg:max-h-[calc(100dvh-7rem)] lg:min-h-0 lg:overflow-hidden">
      {/* Toolbar — sticky inside dashboard main so global öğrenci sidebar stays visible (no viewport-fixed overlay) */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-sm sm:h-16 sm:px-6">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Home className="h-4 w-4" />
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-slate-900">Derslerim</span>
            {activeSubject && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="hidden sm:inline">{activeSubject.name}</span>
              </>
            )}
            {activeTopic && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="hidden md:inline truncate max-w-xs">{activeTopic.title}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Search */}
        <div className="mx-4 hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ders veya konu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: User info */}
        <div className="flex items-center gap-2">
          {gradeStr && examStr && (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {gradeStr === "mezun" ? "Mezun" : `${gradeStr}. Sınıf`}
              </div>
              <div className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                {examStr}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
      {/* ═══ CURRICULUM SIDEBAR (desktop: column in layout; mobile: slide-over) ═══ */}
      <aside
        className={cn(
          "flex w-80 max-w-[min(100vw-1.5rem,20rem)] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out",
          "fixed inset-y-0 left-0 z-40 shadow-xl lg:static lg:z-0 lg:h-auto lg:max-h-[calc(100dvh-8rem)] lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-teal-50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-600" />
                <h2 className="text-lg font-bold text-slate-900">Derslerim</h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/80 lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {gradeStr && examStr && (
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                  {gradeStr === "mezun" ? "Mezun" : `${gradeStr}. Sınıf`}
                </div>
                <div className="rounded-lg bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm">
                  {examStr}
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="border-b border-slate-100 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ders ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </div>

          {/* Subject List */}
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
                  <BookOpen className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Henüz ders eklenmemiş</p>
                <p className="text-xs text-slate-500">
                  {gradeStr}. Sınıf {examStr} için<br />dersler yakında eklenecek
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
                    <div key={subject.slug} className={`rounded-xl border-2 transition-all ${
                      isActive ? "border-cyan-200 bg-cyan-50/30 shadow-sm" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}>
                      <button
                        onClick={() => handleSubjectSelect(subject)}
                        className="flex w-full items-center gap-3 p-4 text-left"
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-semibold shadow-sm"
                          style={{ 
                            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                            color: color
                          }}
                        >
                          {subject.icon || subject.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-0.5 truncate text-sm font-bold text-slate-900">{subject.name}</p>
                          {loadingSlug === subject.slug ? (
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                              Üniteler yükleniyor…
                            </p>
                          ) : !unitsLoaded ? (
                            <p className="text-xs text-slate-400">Konular için dokunun</p>
                          ) : units.length === 0 ? (
                            <p className="text-xs text-amber-700">Bu derste henüz ünite yok</p>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%`, backgroundColor: color }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-500">{progress}%</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${
                          isActive ? "rotate-90" : ""
                        }`} />
                      </button>

                      {/* Units & Topics */}
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

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 lg:min-h-0">
        {activeTopic ? (
          <div className="container mx-auto max-w-7xl p-4 md:p-6">
            {/* Video/PDF Player Section */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
              {/* Player Area */}
              <div className="relative aspect-video bg-slate-900">
                {activeContent ? (
                  activeContent.type === "video" && activeContent.url ? (
                    <VideoPlayer url={activeContent.url} />
                  ) : activeContent.type === "pdf" && activeContent.url ? (
                    <PDFViewer url={activeContent.url} />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-white">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                        {activeContent.type === "video" ? (
                          <Play className="h-10 w-10" />
                        ) : (
                          <FileText className="h-10 w-10" />
                        )}
                      </div>
                      <p className="text-sm">İçerik URL'si bulunamadı</p>
                    </div>
                  )
                ) : contentItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-white">
                    <BookOpen className="mb-4 h-16 w-16 opacity-50" />
                    <p>İçerik yakında eklenecek</p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-white">
                    <p className="text-sm">Bir içerik seçin</p>
                  </div>
                )}
              </div>

              {/* Content Info */}
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="mb-2 text-xl font-bold text-slate-900 md:text-2xl">
                      {activeContent?.title || activeTopic.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>{activeUnit?.title}</span>
                      <span>·</span>
                      <span>{activeSubject?.name}</span>
                      {activeContent?.duration_seconds && (
                        <>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{Math.round(activeContent.duration_seconds / 60)} dakika</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {activeTopic.status !== "completed" ? (
                    <button
                      onClick={handleTopicComplete}
                      className="flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: activeColor }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Konuyu Tamamla</span>
                      <span className="sm:hidden">Tamamla</span>
                    </button>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white">
                      <CheckCircle className="h-4 w-4" />
                      <span>Tamamlandı</span>
                    </div>
                  )}
                </div>

                {activeContent?.description && (
                  <p className="text-slate-600">{activeContent.description}</p>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {contentItems.length > 0 ? `İçerikler (${contentItems.length})` : "İçerikler"}
                </h2>
                {contentItems.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      Tümü
                    </button>
                    <button
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      Video
                    </button>
                    <button
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      PDF
                    </button>
                  </div>
                )}
              </div>

              {contentItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {contentItems.map((item) => {
                    const isActive = activeContent?.id === item.id;
                    const thumbnail = item.thumbnail_url || (item.type === "video" && item.url ? getVideoThumbnail(item.url) : null);

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveContent(item)}
                        className={`group overflow-hidden rounded-xl border-2 bg-white text-left transition-all hover:shadow-lg ${
                          isActive ? "ring-2 ring-offset-2" : "border-slate-200"
                        }`}
                        style={isActive ? { borderColor: activeColor, ringColor: activeColor } : {}}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              {item.type === "video" ? (
                                <Play className="h-12 w-12 text-slate-400" />
                              ) : (
                                <FileText className="h-12 w-12 text-slate-400" />
                              )}
                            </div>
                          )}

                          {/* Type badge */}
                          <div
                            className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-white"
                            style={{
                              background: item.type === "video" ? "#ef4444" : "#f59e0b",
                            }}
                          >
                            {item.type === "video" ? <Play className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                            {item.type === "video" ? "Video" : "PDF"}
                          </div>

                          {/* Duration */}
                          {item.duration_seconds && (
                            <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                              {Math.round(item.duration_seconds / 60)} dk
                            </div>
                          )}

                          {/* Play overlay */}
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                                <Play className="h-6 w-6" style={{ color: activeColor }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <p className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {item.duration_seconds && (
                              <span>{Math.round(item.duration_seconds / 60)} dakika</span>
                            )}
                            {!item.is_free && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">
                                Pro
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: `${activeColor}15` }}
                  >
                    <BookOpen className="h-8 w-8" style={{ color: activeColor }} />
                  </div>
                  <p className="mb-2 font-bold text-slate-700">İçerik Yakında Eklenecek</p>
                  <p className="text-sm text-slate-500">
                    Bu konu için video dersler ve PDF notlar hazırlanıyor.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md text-center">
              <div className="relative mx-auto mb-6">
                <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-cyan-100 to-teal-100 blur-2xl opacity-50" />
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-xl">
                  <BookOpen className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-slate-900">
                {activeSubject ? "Konu Seçin" : "Ders Seçin"}
              </h2>
              <p className="mb-6 text-slate-600">
                {activeSubject
                  ? "Sol menüden bir konu seçerek video dersler ve PDF notlara ulaşabilirsiniz"
                  : "Sol menüden başlamak istediğiniz dersi seçin"}
              </p>
              {!activeSubject && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                  Dersleri Göster
                </button>
              )}
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Overlay for mobile curriculum drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 animate-in fade-in bg-black/50 duration-300 lg:hidden"
        />
      )}
    </div>
  );
}

// ─── Video Player Component ───────────────────────────────────────────────────

function VideoPlayer({ url }: { url: string }) {
  const youtubeId = extractYouTubeId(url);
  const vimeoId = extractVimeoId(url);

  if (youtubeId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video Player"
      />
    );
  }

  if (vimeoId) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}`}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Video Player"
      />
    );
  }

  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video
        src={url}
        controls
        className="h-full w-full"
        controlsList="nodownload"
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center text-white">
      <div className="text-center">
        <ExternalLink className="mx-auto mb-2 h-12 w-12 opacity-50" />
        <p className="mb-4 text-sm">Video formatı desteklenmiyor</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
        >
          <ExternalLink className="h-4 w-4" />
          Yeni sekmede aç
        </a>
      </div>
    </div>
  );
}

// ─── PDF Viewer Component ─────────────────────────────────────────────────────

function PDFViewer({ url }: { url: string }) {
  return (
    <div className="h-full w-full">
      <embed
        src={url}
        type="application/pdf"
        className="h-full w-full"
        title="PDF Viewer"
      />
    </div>
  );
}

// ─── Unit Accordion Component ─────────────────────────────────────────────────

function UnitAccordion({
  unit,
  color,
  activeTopic,
  onTopicSelect,
}: {
  unit: CurriculumUnit;
  color: string;
  activeTopic: CurriculumTopic | null;
  onTopicSelect: (topic: CurriculumTopic) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
          style={{ background: color }}
        >
          {unit.sort_order}
        </div>
        <span className="flex-1 text-xs font-bold text-slate-700">{unit.title}</span>
        <span className="text-xs text-slate-400">
          {unit.completed_topics}/{unit.total_topics}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="ml-8 mt-1 space-y-1">
          {unit.topics.map((topic) => {
            const isActive = activeTopic?.id === topic.id;
            const isDone = topic.status === "completed";

            return (
              <button
                key={topic.id}
                onClick={() => onTopicSelect(topic)}
                className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs transition-all ${
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                style={isActive ? { background: color } : {}}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    isDone
                      ? isActive
                        ? "border-white bg-white"
                        : "border-emerald-500 bg-emerald-500"
                      : isActive
                      ? "border-white/60"
                      : "border-slate-300"
                  }`}
                >
                  {isDone && (
                    <CheckCircle
                      className="h-2.5 w-2.5"
                      style={{ color: isActive ? color : "white" }}
                    />
                  )}
                </div>
                <span className={`flex-1 ${isDone && !isActive ? "line-through opacity-50" : ""}`}>
                  {topic.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
