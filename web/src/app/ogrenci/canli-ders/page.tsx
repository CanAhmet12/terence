"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { studentApi, type TeacherLesson, type StudentLiveLessonsSummary, type VideoRoom } from "@/lib/api";
import { VideoCard } from "@/components/VideoCard";
import { LiveClassRoom } from "@/components/ogrenci/canli-ders/LiveClassRoom";
import { KpiStrip } from "@/components/ogrenci/canli-ders/KpiStrip";
import { LiveLessonCard } from "@/components/ogrenci/canli-ders/LiveLessonCard";
import { StudentLiveHelpBanner } from "@/components/ogrenci/canli-ders/StudentLiveHelpBanner";
import {
  Video,
  AlertCircle,
  Play,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function lessonMatchesQuery(lesson: TeacherLesson, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    lesson.title,
    lesson.class_room?.name,
    lesson.teacher?.name,
    lesson.subject_tag,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

function OgrenciCanliDersPageInner() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const headerQuery = (searchParams.get("q") ?? "").trim();

  const [upcoming, setUpcoming] = useState<TeacherLesson[]>([]);
  const [past, setPast] = useState<TeacherLesson[]>([]);
  const [summary, setSummary] = useState<StudentLiveLessonsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<TeacherLesson | null>(null);
  const [activeRoom, setActiveRoom] = useState<VideoRoom | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterScope, setFilterScope] = useState<"all" | "today" | "week">("all");

  const loadLessons = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [up, pa, sum] = await Promise.all([
        studentApi.getStudentLiveLessons("upcoming"),
        studentApi.getStudentLiveLessons("past"),
        studentApi.getStudentLiveLessonsSummary(),
      ]);
      setUpcoming(Array.isArray(up) ? up : []);
      setPast(Array.isArray(pa) ? pa : []);
      setSummary(sum);
    } catch {
      setUpcoming([]);
      setPast([]);
      setSummary(null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const handleJoin = async (lesson: TeacherLesson) => {
    if (!token) return;
    setJoiningId(lesson.id);
    setErr("");
    try {
      const room = await studentApi.joinLiveSession(lesson.id);
      setActiveRoom(room);
      setActiveLesson(lesson);
    } catch (e) {
      setErr((e as Error).message || "Derse bağlanılamadı. Lütfen tekrar dene.");
    }
    setJoiningId(null);
  };

  const roomUrl = activeRoom?.room_url || activeLesson?.daily_room_url;
  if (activeLesson && roomUrl) {
    return (
      <LiveClassRoom
        lesson={activeLesson}
        room={activeRoom}
        onClose={() => {
          setActiveLesson(null);
          setActiveRoom(null);
        }}
      />
    );
  }

  const upcomingScoped = useMemo(() => {
    const now = new Date();
    let list =
      filterScope === "all"
        ? upcoming
        : upcoming.filter((l) => {
            const iso = l.starts_at ?? l.scheduled_at ?? "";
            if (!iso) return false;
            const t = new Date(iso).getTime();
            if (filterScope === "today") {
              return t >= startOfDay(now).getTime() && t <= endOfDay(now).getTime();
            }
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return t >= startOfDay(now).getTime() && t <= weekEnd.getTime();
          });
    if (headerQuery) list = list.filter((l) => lessonMatchesQuery(l, headerQuery));
    return list;
  }, [upcoming, filterScope, headerQuery]);

  const filteredPast = useMemo(() => {
    if (!headerQuery) return past;
    return past.filter((l) => lessonMatchesQuery(l, headerQuery));
  }, [past, headerQuery]);

  return (
    <div className="min-h-full min-w-0 overflow-x-hidden bg-gradient-to-b from-slate-50 via-[#F4F6FA] to-slate-100/90">
      <div className="mx-auto w-full max-w-[min(100%,1680px)] px-4 pb-16 pt-5 sm:px-6 lg:px-10 xl:px-12">
        {/* Üst bölüm: sol başlık — sağ kompakt KPI (geniş ekranda sağa yaslı) */}
        <section className="border-b border-slate-200/80 pb-8">
          <div className="flex w-full flex-col gap-6 xl:flex-row xl:items-start xl:justify-between xl:gap-12">
            <div className="min-w-0 shrink-0 xl:max-w-[46%]">
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900 sm:text-[30px] lg:text-[32px] lg:leading-tight">
                Canlı Dersler
              </h1>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
                Öğretmenlerinizle canlı derslere katıl, sorularını sor ve öğrenmeni pekiştir!
              </p>
            </div>
            <div className="w-full min-w-0 xl:flex-1 xl:max-w-[min(100%,720px)] xl:self-center">
              {!loading && token ? (
                <KpiStrip summary={summary} />
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-200/50 sm:h-[76px]" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {err && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {err}
          </div>
        )}

        {/* Sekmeler + filtre: tam genişlik, sol-sağ */}
        <div className="mt-9 flex w-full flex-col gap-4 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-xl border border-slate-200/90 bg-slate-100/90 p-1">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={`rounded-lg px-5 py-2.5 text-[13px] font-bold transition ${
                tab === "upcoming"
                  ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yaklaşan Dersler
            </button>
            <button
              type="button"
              onClick={() => setTab("past")}
              className={`rounded-lg px-5 py-2.5 text-[13px] font-bold transition ${
                tab === "past"
                  ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Geçmiş Dersler
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {tab === "upcoming" && (
              <div className="relative">
                <select
                  value={filterScope}
                  onChange={(e) => setFilterScope(e.target.value as typeof filterScope)}
                  className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-[13px] font-semibold text-slate-700 shadow-sm outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-400"
                  aria-label="Filtre"
                >
                  <option value="all">Tümü</option>
                  <option value="today">Bugün</option>
                  <option value="week">Bu hafta</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            )}
            <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                title="Izgara görünümü"
                onClick={() => setView("grid")}
                className={`rounded-lg p-2.5 transition ${
                  view === "grid" ? "bg-indigo-100 text-[#6366F1]" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <LayoutGrid className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                title="Liste görünümü"
                onClick={() => setView("list")}
                className={`rounded-lg p-2.5 transition ${
                  view === "list" ? "bg-indigo-100 text-[#6366F1]" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <List className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-9 2xl:grid-cols-3 2xl:gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[520px] animate-pulse rounded-3xl bg-slate-200/45" />
            ))}
          </div>
        ) : !token ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center text-[15px] text-slate-600 shadow-sm">
            Canlı dersleri görmek için giriş yapın.
          </div>
        ) : tab === "upcoming" && upcomingScoped.length === 0 ? (
          <div className="mt-14 flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-indigo-50 shadow-inner">
              <Video className="h-10 w-10 text-[#6366F1]" />
            </div>
            <h3 className="mb-2 text-[22px] font-bold text-slate-900">Henüz yaklaşan canlı ders yok</h3>
            <p className="max-w-md text-[15px] text-slate-600">Öğretmeniniz ders oluşturduğunda burada görünür.</p>
          </div>
        ) : tab === "past" && filteredPast.length === 0 ? (
          <div className="mt-14 flex flex-col items-center justify-center py-16 text-center text-slate-600">
            <Play className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-[15px]">Henüz tamamlanmış ders kaydı yok.</p>
          </div>
        ) : tab === "upcoming" ? (
          <div className="mt-10 w-full">
            <div
              className={
                view === "grid"
                  ? "grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-9 2xl:grid-cols-3 2xl:gap-10"
                  : "flex w-full flex-col gap-6 lg:gap-7"
              }
            >
              {upcomingScoped.map((lesson) => (
                <LiveLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onJoin={() => handleJoin(lesson)}
                  joining={joiningId === lesson.id}
                  compact={view === "list"}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 w-full">
            <div className="mb-6 flex w-full flex-col gap-1 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Geçmiş dersler</h2>
                <p className="text-[13px] text-slate-500">Kayıt varsa oynatabilirsiniz</p>
              </div>
            </div>
            <div
              className={
                view === "grid"
                  ? "grid w-full grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 2xl:grid-cols-3"
                  : "flex w-full flex-col gap-3"
              }
            >
              {filteredPast.slice(0, 40).map((lesson) => {
                const recording_url = lesson.recording_url || lesson.daily_room_url;
                return view === "list" ? (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_15px_-3px_rgba(15,23,42,0.05)]"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{lesson.title || lesson.class_room?.name}</p>
                      <p className="text-xs text-slate-500">{lesson.teacher?.name}</p>
                    </div>
                    {recording_url ? (
                      <button
                        type="button"
                        onClick={() => window.open(recording_url, "_blank")}
                        className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700"
                      >
                        Oynat
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Kayıt yok</span>
                    )}
                  </div>
                ) : (
                  <VideoCard
                    key={lesson.id}
                    id={lesson.id}
                    title={lesson.title || lesson.class_room?.name || "Canlı Ders"}
                    thumbnail={null}
                    duration={lesson.duration_minutes ? lesson.duration_minutes * 60 : 0}
                    instructor={lesson.teacher?.name}
                    date={new Date(lesson.starts_at ?? lesson.scheduled_at ?? "").toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                    onPlay={() => {
                      if (recording_url) window.open(recording_url, "_blank");
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <StudentLiveHelpBanner />
      </div>
    </div>
  );
}

export default function OgrenciCanliDersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-gradient-to-b from-slate-50 via-[#F4F6FA] to-slate-100/90">
          <div className="mx-auto w-full max-w-[min(100%,1680px)] px-4 py-8 sm:px-6 lg:px-10 xl:px-12">
            <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200/70" />
            <div className="mt-8 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-200/50" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <OgrenciCanliDersPageInner />
    </Suspense>
  );
}
