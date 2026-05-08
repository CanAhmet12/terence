"use client";

import { CheckCircle2, Clock, FileText, TrendingUp, Video } from "lucide-react";
import type { MediaHubSubjectSummary, UnifiedMediaItem } from "./types";
import { getStoredSeconds, videoProgressRatio } from "./utils";

function formatWatchTotal(seconds: number): string {
  if (seconds <= 0) return "0dk";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}sa ${m}dk`;
  return `${m}dk`;
}

type Props = {
  items: UnifiedMediaItem[];
  subjectsSummary: MediaHubSubjectSummary[];
};

export function MediaKpiStrip({ items, subjectsSummary }: Props) {
  const videoCount = items.filter((i) => i.contentType === "video").length;
  const pdfCount = items.filter((i) => i.contentType === "pdf").length;
  const textCount = items.filter((i) => i.contentType === "text").length;
  const startedVideos = items.filter((i) => i.contentType === "video" && getStoredSeconds(i) > 5).length;

  const watchedSeconds = items
    .filter((i) => i.contentType === "video")
    .reduce((acc, i) => acc + getStoredSeconds(i), 0);

  const completedTopics = subjectsSummary.reduce((a, s) => a + (s.completed_topics ?? 0), 0);
  const totalTopics = subjectsSummary.reduce((a, s) => a + (s.total_topics ?? 0), 0);

  const completedVideos = items.filter(
    (i) => i.contentType === "video" && i.durationSeconds > 0 && videoProgressRatio(i) >= 0.92
  ).length;

  const curriculumSubjects = subjectsSummary.filter((s) => !s.isCourseArchive);
  const subjectAvg =
    curriculumSubjects.length > 0
      ? Math.round(
          curriculumSubjects.reduce((a, s) => a + (s.progress_percent ?? 0), 0) / curriculumSubjects.length
        )
      : 0;

  const videoRatios = items
    .filter((i) => i.contentType === "video" && i.durationSeconds > 0)
    .map((i) => videoProgressRatio(i));
  const localVideoAvg =
    videoRatios.length > 0
      ? Math.round((videoRatios.reduce((a, b) => a + b, 0) / videoRatios.length) * 100)
      : 0;
  const blendedProgress =
    curriculumSubjects.length === 0 ? localVideoAvg : Math.round((localVideoAvg + subjectAvg) / 2);

  const tiles = [
    {
      key: "v",
      title: "Toplam video",
      value: String(videoCount),
      sub: "İçerik",
      Icon: Video,
      wrap: "from-violet-500 to-indigo-600 text-white shadow-violet-500/30",
    },
    {
      key: "p",
      title: "Toplam PDF",
      value: String(pdfCount + textCount),
      sub: "İçerik",
      Icon: FileText,
      wrap: "from-rose-500 to-red-600 text-white shadow-rose-500/25",
    },
    {
      key: "w",
      title: "İzlenen süre",
      value: formatWatchTotal(watchedSeconds),
      sub: "Toplam",
      Icon: Clock,
      wrap: "from-emerald-500 to-teal-600 text-white shadow-emerald-500/25",
    },
    {
      key: "c",
      title: "Tamamlanan",
      value: String(completedVideos + completedTopics),
      sub: totalTopics > 0 ? `Konu ${completedTopics}/${totalTopics}` : "İçerik / konu",
      Icon: CheckCircle2,
      wrap: "from-green-500 to-emerald-600 text-white shadow-green-500/20",
    },
    {
      key: "a",
      title: "Ortalama ilerleme",
      value: `${startedVideos > 0 ? blendedProgress : subjectAvg}%`,
      sub: "Genel",
      Icon: TrendingUp,
      wrap: "from-amber-500 to-orange-600 text-white shadow-amber-500/25",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(({ key, title, value, sub, Icon, wrap }) => (
        <div
          key={key}
          className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40 ring-1 ring-slate-900/[0.03]"
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${wrap}`}
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black leading-none tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
