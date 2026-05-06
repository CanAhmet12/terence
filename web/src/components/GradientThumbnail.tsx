"use client";

import { Clock } from "lucide-react";

interface GradientThumbnailProps {
  courseId?: number;
  videoId: number;
  title: string;
  duration?: number;
  className?: string;
}

const GRADIENTS = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-teal-500 via-emerald-500 to-green-500",
  "from-rose-500 via-pink-500 to-fuchsia-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-sky-500 via-blue-500 to-indigo-500",
  "from-violet-500 via-purple-500 to-indigo-500",
  "from-cyan-500 via-teal-500 to-emerald-500",
  "from-orange-500 via-red-500 to-rose-500",
];

const COURSE_EMOJIS: Record<string, string> = {
  matematik: "📐",
  math: "📐",
  türkçe: "✍️",
  turkish: "✍️",
  fizik: "⚛️",
  physics: "⚛️",
  kimya: "🧪",
  chemistry: "🧪",
  biyoloji: "🧬",
  biology: "🧬",
  tarih: "📜",
  history: "📜",
  coğrafya: "🌍",
  geography: "🌍",
  ingilizce: "🗣️",
  english: "🗣️",
  default: "📚",
};

function getEmojiForTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  for (const [key, emoji] of Object.entries(COURSE_EMOJIS)) {
    if (lowerTitle.includes(key)) return emoji;
  }
  return COURSE_EMOJIS.default;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GradientThumbnail({
  courseId = 0,
  videoId,
  title,
  duration,
  className = "",
}: GradientThumbnailProps) {
  const gradientIndex = (courseId + videoId) % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex];
  const emoji = getEmojiForTitle(title);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      {/* Dot Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Geometric Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`pattern-${videoId}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="white" fillOpacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#pattern-${videoId})`} />
        </svg>
      </div>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-6xl drop-shadow-lg md:text-7xl lg:text-8xl">{emoji}</div>
        <div className="mt-4 max-w-[80%] text-center">
          <p className="line-clamp-2 text-sm font-bold text-white drop-shadow-md md:text-base">
            {title}
          </p>
        </div>
      </div>

      {/* Duration Badge */}
      {duration && duration > 0 && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <Clock className="h-3 w-3" />
          {formatDuration(duration)}
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
    </div>
  );
}
