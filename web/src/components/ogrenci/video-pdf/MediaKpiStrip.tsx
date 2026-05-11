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
      title: "İzleme süresi",
      value: formatWatchTotal(watchedSeconds),
      sub: "Toplam",
      Icon: Clock,
      wrap: "from-cyan-500 to-cyan-600 text-white shadow-cyan-500/25",
    },
    {
      key: "c",
      title: "Tamamlanan",
      value: String(completedVideos + completedTopics),
      sub: "İçerik",
      Icon: CheckCircle2,
      wrap: "from-cyan-500 to-cyan-600 text-white shadow-cyan-500/20",
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(({ key, title, value, sub, Icon, wrap }) => (
        <div
          key={key}
          className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm shadow-slate-200/30 ring-1 ring-slate-900/[0.02] sm:gap-2.5 sm:p-3"
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm sm:h-9 sm:w-9 ${wrap}`}
            aria-hidden
          >
            <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 sm:text-[10px]">{title}</p>
            <p className="mt-0.5 text-lg font-black leading-none tracking-tight text-slate-900 sm:text-xl">{value}</p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400 sm:text-xs">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
