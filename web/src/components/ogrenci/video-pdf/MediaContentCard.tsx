"use client";

import { BookMarked, FileText, Link2, Lock, MoreVertical, Play, Video } from "lucide-react";
import type { UnifiedMediaItem } from "./types";
import { getStoredSeconds, videoProgressRatio } from "./utils";

function userHasProAccess(subscriptionPlan?: string | null): boolean {
  if (!subscriptionPlan) return false;
  return subscriptionPlan !== "free";
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PRESET_GRADIENTS: [string, string][] = [
  ["#7c3aed", "#4f46e5"],
  ["#ea580c", "#f97316"],
  ["#db2777", "#ec4899"],
  ["#059669", "#10b981"],
];

function presetGradient(index: number): { from: string; to: string } {
  const [from, to] = PRESET_GRADIENTS[Math.abs(index) % PRESET_GRADIENTS.length]!;
  return { from, to };
}

function accentFromColor(hex: string | null | undefined, index: number): { from: string; to: string } {
  if (hex && /^#[0-9A-Fa-f]{6}$/i.test(hex)) {
    return { from: hex, to: hex };
  }
  return presetGradient(index);
}

type Props = {
  item: UnifiedMediaItem;
  subscriptionPlan?: string | null;
  onOpen: (item: UnifiedMediaItem) => void;
  /** Mock’taki gibi kartlar farklı vurgu renkleri */
  cardIndex?: number;
  /** Öğrenci profili — içerik etiketi boşsa rozet için kullanılır */
  profileGrade?: number | string | null;
  profileTargetExam?: string | null;
};

function formatGradeBadge(grade: string | number | null | undefined): string {
  if (grade === null || grade === undefined || grade === "") return "Müfredat";
  const s = String(grade).trim().toLowerCase();
  if (s === "mezun" || s === "0" || grade === 0) return "Mezun";
  const n = String(grade).replace(/\D/g, "");
  return n ? `${n}. Sınıf` : "Müfredat";
}

function examBadgeFromProfile(target?: string | null): string {
  const t = (target ?? "").toUpperCase();
  if (t === "GENEL" || t === "") return "Okul";
  if (t.includes("TYT") && t.includes("AYT")) return "TYT+AYT";
  return t.slice(0, 6) || "Genel";
}

export function MediaContentCard({
  item,
  subscriptionPlan,
  onOpen,
  cardIndex = 0,
  profileGrade,
  profileTargetExam,
}: Props) {
  const locked = !item.isFree && !userHasProAccess(subscriptionPlan);
  const progressPct =
    item.contentType === "video" && item.durationSeconds > 0
      ? Math.round(videoProgressRatio(item) * 100)
      : 0;
  const pos = getStoredSeconds(item);
  const thumb = item.thumbnailUrl;
  const { from, to } = accentFromColor(item.subjectColor, cardIndex);
  const examShort =
    item.examType && item.examType !== "all"
      ? String(item.examType).replace(/\s+/g, "").slice(0, 6).toUpperCase()
      : examBadgeFromProfile(profileTargetExam ?? undefined);
  const gradeBadge =
    item.grade && item.grade !== "all" && item.grade !== ""
      ? `${String(item.grade).replace(/\D/g, "") || item.grade}. Sınıf`
      : formatGradeBadge(profileGrade);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/30 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="relative block aspect-[16/10] w-full overflow-hidden text-left"
          aria-label={`${item.title} aç`}
        >
        {locked ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-950 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
              <Lock className="h-8 w-8" aria-hidden />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">PRO</span>
          </div>
        ) : item.contentType === "pdf" ? (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-white"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            <FileText className="h-14 w-14 opacity-95" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">PDF</span>
          </div>
        ) : item.contentType === "text" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-600 to-slate-800 text-white">
            <Link2 className="h-12 w-12" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wide">Bağlantı</span>
          </div>
        ) : thumb ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-white"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            <div className="relative flex flex-col items-center gap-2">
              <BookMarked className="h-14 w-14 opacity-95 drop-shadow-md" aria-hidden />
              <Video className="absolute -bottom-1 h-8 w-8 text-white/90 drop-shadow" aria-hidden />
            </div>
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {gradeBadge}
          </span>
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-violet-800 shadow-sm">
            {examShort}
          </span>
          {!item.isFree && (
            <span className="rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-sm">PRO</span>
          )}
        </div>

        {item.contentType === "video" && item.durationSeconds > 0 && !locked && (
          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/65 px-2 py-0.5 text-xs font-bold text-white">
            {formatDuration(item.durationSeconds)}
          </span>
        )}

        {!locked && (
          <span className="absolute bottom-2.5 left-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-violet-700 shadow-lg ring-2 ring-white/80">
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden />
          </span>
        )}
      </button>
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
          aria-label="Kart menüsü"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 flex-col border-t border-slate-100/80 p-3.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">{item.title}</h3>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-violet-700/90">{item.subjectName}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.topicTitle}</p>
        {item.contentType === "video" && item.durationSeconds > 0 && (
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-500">{formatDuration(item.durationSeconds)}</span>
            <span className="font-bold text-slate-800">%{pos > 0 ? progressPct : 0}</span>
          </div>
        )}
        {item.contentType === "video" && item.durationSeconds > 0 && pos > 0 && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
    </article>
  );
}
