"use client";

import { Play, X, Users } from "lucide-react";

interface LiveBannerProps {
  lessonTitle: string;
  instructor?: string;
  participantCount?: number;
  onJoin: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function LiveBanner({
  lessonTitle,
  instructor,
  participantCount,
  onJoin,
  onDismiss,
  className = "",
}: LiveBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 p-6 shadow-2xl ${className}`}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute h-full w-full animate-pulse">
          <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-white blur-3xl" />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between gap-6">
        {/* Left Side - Info */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            {/* Pulsing Live Indicator */}
            <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <span className="text-sm font-bold text-white">CANLI DERS</span>
            </div>

            {/* Participant Count */}
            {participantCount !== undefined && (
              <div className="flex items-center gap-1.5 text-white/90">
                <Users className="h-4 w-4" />
                <span className="text-sm font-semibold">{participantCount} katılımcı</span>
              </div>
            )}
          </div>

          <h2 className="mb-1 text-2xl font-black text-white">{lessonTitle}</h2>
          
          {instructor && (
            <p className="text-sm font-medium text-white/80">Öğretmen: {instructor}</p>
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          {/* Join Button */}
          <button
            onClick={onJoin}
            className="group flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-base font-bold text-red-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
          >
            <Play className="h-5 w-5 transition-transform group-hover:scale-110" fill="currentColor" />
            Hemen Katıl
          </button>

          {/* Dismiss Button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
