"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, TeacherLesson, VideoRoom } from "@/lib/api";
import {
  Video, Calendar, Clock, Play, Users, Wifi, WifiOff,
  ExternalLink, AlertCircle, CheckCircle, Loader2, RefreshCw,
  Mic, MicOff, Camera, CameraOff, Monitor, Maximize2
} from "lucide-react";

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────
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
      setLoading(false);
      return;
    }
    try {
      const res = await api.getStudentUpcomingLessons();
      setLessons(Array.isArray(res) ? res as TeacherLesson[] : []);
    } catch {
      setLessons([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

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
    return <LiveClassRoom lesson={activeLesson} room={activeRoom} onClose={() => { setActiveLesson(null); setActiveRoom(null); }} />;
  }

  const upcoming = lessons.filter((l) => l.status !== "ended");
  const past = lessons.filter((l) => l.status === "ended");

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full px-6 py-8 space-y-8">

        {/* ── Başlık ── */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Canlı Dersler</h1>
          <p className="text-slate-500 mt-1 font-medium">Öğretmenin oluşturduğu canlı derslere katıl</p>
        </div>

        {/* ── Hata ── */}
        {err && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {err}
          </div>
        )}

        {/* ── Yaklaşan / Canlı Dersler ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Video className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              Yaklaşan Dersler
            </h2>
            <button
              onClick={loadLessons}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-100 rounded-xl animate-pulse w-48" />
                      <div className="h-4 bg-slate-100 rounded-xl animate-pulse w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
                <Video className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">Yaklaşan ders yok</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                Öğretmenin ders oluşturduğunda burada görünür
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((lesson) => {
                const live = isLive(lesson.starts_at ?? lesson.scheduled_at ?? "", lesson.duration_minutes ?? 60);
                const soon = isWithin15Min(lesson.starts_at ?? lesson.scheduled_at ?? "");
                const joining = joiningId === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${
                      live
                        ? "border-emerald-400 shadow-emerald-500/10 bg-emerald-50/30"
                        : soon
                        ? "border-amber-300"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* İkon */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                          live ? "bg-emerald-100" : "bg-indigo-50"
                        }`}>
                          {live ? (
                            <Wifi className="w-7 h-7 text-emerald-600" />
                          ) : (
                            <Video className="w-7 h-7 text-indigo-600" />
                          )}
                        </div>

                        {/* Bilgi */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-slate-900">
                              {lesson.title || lesson.class_room?.name || "Canlı Ders"}
                            </h3>
                            {live && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                CANLI
                              </span>
                            )}
                            {soon && !live && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                <Clock className="w-3 h-3" />
                                Az kaldı
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {fmtDate(lesson.starts_at ?? lesson.scheduled_at ?? "")}
                            </span>
                            {lesson.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {lesson.duration_minutes} dk
                              </span>
                            )}
                          </div>
                          {!live && (
                            <p className="text-xs text-indigo-600 font-semibold mt-1">
                              {timeUntil(lesson.starts_at ?? lesson.scheduled_at ?? "")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Aksiyon */}
                      {(live || soon) && (lesson.daily_room_url || lesson.class_room) ? (
                        <button
                          onClick={() => handleJoin(lesson)}
                          disabled={joining}
                          className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70 ${
                            live
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25"
                          }`}
                        >
                          {joining ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Bağlanıyor...</>
                          ) : (
                            <><Play className="w-4 h-4" fill="white" /> Derse Katıl</>
                          )}
                        </button>
                      ) : lesson.daily_room_url ? (
                        <a
                          href={lesson.daily_room_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Linki Aç
                        </a>
                      ) : (
                        <span className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-medium">
                          <WifiOff className="w-4 h-4" />
                          Bekleniyor
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Bilgi kutuları ── */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Mic,     title: "Mikrofon & Kamera",  desc: "Tarayıcı izni gereklidir. İlk açılışta onay ver." },
            { icon: Monitor, title: "Ekran Paylaşımı",    desc: "Öğretmen istek gönderdiğinde paylaşabilirsin." },
            { icon: Users,   title: "Soru Sor",           desc: "Ders sırasında el kaldır veya soru kutusunu kullan." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Geçmiş Dersler ── */}
        {past.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <CheckCircle className="w-4.5 h-4.5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Geçmiş Dersler</h3>
              <span className="ml-auto text-xs text-slate-400">{past.length} ders</span>
            </div>
            <div className="divide-y divide-slate-50">
              {past.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{l.title || l.class_room?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(l.starts_at ?? l.scheduled_at ?? "")}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                    Tamamlandı
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



