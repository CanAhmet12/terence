"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { studentApi, type StudentLiveLessonsSummary, type TeacherLesson, type VideoRoom } from "@/lib/api";
import { VideoCard } from "@/components/VideoCard";
import { LiveBanner } from "@/components/LiveBanner";
import { LiveClassRoom } from "@/components/ogrenci/canli-ders/LiveClassRoom";
import { KpiStrip } from "@/components/ogrenci/canli-ders/KpiStrip";
import { LiveLessonCard } from "@/components/ogrenci/canli-ders/LiveLessonCard";
import { StudentLiveHelpBanner } from "@/components/ogrenci/canli-ders/StudentLiveHelpBanner";
import {
  Video,
  Wifi,
  AlertCircle,
  RefreshCw,
  Play,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";

function isLiveWindow(iso: string, durationMin: number): boolean {
  const start = new Date(iso).getTime();
  const end = start + durationMin * 60 * 1000;
  const now = Date.now();
  return now >= start && now <= end;
}

export default function OgrenciCanliDersPage() {
  const { token } = useAuth();

  const [upcoming, setUpcoming] = useState<TeacherLesson[]>([]);
  const [past, setPast] = useState<TeacherLesson[]>([]);
  const [summary, setSummary] = useState<StudentLiveLessonsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<TeacherLesson | null>(null);
  const [activeRoom, setActiveRoom] = useState<VideoRoom | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");

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

  const filteredUpcoming = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return upcoming;
    return upcoming.filter((l) => {
      const t = (l.title || l.class_room?.name || "").toLowerCase();
      const sub = (l.subject_tag || "").toLowerCase();
      const teach = (l.teacher?.name || "").toLowerCase();
      return t.includes(s) || sub.includes(s) || teach.includes(s);
    });
  }, [upcoming, q]);

  const filteredPast = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return past;
    return past.filter((l) => {
      const t = (l.title || l.class_room?.name || "").toLowerCase();
      const sub = (l.subject_tag || "").toLowerCase();
      const teach = (l.teacher?.name || "").toLowerCase();
      return t.includes(s) || sub.includes(s) || teach.includes(s);
    });
  }, [past, q]);

  const liveLesson = upcoming.find((l) => {
    if (l.status === "live") return true;
    const iso = l.starts_at ?? l.scheduled_at ?? "";
    return !!iso && isLiveWindow(iso, l.duration_minutes ?? 90);
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1800px] px-6 py-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Canlı Dersler</h1>
            <p className="text-slate-600">Öğretmenlerinizle canlı derse katılın</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadLessons();
            }}
            disabled={loading}
            className="self-start rounded-xl bg-slate-100 p-3 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {err && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {err}
          </div>
        )}

        {!loading && token && <KpiStrip summary={summary} />}

        {liveLesson && !dismissedBanner && (
          <div className="mb-8">
            <LiveBanner
              lessonTitle={liveLesson.title || liveLesson.class_room?.name || "Canlı Ders"}
              instructor={liveLesson.teacher?.name}
              participantCount={
                typeof liveLesson.participant_count === "number" ? liveLesson.participant_count : undefined
              }
              onJoin={() => handleJoin(liveLesson)}
              onDismiss={() => setDismissedBanner(true)}
            />
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                tab === "upcoming" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Yaklaşan
            </button>
            <button
              type="button"
              onClick={() => setTab("past")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                tab === "past" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Geçmiş
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Başlık, konu veya öğretmen ara…"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              <button
                type="button"
                title="Izgara"
                onClick={() => setView("grid")}
                className={`rounded-md p-2 ${view === "grid" ? "bg-indigo-100 text-indigo-700" : "text-slate-500"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Liste"
                onClick={() => setView("list")}
                className={`rounded-md p-2 ${view === "list" ? "bg-indigo-100 text-indigo-700" : "text-slate-500"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : !token ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            Canlı dersleri görmek için giriş yapın.
          </div>
        ) : tab === "upcoming" && filteredUpcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50">
              <Video className="h-12 w-12 text-indigo-500" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-slate-900">Henüz yaklaşan canlı ders yok</h3>
            <p className="max-w-md text-slate-600">Öğretmeniniz ders oluşturduğunda burada görünür</p>
          </div>
        ) : tab === "past" && filteredPast.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-slate-600">
            <Play className="mb-4 h-12 w-12 text-slate-300" />
            <p>Henüz tamamlanmış ders kaydı yok.</p>
          </div>
        ) : tab === "upcoming" ? (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Wifi className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Yaklaşan Dersler</h2>
                <p className="text-sm text-slate-600">{filteredUpcoming.length} ders</p>
              </div>
            </div>
            <div
              className={
                view === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4 max-w-3xl mx-auto"
              }
            >
              {filteredUpcoming.map((lesson) => (
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
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Play className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Geçmiş dersler</h2>
                <p className="text-sm text-slate-600">Kayıt varsa oynatabilirsiniz</p>
              </div>
            </div>
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                  : "flex flex-col gap-3 max-w-3xl mx-auto"
              }
            >
              {filteredPast.slice(0, 40).map((lesson) => {
                const recording_url = lesson.recording_url || lesson.daily_room_url;
                return view === "list" ? (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{lesson.title || lesson.class_room?.name}</p>
                      <p className="text-xs text-slate-500">{lesson.teacher?.name}</p>
                    </div>
                    {recording_url ? (
                      <button
                        type="button"
                        onClick={() => window.open(recording_url, "_blank")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
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
