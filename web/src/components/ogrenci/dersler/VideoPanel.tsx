"use client";

import { ExternalLink, Play } from "lucide-react";
import { extractYouTubeId, extractVimeoId } from "@/lib/api";

export function VideoPanel({ url }: { url: string }) {
  const youtubeId = extractYouTubeId(url);
  const vimeoId = extractVimeoId(url);

  if (youtubeId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Konu videosu"
      />
    );
  }

  if (vimeoId) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}`}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Konu videosu"
      />
    );
  }

  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return <video src={url} controls className="h-full w-full" controlsList="nodownload" title="Konu videosu" />;
  }

  return (
    <div className="flex h-full items-center justify-center text-white">
      <div className="text-center px-4">
        <ExternalLink className="mx-auto mb-2 h-12 w-12 opacity-50" aria-hidden />
        <p className="mb-4 text-sm">Bu video adresi yerleşik oynatıcıda açılamıyor.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
        >
          <Play className="h-4 w-4" />
          Yeni sekmede aç
        </a>
      </div>
    </div>
  );
}
