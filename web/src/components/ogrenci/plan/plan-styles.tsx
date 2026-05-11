"use client";

import type { PlanTask } from "@/lib/plan-types";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CheckCircle2,
  Dumbbell,
  FileText,
  Video,
} from "lucide-react";

export const TASK_TYPE_CONFIG: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    icon: LucideIcon;
    iconBg: string;
  }
> = {
  question: {
    border: "border-indigo-400",
    bg: "bg-indigo-50/60",
    text: "text-indigo-700",
    icon: Dumbbell,
    iconBg: "bg-indigo-100",
  },
  video: {
    border: "border-rose-400",
    bg: "bg-rose-50/60",
    text: "text-rose-700",
    icon: Video,
    iconBg: "bg-rose-100",
  },
  exam: {
    border: "border-violet-400",
    bg: "bg-violet-50/60",
    text: "text-violet-700",
    icon: FileText,
    iconBg: "bg-violet-100",
  },
  read: {
    border: "border-cyan-400",
    bg: "bg-cyan-50/60",
    text: "text-cyan-700",
    icon: BookOpen,
    iconBg: "bg-cyan-100",
  },
  repeat: {
    border: "border-amber-400",
    bg: "bg-amber-50/60",
    text: "text-amber-800",
    icon: FileText,
    iconBg: "bg-amber-100",
  },
  custom: {
    border: "border-slate-300",
    bg: "bg-slate-50/60",
    text: "text-slate-600",
    icon: CheckCircle2,
    iconBg: "bg-slate-100",
  },
};

export function getTaskConfig(task: PlanTask) {
  const key = task.type?.toLowerCase() ?? "custom";
  return TASK_TYPE_CONFIG[key] ?? TASK_TYPE_CONFIG.custom;
}

export function getTimeGroup(
  idx: number,
  total: number,
): "morning" | "afternoon" | "evening" {
  const pct = idx / Math.max(total - 1, 1);
  if (pct < 0.4) return "morning";
  if (pct < 0.7) return "afternoon";
  return "evening";
}

export const TIME_GROUP_CONFIG = {
  morning: {
    label: "Sabah Seansı",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  afternoon: {
    label: "Öğle Seansı",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  evening: {
    label: "Akşam Seansı",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
};

export const DAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
