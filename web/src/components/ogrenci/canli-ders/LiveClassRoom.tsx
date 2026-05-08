"use client";

import { useRef, useState } from "react";
import type { TeacherLesson, VideoRoom } from "@/lib/api";
import { Maximize2, Mic, Camera, Monitor } from "lucide-react";

export function LiveClassRoom({
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

  const title = lesson.title || lesson.class_room?.name || "Canlı Ders";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-classroom-title"
    >
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
          <span id="live-classroom-title" className="text-sm font-semibold text-white">
            {title}
          </span>
          <span className="text-xs text-slate-400">{lesson.duration_minutes} dk</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Tam ekran"
            className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-600"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Tam Ekran
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dersten çık ve canlı ders penceresini kapat"
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
