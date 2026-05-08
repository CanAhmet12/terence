"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { Play, FileText, PenLine, ListChecks, FileQuestion } from "lucide-react";

export type ContentListItem = {
  id: number;
  type: "video" | "pdf" | "quiz" | "text";
  title: string;
  url?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  is_free?: boolean;
};

function formatMmSs(sec?: number) {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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
  onOpenMedia,
  topicTitle,
  mebCode,
  accentColor,
  filter,
  onFilterChange,
}: {
  items: ContentListItem[];
  activeId: number | null;
  onSelect: (item: ContentListItem) => void;
  /** Video/PDF oynatıcıyı modalda aç */
  onOpenMedia?: (item: ContentListItem) => void;
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

  const handlePrimary = (item: ContentListItem, e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const canEmbed = (item.type === "video" || item.type === "pdf") && !!item.url;
    if (canEmbed && onOpenMedia) onOpenMedia(item);
    else onSelect(item);
  };

  const typeAccent = (type: ContentListItem["type"]) => {
    switch (type) {
      case "video":
        return "from-violet-500 to-indigo-600";
      case "pdf":
        return "from-sky-500 to-blue-600";
      case "quiz":
        return "from-emerald-500 to-teal-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  return (
    <section
      id="konu-icerik-listesi"
      className="rounded-3xl border border-slate-100/90 bg-white p-5 shadow-md shadow-slate-200/30 ring-1 ring-slate-900/5 md:p-6"
      aria-labelledby="topic-content-list-heading"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="topic-content-list-heading" className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
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
                  filter === f ? "text-white shadow-md" : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
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
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
          Bu süzgeçte gösterilecek içerik yok.
        </div>
      ) : (
        <ul className="space-y-3" role="list" aria-label="Konu içeriği listesi">
          {visible.map((item) => {
            const isActive = activeId === item.id;
            const TypeIcon = typeIcon(item.type);
            const mmss = formatMmSs(item.duration_seconds);
            const typeLabel =
              item.type === "video" ? "Video" : item.type === "pdf" ? "PDF" : item.type === "quiz" ? "Test" : "Metin";
            const subLine =
              item.type === "video" && mmss
                ? `${typeLabel} · ${mmss}`
                : item.type === "video"
                  ? typeLabel
                  : item.type === "pdf"
                    ? "PDF doküman"
                    : item.type === "quiz"
                      ? "Etkinlik"
                      : "Metin içeriği";

            const primaryLabel =
              item.type === "video" ? "İzle" : item.type === "pdf" ? "Aç" : item.type === "quiz" ? "Aç" : "Görüntüle";

            return (
              <li key={item.id}>
                <div
                  className={`flex flex-col gap-4 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                    isActive ? "border-violet-200 bg-violet-50/50 shadow-sm ring-1 ring-violet-100" : "border-slate-100 bg-white shadow-sm hover:border-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-inner ${typeAccent(item.type)}`}
                      aria-hidden
                    >
                      <TypeIcon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 md:text-sm">{subLine}</p>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-2 sm:pl-2">
                    <button
                      type="button"
                      onClick={(e) => handlePrimary(item, e)}
                      className="inline-flex min-w-[5.25rem] items-center justify-center rounded-xl bg-violet-100 px-4 py-2.5 text-sm font-bold text-violet-800 transition hover:bg-violet-200/90"
                    >
                      {primaryLabel}
                    </button>
                    <Link
                      href={practiceHref}
                      className="inline-flex min-w-[5.25rem] items-center justify-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <PenLine className="h-4 w-4 shrink-0" aria-hidden />
                      Çöz
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
