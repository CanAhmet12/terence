"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, TeacherLesson, VideoRoom } from "@/lib/api";
import { VideoCard } from "@/components/VideoCard";
import { LiveBanner } from "@/components/LiveBanner";
import { GradientThumbnail } from "@/components/GradientThumbnail";
import {
  Video, Calendar, Clock, Play, Users, Wifi,
  AlertCircle, Loader2, RefreshCw, Maximize2, X,
  Monitor, Camera, Mic
} from "lucide-react";

// Helper functions
function fmtDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }) +
    " · " +
    d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  );
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Şimdi başlıyor";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h} saat ${m} dk sonra`;
  return `${m} dakika sonra`;
}

function isWithin15Min(iso: string): boolean {
  const diff = new Date(iso).getTime() - Date.now();
  return diff >= 0 && diff <= 15 * 60 * 1000;
}

function isLive(iso: string, durationMin: number): boolean {
  const start = new Date(iso).getTime();
  const end = start + durationMin * 60 * 1000;
  const now = Date.now();
  return now >= start && now <= end;
}

// Live Classroom Modal
function LiveClassRoom({
  lesson,
  room,
  onClose,
}: {
  lesson: TeacherLesson;
  room: VideoRoom | null;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const roomUrl = room?.room_url || lesson.daily_room_url;

  const handleFullscreen = () => {
    if (!fullscreen) {
      iframeRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  if (!roomUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-white">
            {lesson.title || lesson.class_room?.name}
          </span>
          <span className="text-xs text-slate-400">{lesson.duration_minutes} dk</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFullscreen}
            className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-600"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Tam Ekran
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
          >
            Dersten Çık
          </button>
        </div>
      </div>
      <div className="relative flex-1">
        <iframe
          ref={iframeRef}
          src={roomUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
          allowFullScreen
          className="h-full w-full border-0"
          title="Canlı Ders"
        />
      </div>
      <div className="flex items-center justify-between border-t border-slate-700 bg-slate-900 px-6 py-2.5 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <Mic className="h-3.5 w-3.5" />
          <Camera className="h-3.5 w-3.5" />
          <Monitor className="h-3.5 w-3.5" />
          Kamera, mikrofon ve ekran paylaşımı aktif
        </span>
        <span>Terence Eğitim — Güvenli Bağlantı</span>
      </div>
    </div>
  );
}

// Upcoming Live Lesson Card
function UpcomingLessonCard({
  lesson,
  onJoin,
  joining,
}: {
  lesson: TeacherLesson;
  onJoin: () => void;
  joining: boolean;
}) {
  const live = isLive(lesson.starts_at ?? lesson.scheduled_at ?? "", lesson.duration_minutes ?? 60);
  const soon = isWithin15Min(lesson.starts_at ?? lesson.scheduled_at ?? "");
  const canJoin = (live || soon) && (lesson.daily_room_url || lesson.class_room);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md ${
        live ? "ring-2 ring-emerald-500" : ""
      }`}
    >
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50" />

      {/* Content */}
      <div className="relative p-4">
        {/* Top Badges */}
        <div className="mb-3 flex items-center justify-between">
          {/* Date Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Calendar className="h-3 w-3" />
            {new Date(lesson.starts_at ?? lesson.scheduled_at ?? "").toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
            })}
          </div>

          {/* Status Badge */}
          {live ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              CANLI
            </div>
          ) : soon ? (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
              <Clock className="h-3 w-3" />
              Az Kaldı
            </div>
          ) : (
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Yaklaşan
            </div>
          )}
        </div>

        {/* Thumbnail */}
        <div className="mb-3">
          <GradientThumbnail
            courseId={lesson.class_room?.id}
            videoId={lesson.id}
            title={lesson.title || lesson.class_room?.name || "Canlı Ders"}
            duration={lesson.duration_minutes ? lesson.duration_minutes * 60 : undefined}
          />
        </div>

        {/* Title & Info */}
        <h3 className="mb-2 line-clamp-2 text-base font-bold text-slate-900">
          {lesson.title || lesson.class_room?.name || "Canlı Ders"}
        </h3>

        <div className="mb-3 space-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>{fmtDate(lesson.starts_at ?? lesson.scheduled_at ?? "")}</span>
          </div>
          {lesson.duration_minutes && (
            <div className="flex items-center gap-2">
              <Video className="h-3.5 w-3.5" />
              <span>{lesson.duration_minutes} dakika</span>
            </div>
          )}
          {!live && (
            <div className="mt-2 text-xs font-semibold text-indigo-600">
              {timeUntil(lesson.starts_at ?? lesson.scheduled_at ?? "")}
            </div>
          )}
        </div>

        {/* Join Button */}
        {canJoin ? (
          <button
            onClick={onJoin}
            disabled={joining}
            className={`w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-70 ${
              live
                ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/25"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25"
            }`}
          >
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Bağlanıyor...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play className="h-4 w-4" fill="white" /> Derse Katıl
              </span>
            )}
          </button>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-700/50 py-3 text-sm font-medium text-slate-400">
            <Clock className="h-4 w-4" />
            Bekleniyor
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page
export default function OgrenciCanliDersPage() {
  const { token } = useAuth();

  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<TeacherLesson | null>(null);
  const [activeRoom, setActiveRoom] = useState<VideoRoom | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const loadLessons = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getStudentUpcomingLessons();
      setLessons(Array.isArray(res) ? (res as TeacherLesson[]) : []);
    } catch {
      setLessons([]);
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
      const room = await api.getVideoRoom(lesson.id);
      setActiveRoom(room);
      setActiveLesson(lesson);
    } catch (e) {
      setErr((e as Error).message || "Derse bağlanılamadı. Lütfen tekrar dene.");
    }
    setJoiningId(null);
  };

  if (activeLesson && activeRoom) {
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

  const upcoming = lessons.filter((l) => l.status !== "ended");
  const past = lessons.filter((l) => l.status === "ended");

  // Find live lesson for banner
  const liveLesson = upcoming.find((l) =>
    isLive(l.starts_at ?? l.scheduled_at ?? "", l.duration_minutes ?? 60)
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1800px] px-6 py-8 lg:px-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Canlı Dersler</h1>
            <p className="text-slate-600">Öğretmenlerinizle canlı derse katılın</p>
          </div>
          <button
            onClick={loadLessons}
            disabled={loading}
            className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Error Message */}
        {err && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-800 bg-red-950/50 p-4 text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {err}
          </div>
        )}

        {/* Live Banner */}
        {liveLesson && !dismissedBanner && (
          <div className="mb-8">
            <LiveBanner
              lessonTitle={liveLesson.title || liveLesson.class_room?.name || "Canlı Ders"}
              instructor={liveLesson.teacher?.name}
              participantCount={Math.floor(Math.random() * 50) + 10}
              onJoin={() => handleJoin(liveLesson)}
              onDismiss={() => setDismissedBanner(true)}
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-800/50" />
            ))}
          </div>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50">
              <Video className="h-12 w-12 text-indigo-500" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-slate-900">Henüz canlı ders yok</h3>
            <p className="max-w-md text-slate-600">
              Öğretmeniniz ders oluşturduğunda burada görünür
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Lessons */}
            {upcoming.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <Wifi className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Yaklaşan Dersler</h2>
                    <p className="text-sm text-slate-600">{upcoming.length} ders planlandı</p>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((lesson) => (
                    <UpcomingLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      onJoin={() => handleJoin(lesson)}
                      joining={joiningId === lesson.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Lessons (Recordings) */}
            {past.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <Play className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Ders Kayıtları</h2>
                    <p className="text-sm text-slate-600">
                      Geçmiş dersleri tekrar izleyin
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {past.slice(0, 10).map((lesson) => {
                    const recording_url = lesson.recording_url || lesson.daily_room_url;
                    return (
                      <div key={lesson.id}>
                        <VideoCard
                          id={lesson.id}
                          title={lesson.title || lesson.class_room?.name || "Canlı Ders"}
                          thumbnail={null}
                          duration={lesson.duration_minutes ? lesson.duration_minutes * 60 : 0}
                          instructor={lesson.teacher?.name}
                          date={new Date(lesson.starts_at ?? lesson.scheduled_at ?? "").toLocaleDateString(
                            "tr-TR",
                            { day: "numeric", month: "short" }
                          )}
                          onPlay={() => {
                            if (recording_url) window.open(recording_url, "_blank");
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
