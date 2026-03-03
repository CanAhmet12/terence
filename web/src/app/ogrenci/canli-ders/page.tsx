"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, TeacherLesson, VideoRoom } from "@/lib/api";
import {
  Video, Calendar, Clock, Play, Users, Wifi, WifiOff,
  ExternalLink, AlertCircle, CheckCircle, Loader2, RefreshCw,
  Mic, MicOff, Camera, CameraOff, Monitor, Maximize2
} from "lucide-react";

// ─── Demo verisi ──────────────────────────────────────────────────────────────
const DEMO_LESSONS: TeacherLesson[] = [
  {
    id: 1, title: "Matematik — Limit ve Türev",
    scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    duration_minutes: 45, daily_room_url: "https://terence.daily.co/demo-room", status: "scheduled",
    class_room: { id: 1, name: "10-A Matematik" },
  },
  {
    id: 2, title: "Fizik — Hareket",
    scheduled_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 40, status: "scheduled",
    class_room: { id: 2, name: "11-A Fizik" },
  },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }) +
    " · " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
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

// ─── Canlı ders iframe bileşeni ───────────────────────────────────────────────
function LiveClassRoom({
  lesson, room, onClose,
}: { lesson: TeacherLesson; room: VideoRoom | null; onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Üst bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-semibold text-sm">{lesson.title || lesson.class_room?.name}</span>
          <span className="text-slate-400 text-xs">{lesson.duration_minutes} dk</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Tam Ekran
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
          >
            Dersten Çık
          </button>
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={roomUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
          allowFullScreen
          className="w-full h-full border-0"
          title="Canlı Ders"
        />
      </div>

      {/* Alt bilgi çubuğu */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-t border-slate-700 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <Mic className="w-3.5 h-3.5" />
          <Camera className="w-3.5 h-3.5" />
          <Monitor className="w-3.5 h-3.5" />
          Kamera, mikrofon ve ekran paylaşımı aktif
        </span>
        <span>Terence Eğitim — Güvenli Bağlantı</span>
      </div>
    </div>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────
export default function OgrenciCanliDersPage() {
  const { token } = useAuth();


  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<TeacherLesson | null>(null);
  const [activeRoom, setActiveRoom] = useState<VideoRoom | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const loadLessons = useCallback(async () => {
    if (!token) {
      setLessons(DEMO_LESSONS);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getStudentUpcomingLessons(token);
      setLessons(res);
    } catch {
      setLessons(DEMO_LESSONS);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  const handleJoin = async (lesson: TeacherLesson) => {
    setJoiningId(lesson.id);
    setErr("");
    try {
      if (token) {
        const room = await api.getVideoRoom(token, lesson.id);
        setActiveRoom(room);
      } else {
        setActiveRoom({ room_url: lesson.daily_room_url || "https://terence.daily.co/demo" });
      }
      setActiveLesson(lesson);
    } catch (e) {
      setErr((e as Error).message || "Derse bağlanılamadı. Lütfen tekrar dene.");
    }
    setJoiningId(null);
  };

  if (activeLesson && activeRoom) {
    return <LiveClassRoom lesson={activeLesson} room={activeRoom} onClose={() => { setActiveLesson(null); setActiveRoom(null); }} />;
  }

  const upcoming = lessons.filter((l) => l.status !== "ended");
  const past = lessons.filter((l) => l.status === "ended");

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Canlı Dersler</h1>
        <p className="text-slate-600 mt-1">Öğretmenin oluşturduğu canlı derslere buradan katıl.</p>
      </div>

      {err && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {err}
        </div>
      )}

      {/* Yaklaşan / Canlı dersler */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-teal-600" />
            Yaklaşan Dersler
          </h2>
          <button onClick={loadLessons} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-12 text-center">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-500">Yaklaşan ders yok</p>
            <p className="text-sm text-slate-400 mt-1">Öğretmenin ders oluşturduğunda burada görünür.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((lesson) => {
              const live = isLive(lesson.scheduled_at ?? "", lesson.duration_minutes ?? 60);
              const soon = isWithin15Min(lesson.scheduled_at ?? "");
              const joining = joiningId === lesson.id;

              return (
                <div
                  key={lesson.id}
                  className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${
                    live ? "border-green-400 shadow-green-500/10" :
                    soon ? "border-amber-300" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        live ? "bg-green-100" : "bg-teal-50"
                      }`}>
                        {live ? (
                          <Wifi className="w-7 h-7 text-green-600" />
                        ) : (
                          <Video className="w-7 h-7 text-teal-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{lesson.title || lesson.class_room?.name}</h3>
                          {live && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              CANLI
                            </span>
                          )}
                          {soon && !live && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                              Az kaldı
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {fmtDate(lesson.scheduled_at ?? "")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {lesson.duration_minutes} dk
                          </span>
                        </p>
                        {!live && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeUntil(lesson.scheduled_at ?? "")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Katıl butonu */}
                    {(live || soon) && lesson.daily_room_url ? (
                      <button
                        onClick={() => handleJoin(lesson)}
                        disabled={joining}
                        className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                          live
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
                            : "bg-teal-600 hover:bg-teal-700 text-white shadow-md"
                        } disabled:opacity-70`}
                      >
                        {joining ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Bağlanıyor...</>
                        ) : (
                          <><Play className="w-4 h-4" /> Derse Katıl</>
                        )}
                      </button>
                    ) : lesson.daily_room_url ? (
                      <a
                        href={lesson.daily_room_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-teal-300 hover:text-teal-600 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Linki Aç
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-slate-400 flex items-center gap-1">
                        <WifiOff className="w-4 h-4" /> Bekleniyor
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bilgi kutusu */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Mic, title: "Mikrofon & Kamera", desc: "Tarayıcı izni gereklidir. İlk açılışta onay ver." },
          { icon: Monitor, title: "Ekran Paylaşımı", desc: "Öğretmen istek gönderdiğinde paylaşabilirsin." },
          { icon: Users, title: "Soru Sor", desc: "Ders sırasında el kaldır veya soru kutusunu kullan." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Geçmiş dersler */}
      {past.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-slate-400" />
              Geçmiş Dersler
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {past.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{l.title || l.class_room?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(l.scheduled_at ?? "")}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                  Tamamlandı
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



