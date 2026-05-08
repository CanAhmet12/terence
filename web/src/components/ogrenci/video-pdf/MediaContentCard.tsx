"use client";

import { FileText, Link2, Lock, Play, Video } from "lucide-react";
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

type Props = {
  item: UnifiedMediaItem;
  subscriptionPlan?: string | null;
  onOpen: (item: UnifiedMediaItem) => void;
};

export function MediaContentCard({ item, subscriptionPlan, onOpen }: Props) {
  const locked = !item.isFree && !userHasProAccess(subscriptionPlan);
  const progressPct =
    item.contentType === "video" && item.durationSeconds > 0
      ? Math.round(videoProgressRatio(item) * 100)
      : 0;
  const pos = getStoredSeconds(item);

  const thumb = item.thumbnailUrl;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="relative block aspect-video w-full overflow-hidden bg-slate-900 text-left"
        aria-label={`${item.title} aç`}
      >
        {item.contentType === "pdf" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-indigo-950 text-indigo-100">
            <FileText className="h-12 w-12" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">PDF</span>
          </div>
        ) : item.contentType === "text" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-800 text-slate-100">
            <Link2 className="h-12 w-12" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Bağlantı</span>
          </div>
        ) : thumb ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900 to-violet-900 text-white">
            <Video className="h-14 w-14 opacity-90" aria-hidden />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <span className="rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {item.source === "curriculum" ? "Müfredat" : "Kurs"}
          </span>
          {!item.isFree && (
            <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              PRO
            </span>
          )}
          {item.grade ? (
            <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
              {item.grade}
            </span>
          ) : null}
        </div>

        {item.contentType === "video" && item.durationSeconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
            {formatDuration(item.durationSeconds)}
          </span>
        )}

        <span className="absolute bottom-2 left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-indigo-700 shadow-md">
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden />
        </span>

        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 text-white backdrop-blur-[1px]">
            <Lock className="mb-1 h-8 w-8" aria-hidden />
            <span className="text-xs font-semibold">Kilitli</span>
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{item.title}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.subjectName}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{item.topicTitle}</p>
        {item.contentType === "video" && item.durationSeconds > 0 && pos > 0 && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-600"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
