"use client";

import { Play, FileText, ListChecks, Hash } from "lucide-react";

export type TopicKpiCounts = { video: number; pdf: number; quiz: number; other: number };

export function TopicKpiStrip({
  counts,
  mebCode,
}: {
  counts: TopicKpiCounts;
  mebCode?: string | null;
}) {
  const cards = [
    { key: "video", label: "Video", value: counts.video, icon: Play, tone: "from-rose-500/20 to-rose-600/10" },
    { key: "pdf", label: "PDF", value: counts.pdf, icon: FileText, tone: "from-amber-500/20 to-amber-600/10" },
    { key: "quiz", label: "Test / etkinlik", value: counts.quiz, icon: ListChecks, tone: "from-teal-500/20 to-teal-600/10" },
    { key: "kazanim", label: "Kazanım", value: mebCode || "—", icon: Hash, tone: "from-indigo-500/20 to-indigo-600/10", isText: true },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map(({ key, label, value, icon: Icon, tone, isText }) => (
        <div
          key={key}
          className={`rounded-2xl border border-slate-100 bg-gradient-to-br p-4 shadow-sm ${tone}`}
        >
          <div className="mb-2 flex items-center gap-2 text-slate-600">
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
          </div>
          <p className={`font-black text-slate-900 ${isText ? "text-sm md:text-base" : "text-2xl"}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
