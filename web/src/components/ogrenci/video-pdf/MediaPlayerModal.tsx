"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Play, X } from "lucide-react";
import api, { extractVimeoId, extractYouTubeId } from "@/lib/api";
import type { UnifiedMediaItem } from "./types";
import { clearStoredSeconds, mediaPosKey, setStoredSeconds } from "./utils";
import { PdfPageBookViewer } from "@/components/ogrenci/dersler/PdfPageBookViewer";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function userHasProAccess(subscriptionPlan?: string | null): boolean {
  if (!subscriptionPlan) return false;
  return subscriptionPlan !== "free";
}

export function MediaPlayerModal({
  item,
  token,
  subscriptionPlan,
  onClose,
}: {
  item: UnifiedMediaItem;
  token: string | null;
  subscriptionPlan?: string | null;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const locked = !item.isFree && !userHasProAccess(subscriptionPlan);
  const storageKey = mediaPosKey(item);
  const savedPos =
    typeof window !== "undefined" ? parseFloat(localStorage.getItem(storageKey) ?? "0") : 0;

  const rawUrl = item.playbackUrl || item.url;
  const videoUrl = rawUrl ?? "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !savedPos) return;
    const onLoaded = () => {
      if (savedPos > 5) vid.currentTime = savedPos;
    };
    vid.addEventListener("loadedmetadata", onLoaded);
    return () => vid.removeEventListener("loadedmetadata", onLoaded);
  }, [savedPos]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = playbackRate;
  }, [playbackRate]);

  const persistTime = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || item.contentType !== "video") return;
    setStoredSeconds(item, vid.currentTime);
  }, [item]);

  const handleTimeUpdate = useCallback(() => {
    persistTime();
  }, [persistTime]);

  const handlePause = useCallback(() => {
    persistTime();
  }, [persistTime]);

  const handleEnded = useCallback(async () => {
    clearStoredSeconds(item);
    if (item.curriculumTopicId && token) {
      try {
        await api.updateCurriculumProgress(item.curriculumTopicId, "completed");
      } catch (e) {
        console.error("updateCurriculumProgress failed", e);
      }
    }
  }, [item, token]);

  const youtubeId = videoUrl && extractYouTubeId(videoUrl);
  const vimeoId = !youtubeId && videoUrl ? extractVimeoId(videoUrl) : null;
  const isEmbedStream = Boolean(youtubeId || vimeoId);
  const isNativeVideo =
    item.contentType === "video" && videoUrl && !isEmbedStream && !videoUrl.includes("youtube") && !videoUrl.includes("youtu.be") && !videoUrl.includes("vimeo.com");

  const iframeTitle = `Video oynatıcı: ${item.title}`;
  const embedSrc = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`
    : vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}`
      : null;

  if (locked) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-modal-locked-title"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-2xl border border-violet-500/30 bg-slate-900 p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p id="media-modal-locked-title" className="text-lg font-bold text-white">
            Bu içerik PRO plana özel
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Tam erişim için paketinizi yükseltebilirsiniz.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/paketler"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Paketleri gör
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Play className="h-5 w-5 shrink-0 text-violet-400" fill="currentColor" aria-hidden />
            <p id="media-modal-title" className="truncate font-semibold text-white">
              {item.title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isNativeVideo && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSpeedMenu((p) => !p)}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[80px] rounded-xl border border-slate-700 bg-slate-800 py-1 shadow-lg">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          setPlaybackRate(s);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-4 py-1.5 text-center text-sm transition-colors ${
                          playbackRate === s
                            ? "font-semibold text-violet-400"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="aspect-video bg-black">
          {item.contentType === "pdf" && (rawUrl || (item.pdfPageUrls?.length ?? 0) > 0) ? (
            <div className="flex h-full min-h-[320px] w-full flex-col bg-slate-900">
              <PdfPageBookViewer
                pageUrls={item.pdfPageUrls ?? []}
                pdfUrl={rawUrl ?? null}
                title={item.title}
              />
            </div>
          ) : item.contentType === "text" && rawUrl ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-slate-300">Bu içerik harici bir bağlantıdır.</p>
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Bağlantıyı aç
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </div>
          ) : item.contentType === "video" && embedSrc ? (
            <iframe
              src={embedSrc}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              title={iframeTitle}
              aria-label={iframeTitle}
            />
          ) : isNativeVideo ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              autoPlay
              onTimeUpdate={handleTimeUpdate}
              onPause={handlePause}
              onEnded={handleEnded}
              className="h-full w-full"
              controlsList="nodownload"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-slate-400">
              <p>Bu içerik türü için oynatıcı kullanılamıyor.</p>
              {rawUrl ? (
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-violet-400 underline"
                >
                  Kaynağı yeni sekmede aç
                </a>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-800/60 px-5 py-3 text-xs text-slate-400">
          {item.topicTitle && (
            <span>
              Konu: <strong className="text-slate-200">{item.topicTitle}</strong>
            </span>
          )}
          {item.source === "curriculum" && (
            <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 font-medium text-indigo-200">
              Müfredat
            </span>
          )}
          {item.source === "course" && (
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-medium text-amber-200">Kurs</span>
          )}
          {item.durationSeconds > 0 && item.contentType === "video" && (
            <span>Süre: {formatDuration(item.durationSeconds)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
