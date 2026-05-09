"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { studentApi } from "@/lib/api";
import type { TeacherLesson } from "@/lib/api";
import {
  Bell,
  Clock,
  Loader2,
  MoreHorizontal,
  Play,
  Users,
} from "lucide-react";

const PASTEL_GRADIENTS = [
  "from-orange-100 via-amber-50 to-white",
  "from-sky-100 via-blue-50 to-white",
  "from-violet-100 via-purple-50 to-white",
  "from-emerald-100 via-teal-50 to-white",
  "from-rose-100 via-pink-50 to-white",
  "from-amber-100 via-yellow-50 to-white",
];

const EMOJI: Record<string, string> = {
  türkçe: "📚",
  turkce: "📚",
  matematik: "📐",
  fizik: "⚛️",
  kimya: "🧪",
  biyoloji: "🧬",
  tarih: "🏛️",
  coğrafya: "🌍",
  default: "📖",
};

function heroEmoji(title: string): string {
  const t = title.toLowerCase();
  for (const [k, v] of Object.entries(EMOJI)) {
    if (k !== "default" && t.includes(k)) return v;
  }
  return EMOJI.default;
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

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function formatDatePill(iso: string): string {
  const rel = relativeDayLabel(iso);
  if (rel) return rel;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

function lessonTags(lesson: TeacherLesson): [string, string] {
  const raw = lesson.subject_tag?.trim();
  if (raw?.includes("·")) {
    const p = raw.split("·").map((x) => x.trim());
    if (p.length >= 2) return [p[0], p[1]];
  }
  if (raw?.includes(",")) {
    const p = raw.split(",").map((x) => x.trim());
    if (p.length >= 2) return [p[0], p[1]];
  }
  const s = raw || "TYT";
  const room = lesson.class_room?.name?.trim();
  return [s, room && room !== lesson.title ? room : "Konu özeti"];
}

function subjectForTeacher(lesson: TeacherLesson): string {
  const t = lesson.subject_tag || lesson.title || lesson.class_room?.name || "Ders";
  const first = t.split(/[\s,·]+/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "Ders";
}

function defaultRemindLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CardHero({
  lesson,
  startIso,
  live,
}: {
  lesson: TeacherLesson;
  startIso: string;
  live?: boolean;
}) {
  const title = lesson.title || lesson.class_room?.name || "Ders";
  const idx = (lesson.class_room?.id ?? 0) + lesson.id;
  const grad = PASTEL_GRADIENTS[Math.abs(idx) % PASTEL_GRADIENTS.length];
  const emoji = heroEmoji(title);

  return (
    <div className={`relative h-[168px] overflow-hidden bg-gradient-to-b ${grad}`}>
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)`,
          backgroundSize: "18px 18px",
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
            {startIso ? formatDatePill(startIso) : "—"}
          </span>
          <div className="flex items-center gap-1.5">
            {startIso && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold tabular-nums text-slate-800 shadow-sm">
                {formatTimeShort(startIso)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center pb-2">
          <span className="select-none text-[72px] leading-none drop-shadow-sm filter">{emoji}</span>
        </div>
        {live && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              Canlı
            </span>
          </div>
        )}
      </div>
    </div>
  );
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
  const live = lesson.status === "live" || (!!startIso && isLive(startIso, lesson.duration_minutes ?? 90));
  const soon = startIso ? isWithin15Min(startIso) : false;
  const canJoin = (live || soon) && !!startIso;

  const [remindOpen, setRemindOpen] = useState(false);
  const [remindAt, setRemindAt] = useState(defaultRemindLocal);
  const [remindSaving, setRemindSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

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

  const [tag1, tag2] = lessonTags(lesson);
  const title = lesson.title || lesson.class_room?.name || "Canlı Ders";
  const teacherName = lesson.teacher?.name ?? "Öğretmen";
  const subjectLine = subjectForTeacher(lesson);

  const inner = (
    <>
      {!compact && <CardHero lesson={lesson} startIso={startIso} live={live} />}

      <div className={`relative bg-white ${compact ? "p-4" : "px-5 pb-5 pt-4"}`}>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{tag1}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{tag2}</span>
        </div>

        <h3 className="mb-3 line-clamp-2 text-[17px] font-bold leading-snug tracking-tight text-slate-900">{title}</h3>

        <div className="mb-4 flex items-center gap-2 text-[13px] text-slate-700">
          {lesson.teacher?.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lesson.teacher.profile_photo_url}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[13px] font-bold text-indigo-700">
              {teacherName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 leading-tight">
            <p className="truncate font-semibold text-slate-900">{teacherName}</p>
            <p className="truncate text-[12px] text-slate-500">{subjectLine} Öğretmeni</p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
          {lesson.duration_minutes != null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              {lesson.duration_minutes} dk
            </span>
          )}
          {typeof lesson.participant_count === "number" && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              {lesson.participant_count} Katılımcı
            </span>
          )}
        </div>

        {canJoin ? (
          <button
            type="button"
            onClick={onJoin}
            disabled={joining}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3.5 text-[14px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(99,102,241,0.55)] transition hover:bg-indigo-600 disabled:opacity-70"
          >
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Bağlanıyor...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 shrink-0 fill-white" aria-hidden />
                Derse Katıl
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            {!remindOpen ? (
              <button
                type="button"
                onClick={() => setRemindOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#6366F1] bg-white py-3.5 text-[14px] font-bold text-[#6366F1] transition hover:bg-indigo-50"
              >
                <Bell className="h-4 w-4 shrink-0" aria-hidden />
                Hatırlatıcı Kur
              </button>
            ) : (
              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                <label className="text-[11px] font-bold text-slate-600">Hatırlatma zamanı</label>
                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReminder}
                    disabled={remindSaving}
                    className="flex-1 rounded-lg bg-[#6366F1] py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {remindSaving ? "…" : "Kaydet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemindOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (compact) {
    return (
      <div className="flex gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_15px_-3px_rgba(15,23,42,0.06)]">
        <div className="relative h-[120px] w-[132px] shrink-0 sm:w-[148px]">
          <CardHero lesson={lesson} startIso={startIso} live={live} />
        </div>
        <div className="min-w-0 flex-1 py-3 pr-3">{inner}</div>
      </div>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_15px_-3px_rgba(15,23,42,0.06)] transition hover:shadow-[0_14px_22px_-6px_rgba(15,23,42,0.08)]">
      <div className="relative">
        <div ref={menuRef} className="absolute right-3 top-3 z-10">
          <button
            type="button"
            className="rounded-lg bg-white/90 p-1.5 text-slate-600 shadow-sm backdrop-blur hover:bg-white"
            aria-expanded={menuOpen}
            aria-label="Ders seçenekleri"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-slate-100 bg-white py-1 text-sm shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setMenuOpen(false);
                  void navigator.clipboard.writeText(`${title} · ${startIso}`);
                  toast.success("Bilgi panoya kopyalandı");
                }}
              >
                Kısayolu kopyala
              </button>
            </div>
          )}
        </div>
        {inner}
      </div>
    </article>
  );
}
