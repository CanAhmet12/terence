"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Image from "next/image";
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
  RefreshCw,
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
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-[1360px] px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pt-5">
        {/* Mockup: (1) Hero — başlık + yenile solda, illüstrasyon sağda | (2) Altında KPI üçlüsü tam genişlik */}
        <section className="space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-[28px] font-bold tracking-tight text-slate-900 lg:text-[32px] lg:leading-tight">
                    Canlı Dersler
                  </h1>
                  <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-slate-600">
                    Öğretmenlerinizle canlı derslere katıl, sorularını sor ve öğrenmeni pekiştir!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    loadLessons();
                  }}
                  disabled={loading}
                  className="mt-0.5 shrink-0 rounded-xl border border-slate-200/80 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800 disabled:opacity-50"
                  aria-label="Listeyi yenile"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            <div
              className="relative mx-auto flex w-full max-w-[300px] shrink-0 items-center justify-center sm:max-w-[340px] lg:mx-0 lg:max-w-[min(100%,360px)] xl:max-w-[380px]"
              aria-hidden
            >
              <Image
                src="/images/canli-ders/hero-live.png"
                alt=""
                width={640}
                height={480}
                className="h-auto w-full max-h-[220px] object-contain object-center sm:max-h-[260px] lg:max-h-[280px] xl:max-h-[300px]"
                priority
                sizes="(max-width: 1024px) 85vw, 360px"
              />
            </div>
          </div>

          <div className="w-full">
            {!loading && token ? (
              <KpiStrip summary={summary} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[132px] animate-pulse rounded-2xl bg-slate-200/60" />
                ))}
              </div>
            )}
          </div>
        </section>

        {err && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {err}
          </div>
        )}

        {/* Sekmeler + görünüm + filtre */}
        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
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
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[430px] animate-pulse rounded-2xl bg-slate-200/50" />
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
          <div className="mt-8">
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                  : "mx-auto flex max-w-3xl flex-col gap-5"
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
          <div className="mt-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                <Play className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Geçmiş dersler</h2>
                <p className="text-[13px] text-slate-500">Kayıt varsa oynatabilirsiniz</p>
              </div>
            </div>
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                  : "mx-auto flex max-w-3xl flex-col gap-3"
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
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
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
        <div className="min-h-full bg-[#F9FAFB]">
          <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200/70" />
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[132px] animate-pulse rounded-2xl bg-slate-200/60" />
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
