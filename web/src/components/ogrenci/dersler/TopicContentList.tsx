"use client";

import Link from "next/link";
import { Play, FileText, PenLine } from "lucide-react";
import { getVideoThumbnail } from "@/lib/api";

export type ContentListItem = {
  id: number;
  type: "video" | "pdf" | "quiz" | "text";
  title: string;
  url?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  is_free?: boolean;
};

export function TopicContentList({
  items,
  activeId,
  onSelect,
  topicTitle,
  mebCode,
  accentColor,
  filter,
  onFilterChange,
}: {
  items: ContentListItem[];
  activeId: number | null;
  onSelect: (item: ContentListItem) => void;
  topicTitle: string;
  mebCode?: string | null;
  accentColor: string;
  filter: "all" | "video" | "pdf";
  onFilterChange: (f: "all" | "video" | "pdf") => void;
}) {
  const practiceHref = `/ogrenci/soru-bankasi?topic=${encodeURIComponent(topicTitle)}${mebCode ? `&kazanim=${encodeURIComponent(mebCode)}` : ""}`;

  const visible = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "video") return item.type === "video";
    if (filter === "pdf") return item.type === "pdf";
    return true;
  });

  return (
    <section aria-labelledby="topic-content-list-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="topic-content-list-heading" className="text-lg font-bold text-slate-900">
          {items.length > 0 ? `Konu içeriği (${visible.length})` : "Konu içeriği"}
        </h2>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="İçerik türü">
            {(["all", "video", "pdf"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => onFilterChange(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f ? "text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                style={filter === f ? { backgroundColor: accentColor } : undefined}
              >
                {f === "all" ? "Tümü" : f === "video" ? "Video" : "PDF"}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-600">
          Bu süzgeçte gösterilecek içerik yok.
        </div>
      ) : (
        <ul className="space-y-2" role="listbox" aria-label="İzle veya çöz">
          {visible.map((item) => {
            const isActive = activeId === item.id;
            const thumb = item.thumbnail_url || (item.type === "video" && item.url ? getVideoThumbnail(item.url) : null);
            return (
              <li
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-center ${
                  isActive ? "ring-2 ring-offset-2 ring-indigo-400" : "border-slate-100"
                }`}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onSelect(item)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : item.type === "video" ? (
                      <div className="flex h-full items-center justify-center">
                        <Play className="h-8 w-8 text-slate-400" aria-hidden />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-8 w-8 text-slate-400" aria-hidden />
                      </div>
                    )}
                    <span
                      className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: item.type === "video" ? "#ef4444" : "#f59e0b" }}
                    >
                      {item.type === "video" ? "Video" : "PDF"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    {item.duration_seconds ? (
                      <p className="text-xs text-slate-500">{Math.round(item.duration_seconds / 60)} dk</p>
                    ) : (
                      <p className="text-xs text-slate-500">İzle</p>
                    )}
                  </div>
                </button>
                <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch md:flex-row">
                  <Link
                    href={practiceHref}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 sm:flex-none"
                  >
                    <PenLine className="h-4 w-4 shrink-0" aria-hidden />
                    Çöz
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
