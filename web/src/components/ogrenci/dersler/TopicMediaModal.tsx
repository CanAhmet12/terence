"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { VideoPanel } from "./VideoPanel";
import type { ContentListItem } from "./TopicContentList";
import { PdfPageBookViewer } from "./PdfPageBookViewer";

function formatDuration(sec?: number) {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TopicMediaModal({
  item,
  open,
  onClose,
}: {
  item: ContentListItem | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  const hasVideo = item.type === "video" && !!item.url;
  const hasPdf =
    item.type === "pdf" && (!!item.url || (item.pdf_page_urls?.length ?? 0) > 0);
  const dur = formatDuration(item.duration_seconds);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="topic-media-title">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-label="Kapat" onClick={onClose} />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="topic-media-title" className="text-base font-bold text-slate-900 sm:text-lg">
              {item.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              {item.type === "video" ? "Video" : item.type === "pdf" ? "PDF" : item.type === "quiz" ? "Etkinlik" : "İçerik"}
              {dur ? ` · ${dur}` : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-50">
          {hasVideo ? (
            <div className="aspect-video w-full bg-black">
              <VideoPanel url={item.url!} />
            </div>
          ) : hasPdf ? (
            <div className="flex h-[min(78dvh,720px)] min-h-[280px] w-full flex-col bg-white">
              <PdfPageBookViewer
                pageUrls={item.pdf_page_urls ?? []}
                pdfUrl={item.url ?? null}
                title={item.title}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-slate-600">
              <p>Bu içerik için oynatılabilir adres bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
