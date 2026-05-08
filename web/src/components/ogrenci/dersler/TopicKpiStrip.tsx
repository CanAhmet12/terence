"use client";

import { Play, LayoutGrid, ClipboardList, ListChecks } from "lucide-react";
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
  const pdfCount = items.filter((i) => i.type === "pdf").length;
  const quizCount = items.filter((i) => i.type === "quiz").length;
  const textCount = items.filter((i) => i.type === "text").length;
  const practiceCount = textCount;

  const cards = [
    {
      key: "lecture",
      title: "Konu Anlatımı",
      subtitle: videoMin > 0 ? `${videoMin} dk video` : "Henüz video yok",
      icon: Play,
      iconWrap: "from-violet-500/15 to-indigo-500/20 text-violet-600",
    },
    {
      key: "example",
      title: "Örnek Sorular",
      subtitle: pdfCount > 0 ? `${pdfCount} doküman` : "—",
      icon: LayoutGrid,
      iconWrap: "from-sky-500/15 to-blue-500/15 text-sky-600",
    },
    {
      key: "practice",
      title: "Alıştırmalar",
      subtitle: practiceCount > 0 ? `${practiceCount} öğe` : "—",
      icon: ClipboardList,
      iconWrap: "from-amber-500/15 to-orange-500/15 text-amber-600",
    },
    {
      key: "test",
      title: "Konu Testi",
      subtitle: quizCount > 0 ? `${quizCount} etkinlik` : "—",
      icon: ListChecks,
      iconWrap: "from-emerald-500/15 to-teal-500/15 text-emerald-600",
    },
  ];

  return (
    <div className="relative z-20 -mt-8 px-0 sm:-mt-10 md:-mt-11">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100/90 bg-white p-3 shadow-lg shadow-slate-200/40 ring-1 ring-slate-900/5 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-100 lg:p-4">
        {cards.map(({ key, title, subtitle, icon: Icon, iconWrap }) => (
          <div key={key} className="flex min-w-0 items-center gap-3 px-1 py-1 lg:px-4 lg:py-0">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconWrap}`}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">{title}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
