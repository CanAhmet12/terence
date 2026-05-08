"use client";

import { FileText, Gauge, Play, Video } from "lucide-react";
import type { MediaHubSubjectSummary, UnifiedMediaItem } from "./types";
import { getStoredSeconds, videoProgressRatio } from "./utils";

type Props = {
  items: UnifiedMediaItem[];
  subjectsSummary: MediaHubSubjectSummary[];
};

export function MediaKpiStrip({ items, subjectsSummary }: Props) {
  const videoCount = items.filter((i) => i.contentType === "video").length;
  const pdfCount = items.filter((i) => i.contentType === "pdf").length;
  const startedVideos = items.filter(
    (i) => i.contentType === "video" && getStoredSeconds(i) > 5
  ).length;
  const completedTopics = subjectsSummary.reduce((a, s) => a + (s.completed_topics ?? 0), 0);
  const totalTopics = subjectsSummary.reduce((a, s) => a + (s.total_topics ?? 0), 0);

  const videoRatios = items
    .filter((i) => i.contentType === "video" && i.durationSeconds > 0)
    .map((i) => videoProgressRatio(i));
  const localVideoAvg =
    videoRatios.length > 0
      ? Math.round((videoRatios.reduce((a, b) => a + b, 0) / videoRatios.length) * 100)
      : 0;
  const curriculumSubjects = subjectsSummary.filter((s) => !s.isCourseArchive);
  const subjectAvg =
    curriculumSubjects.length > 0
      ? Math.round(
          curriculumSubjects.reduce((a, s) => a + (s.progress_percent ?? 0), 0) /
            curriculumSubjects.length
        )
      : 0;
  const blendedProgress =
    curriculumSubjects.length === 0
      ? localVideoAvg
      : Math.round((localVideoAvg + subjectAvg) / 2);

  const tiles = [
    { label: "Video", value: videoCount, icon: Video },
    { label: "PDF", value: pdfCount, icon: FileText },
    { label: "İzlemeye başlanan", value: startedVideos, icon: Play },
    {
      label: "Tamamlanan konu",
      value: totalTopics > 0 ? `${completedTopics}/${totalTopics}` : "—",
      icon: Gauge,
    },
    { label: "Ortalama ilerleme", value: `${blendedProgress}%`, icon: Gauge },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-indigo-500/15 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-inner">
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="truncate text-lg font-bold text-slate-900">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
