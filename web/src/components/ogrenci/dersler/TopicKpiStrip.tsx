"use client";

import { BookOpen, ClipboardList, PenTool, ListChecks } from "lucide-react";
import type { ContentListItem } from "./TopicContentList";

function sumVideoMinutes(items: ContentListItem[]): number {
  let sec = 0;
  for (const it of items) {
    if (it.type === "video" && typeof it.duration_seconds === "number") sec += it.duration_seconds;
  }
  return Math.max(0, Math.round(sec / 60));
}

export function TopicKpiStrip({ items }: { items: ContentListItem[] }) {
  const videoMin = sumVideoMinutes(items);
  const pdf = items.filter((i) => i.type === "pdf").length;
  const quiz = items.filter((i) => i.type === "quiz").length;
  const text = items.filter((i) => i.type === "text").length;

  const cards = [
    {
      key: "lecture",
      title: "Konu Anlatımı",
      subtitle: videoMin > 0 ? `${videoMin} dk video` : "Video henüz yok",
      icon: BookOpen,
    },
    {
      key: "example",
      title: "Örnek Sorular",
      subtitle: pdf > 0 ? `${pdf} PDF` : "—",
      icon: ClipboardList,
    },
    {
      key: "practice",
      title: "Alıştırmalar",
      subtitle: text > 0 ? `${text} metin` : quiz > 0 ? `${quiz} etkinlik` : "—",
      icon: PenTool,
    },
    {
      key: "test",
      title: "Konu Testi",
      subtitle: quiz > 0 ? `${quiz} etkinlik` : "—",
      icon: ListChecks,
    },
  ];

  return (
    <div className="relative z-20 -mt-10 px-1 md:-mt-12 md:px-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map(({ key, title, subtitle, icon: Icon }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-100/90 bg-white p-4 shadow-md shadow-slate-200/50 ring-1 ring-slate-900/[0.025] md:p-5"
          >
            <div className="mb-2 flex items-center gap-2 text-violet-600">
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-800">{title}</span>
            </div>
            <p className="text-sm font-semibold text-slate-600">{subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
