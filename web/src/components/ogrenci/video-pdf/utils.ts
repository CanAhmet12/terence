import type { UnifiedMediaItem } from "./types";

const POS_PREFIX = "media_pos_";
const LAST_PREFIX = "media_last_";
const RECENT_KEY = "media_recent_v1";
const FEATURED_SLUG_KEY = "media_hub_featured_slug";

export type RecentWatchEntry = {
  key: string;
  title: string;
  subjectName: string;
  subjectSlug: string;
  contentType: string;
  ts: number;
};

export function mediaPosKey(item: UnifiedMediaItem): string {
  return `${POS_PREFIX}${item.key}`;
}

export function mediaLastKey(item: UnifiedMediaItem): string {
  return `${LAST_PREFIX}${item.key}`;
}

export function getStoredSeconds(item: UnifiedMediaItem): number {
  if (typeof window === "undefined") return 0;
  const v = parseFloat(localStorage.getItem(mediaPosKey(item)) ?? "0");
  if (item.source === "course" && item.contentType === "video" && !v) {
    const legacy = parseFloat(localStorage.getItem(`video_pos_${item.id}`) ?? "0");
    return legacy || 0;
  }
  return v || 0;
}

export function setStoredSeconds(item: UnifiedMediaItem, seconds: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(mediaPosKey(item), String(seconds));
  localStorage.setItem(mediaLastKey(item), String(Date.now()));
  if (item.source === "course" && item.contentType === "video") {
    localStorage.setItem(`video_pos_${item.id}`, String(seconds));
    localStorage.setItem(`video_last_${item.id}`, String(Date.now()));
  }
}

export function clearStoredSeconds(item: UnifiedMediaItem): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(mediaPosKey(item));
}

export function readRecentWatches(): RecentWatchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentWatchEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentWatch(entry: RecentWatchEntry): void {
  if (typeof window === "undefined") return;
  const prev = readRecentWatches().filter((e) => e.key !== entry.key);
  prev.unshift(entry);
  const next = prev.slice(0, 24);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function readFeaturedSubjectSlug(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FEATURED_SLUG_KEY);
}

export function writeFeaturedSubjectSlug(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FEATURED_SLUG_KEY, slug);
}

export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const t = url.trim();
  if (!t) return null;
  return t.toLowerCase().replace(/\/+$/, "");
}

export function videoProgressRatio(item: UnifiedMediaItem): number {
  if (item.contentType !== "video") return 0;
  const dur = item.durationSeconds;
  if (!dur || dur <= 0) return 0;
  const pos = getStoredSeconds(item);
  return Math.min(1, Math.max(0, pos / dur));
}
