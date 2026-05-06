"use client";

import { useState } from "react";
import { Play, Clock, Bookmark, Share2, MoreVertical, Lock } from "lucide-react";
import Image from "next/image";

export interface VideoCardProps {
  id: number;
  title: string;
  thumbnail: string | null;
  duration: number; // seconds
  progress?: number; // 0-100
  instructor?: string;
  date?: string;
  isLive?: boolean;
  isPro?: boolean;
  locked?: boolean;
  onPlay: () => void;
  onSave?: () => void;
  onShare?: () => void;
  className?: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoCard({
  id,
  title,
  thumbnail,
  duration,
  progress = 0,
  instructor,
  date,
  isLive = false,
  isPro = false,
  locked = false,
  onPlay,
  onSave,
  onShare,
  className = "",
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!locked) onPlay();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.();
    setShowMenu(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.();
    setShowMenu(false);
  };

  return (
    <div
      className={`group relative flex-shrink-0 cursor-pointer transition-all duration-200 ease-out ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      onClick={handlePlay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlePlay(e as unknown as React.MouseEvent);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Play ${title}`}
    >
      {/* Main Card Container */}
      <div
        className={`relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 ${
          isHovered && !locked ? "shadow-lg" : ""
        }`}
      >
        {/* Thumbnail Container - 16:9 aspect ratio */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
          {thumbnail && !imageError ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Play className="h-16 w-16 text-slate-600" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200 ${
              isHovered ? "opacity-100" : "opacity-40"
            }`}
          />

          {/* Live Badge */}
          {isLive && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 shadow-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              <span className="text-xs font-bold text-white">CANLI</span>
            </div>
          )}

          {/* Pro Badge */}
          {isPro && !isLive && (
            <div className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              PRO
            </div>
          )}

          {/* Duration Badge */}
          {duration > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Clock className="h-3 w-3" />
              {formatDuration(duration)}
            </div>
          )}

          {/* Play Button Overlay - Appears on Hover */}
          {isHovered && !locked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handlePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-2xl transition-all hover:scale-110 hover:bg-white"
                aria-label="Play video"
              >
                <Play className="h-8 w-8 text-slate-900" fill="currentColor" />
              </button>
            </div>
          )}

          {/* Locked Overlay */}
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Lock className="h-8 w-8 text-white" />
                <span className="text-sm font-semibold text-white">Pro İçerik</span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/50">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Quick Actions Menu - Top Right on Hover */}
          {isHovered && !locked && (onSave || onShare) && (
            <div className="absolute right-3 top-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/80"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-lg bg-slate-900 py-1 shadow-2xl ring-1 ring-white/10">
                  {onSave && (
                    <button
                      onClick={handleSave}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
                    >
                      <Bookmark className="h-4 w-4" />
                      Kaydet
                    </button>
                  )}
                  {onShare && (
                    <button
                      onClick={handleShare}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
                    >
                      <Share2 className="h-4 w-4" />
                      Paylaş
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Info - Always Visible */}
        <div className="p-3">
          {/* Title */}
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {title}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            {instructor && <span>{instructor}</span>}
            {instructor && date && <span>•</span>}
            {date && <span>{date}</span>}
            {progress > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold text-indigo-600">{Math.round(progress)}% izlendi</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
