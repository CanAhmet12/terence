"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { CurriculumTopic, CurriculumUnit } from "@/lib/api";

export function UnitAccordion({
  unit,
  color,
  activeTopic,
  onTopicSelect,
}: {
  unit: CurriculumUnit;
  color: string;
  activeTopic: CurriculumTopic | null;
  onTopicSelect: (topic: CurriculumTopic) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-1.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${color}, #4c1d95)` }}
        >
          {unit.sort_order}
        </div>
        <span className="flex-1 text-xs font-bold leading-snug text-slate-800">{unit.title}</span>
        <span className="shrink-0 text-xs font-medium text-slate-400">
          {unit.completed_topics}/{unit.total_topics}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
          {unit.topics.map((topic) => {
            const isActive = activeTopic?.id === topic.id;
            const isDone = topic.status === "completed";

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onTopicSelect(topic)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-xs transition-all ${
                  isActive ? "bg-violet-100 font-semibold text-violet-950 shadow-sm ring-1 ring-violet-200/80" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isDone
                      ? isActive
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-emerald-500 bg-emerald-500 text-white"
                      : isActive
                        ? "border-violet-400 bg-white"
                        : "border-slate-300 bg-white"
                  }`}
                >
                  {isDone && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                </div>
                <span className={`min-w-0 flex-1 leading-snug ${isDone && !isActive ? "text-slate-400 line-through" : ""}`}>{topic.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
