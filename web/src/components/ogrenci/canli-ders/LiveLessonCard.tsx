"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { studentApi } from "@/lib/api";
import type { TeacherLesson } from "@/lib/api";
import { GradientThumbnail } from "@/components/GradientThumbnail";
import { Calendar, Clock, Play, Video, Loader2, Bell } from "lucide-react";

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

function defaultRemindLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function relativeDayLabel(iso: string): string | null {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  return null;
}

export function LiveLessonCard({
  lesson,
  onJoin,
  joining,
  compact,
}: {
  lesson: TeacherLesson;
  onJoin: () => void;
  joining: boolean;
  compact?: boolean;
}) {
  const startIso = lesson.starts_at ?? lesson.scheduled_at ?? "";
  const dayBadge = startIso ? relativeDayLabel(startIso) : null;
  const live = lesson.status === "live" || (startIso && isLive(startIso, lesson.duration_minutes ?? 90));
  const soon = startIso ? isWithin15Min(startIso) : false;
  const canJoin = (live || soon) && !!startIso;

  const [remindOpen, setRemindOpen] = useState(false);
  const [remindAt, setRemindAt] = useState(defaultRemindLocal);
  const [remindSaving, setRemindSaving] = useState(false);

  const handleReminder = async () => {
    const iso = new Date(remindAt).toISOString();
    if (new Date(iso) <= new Date()) {
      toast.error("Hatırlatma zamanı şu andan sonra olmalıdır.");
      return;
    }
    setRemindSaving(true);
    try {
      await studentApi.setLiveLessonReminder(lesson.id, { remind_at: iso, channel: "in_app" });
      toast.success("Hatırlatıcı kaydedildi");
      setRemindOpen(false);
    } catch {
      toast.error("Hatırlatıcı kaydedilemedi");
    } finally {
      setRemindSaving(false);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md ${
        live ? "ring-2 ring-emerald-500" : ""
      } ${compact ? "flex flex-row sm:flex-col" : ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50" />
      <div className={`relative p-4 ${compact ? "flex flex-1 flex-col sm:block" : ""}`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <Calendar className="h-3 w-3" />
              {startIso
                ? new Date(startIso).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                  })
                : "—"}
            </div>
            {dayBadge && (
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                {dayBadge}
              </span>
            )}
          </div>
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
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Yaklaşan</div>
          )}
        </div>

        {!compact && (
          <div className="mb-3">
            <GradientThumbnail
              courseId={lesson.class_room?.id}
              videoId={lesson.id}
              title={lesson.title || lesson.class_room?.name || "Canlı Ders"}
              duration={lesson.duration_minutes ? lesson.duration_minutes * 60 : undefined}
            />
          </div>
        )}

        {lesson.subject_tag && (
          <span className="mb-2 inline-block rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
            {lesson.subject_tag}
          </span>
        )}

        <h3 className="mb-2 line-clamp-2 text-base font-bold text-slate-900">
          {lesson.title || lesson.class_room?.name || "Canlı Ders"}
        </h3>

        <div className="mb-3 space-y-1 text-xs text-slate-600">
          {startIso && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>{fmtDate(startIso)}</span>
            </div>
          )}
          {lesson.duration_minutes != null && (
            <div className="flex items-center gap-2">
              <Video className="h-3.5 w-3.5" />
              <span>{lesson.duration_minutes} dakika</span>
            </div>
          )}
          {lesson.teacher?.name && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Öğretmen:</span>
              {lesson.teacher.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lesson.teacher.profile_photo_url}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : null}
              <span>{lesson.teacher.name}</span>
            </div>
          )}
          {typeof lesson.participant_count === "number" && (
            <div className="text-slate-500">Katılımcı: {lesson.participant_count}</div>
          )}
          {!live && startIso && (
            <div className="mt-2 text-xs font-semibold text-indigo-600">{timeUntil(startIso)}</div>
          )}
        </div>

        {canJoin ? (
          <button
            type="button"
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
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-3 text-sm font-medium text-slate-600">
            <Clock className="h-4 w-4" />
            Bekleniyor
          </div>
        )}

        <div className="mt-2">
          {!remindOpen ? (
            <button
              type="button"
              onClick={() => setRemindOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Bell className="h-3.5 w-3.5" />
              Hatırlatıcı kur
            </button>
          ) : (
            <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
              <label className="text-[11px] font-bold text-slate-600">Hatırlatma zamanı</label>
              <input
                type="datetime-local"
                value={remindAt}
                onChange={(e) => setRemindAt(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReminder}
                  disabled={remindSaving}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {remindSaving ? "…" : "Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setRemindOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
