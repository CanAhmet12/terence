"use client";

import Link from "next/link";
import { Play, FileText, PenLine, ListChecks, FileQuestion } from "lucide-react";
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

function typeIcon(type: ContentListItem["type"]) {
  switch (type) {
    case "video":
      return Play;
    case "pdf":
      return FileText;
    case "quiz":
      return ListChecks;
    default:
      return FileQuestion;
  }
}

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
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6" aria-labelledby="topic-content-list-heading">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="topic-content-list-heading" className="text-lg font-bold text-slate-900 md:text-xl">
          {items.length > 0 ? `Konu İçeriği (${visible.length})` : "Konu İçeriği"}
        </h2>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="İçerik türü">
            {(["all", "video", "pdf"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => onFilterChange(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  filter === f ? "text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/90 p-10 text-center text-sm text-slate-500">
          Bu süzgeçte gösterilecek içerik yok.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100" role="listbox" aria-label="Konu içeriği listesi">
          {visible.map((item) => {
            const isActive = activeId === item.id;
            const thumb = item.thumbnail_url || (item.type === "video" && item.url ? getVideoThumbnail(item.url) : null);
            const TypeIcon = typeIcon(item.type);
            const durationLabel =
              item.duration_seconds && item.duration_seconds > 0
                ? `${Math.max(1, Math.round(item.duration_seconds / 60))} dk`
                : item.type === "video"
                  ? "Video"
                  : item.type === "pdf"
                    ? "PDF"
                    : item.type === "quiz"
                      ? "Etkinlik"
                      : "Metin";

            return (
              <li key={item.id} className={`flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between ${isActive ? "bg-violet-50/40 -mx-2 rounded-xl px-2 sm:-mx-3 sm:px-3" : ""}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onSelect(item)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80 sm:h-16 sm:w-28">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50">
                        <TypeIcon className="h-7 w-7 text-violet-400" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{durationLabel}</p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2 sm:pl-2">
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="inline-flex min-w-[5.5rem] items-center justify-center rounded-xl bg-violet-100 px-4 py-2.5 text-sm font-bold text-violet-800 transition hover:bg-violet-200"
                  >
                    {item.type === "video" ? "İzle" : item.type === "pdf" ? "Aç" : "Aç"}
                  </button>
                  <Link
                    href={practiceHref}
                    className="inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600"
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
