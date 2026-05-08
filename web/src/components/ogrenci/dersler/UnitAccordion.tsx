"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle } from "lucide-react";
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
    <div className="mb-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: color }}>
          {unit.sort_order}
        </div>
        <span className="flex-1 text-xs font-bold text-slate-700">{unit.title}</span>
        <span className="text-xs text-slate-400">
          {unit.completed_topics}/{unit.total_topics}
        </span>
        <ChevronDown className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="ml-8 mt-1 space-y-1">
          {unit.topics.map((topic) => {
            const isActive = activeTopic?.id === topic.id;
            const isDone = topic.status === "completed";

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onTopicSelect(topic)}
                className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs transition-all ${
                  isActive ? "text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
                style={isActive ? { background: color } : {}}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    isDone ? (isActive ? "border-white bg-white" : "border-emerald-500 bg-emerald-500") : isActive ? "border-white/60" : "border-slate-300"
                  }`}
                >
                  {isDone && <CheckCircle className="h-2.5 w-2.5" style={{ color: isActive ? color : "white" }} aria-hidden />}
                </div>
                <span className={`flex-1 ${isDone && !isActive ? "line-through opacity-50" : ""}`}>{topic.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
