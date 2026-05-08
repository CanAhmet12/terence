"use client";

import { cn } from "@/lib/utils";
import type { CurriculumBucket } from "./curriculumBuckets";

const EXAM_CHIPS = ["ALL", "TYT", "AYT", "LGS", "KPSS"] as const;

export function CurriculumBucketTabs({
  value,
  onChange,
}: {
  value: CurriculumBucket;
  onChange: (v: CurriculumBucket) => void;
}) {
  return (
    <div role="tablist" aria-label="Müfredat kovası" className="mb-3 flex gap-1 rounded-xl border border-slate-200/80 bg-slate-50/90 p-1">
      <button
        type="button"
        role="tab"
        aria-selected={value === "school"}
        id="tab-bucket-school"
        aria-controls="panel-bucket-school"
        onClick={() => onChange("school")}
        className={cn(
          "flex-1 rounded-lg px-2 py-2 text-center text-xs font-bold transition-all sm:text-sm",
          value === "school" ? "bg-white text-violet-800 shadow-sm ring-1 ring-slate-200/60" : "text-slate-600 hover:text-slate-900",
        )}
      >
        Sınıf dersleri
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "exam"}
        id="tab-bucket-exam"
        aria-controls="panel-bucket-exam"
        onClick={() => onChange("exam")}
        className={cn(
          "flex-1 rounded-lg px-2 py-2 text-center text-xs font-bold transition-all sm:text-sm",
          value === "exam" ? "bg-white text-violet-800 shadow-sm ring-1 ring-slate-200/60" : "text-slate-600 hover:text-slate-900",
        )}
      >
        Sınavlar
      </button>
    </div>
  );
}

export function ExamFilterChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Sınav türü süzgeci">
      {EXAM_CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          aria-pressed={value === chip}
          onClick={() => onChange(chip)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors sm:px-3 sm:text-xs",
            value === chip ? "bg-violet-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
          )}
        >
          {chip === "ALL" ? "Tümü" : chip}
        </button>
      ))}
    </div>
  );
}
