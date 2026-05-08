import type { MediaCatalogSubjectSummary } from "@/lib/api";

export type MediaHubContentType = "video" | "pdf" | "text";

export type MediaHubSource = "curriculum" | "course";

export interface UnifiedMediaItem {
  key: string;
  source: MediaHubSource;
  contentType: MediaHubContentType;
  id: number;
  title: string;
  url: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  isFree: boolean;
  subjectSlug: string;
  subjectName: string;
  subjectIcon?: string | null;
  subjectColor?: string | null;
  grade: string;
  examType: string;
  curriculumTopicId?: number;
  topicTitle: string;
  unitTitle?: string;
  topicStatus?: string;
  sortOrder: number;
  courseId?: number;
  courseTopicId?: number;
  courseTitle?: string;
  progressStatus?: string;
}

export type MediaHubSubjectSummary = MediaCatalogSubjectSummary & {
  isCourseArchive?: boolean;
};

export type MediaHubSort = "order" | "title_asc" | "title_desc" | "progress_desc";

export type MediaHubQuickFilter = "all" | "continue" | "new" | "pro";
