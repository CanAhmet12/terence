"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import api, {
  curriculumApi,
  getVideoThumbnail,
  type Course,
  type CourseTopic,
  type CourseUnit,
  type ContentItem,
  type MediaCatalogItem,
  type MediaCatalogResponse,
} from "@/lib/api";
import type { MediaHubSubjectSummary, UnifiedMediaItem } from "@/components/ogrenci/video-pdf/types";
import { normalizeMediaUrl } from "@/components/ogrenci/video-pdf/utils";

function mapCatalogRow(row: MediaCatalogItem): UnifiedMediaItem {
  const ct = row.content_type;
  const url = row.url ?? null;
  const playbackUrl = ct === "video" ? url : url;
  return {
    key: row.key,
    source: "curriculum",
    contentType: ct,
    id: row.id,
    title: row.title,
    url,
    playbackUrl,
    thumbnailUrl: ct === "video" ? getVideoThumbnail(url, null) : null,
    durationSeconds: row.duration_seconds ?? 0,
    isFree: row.is_free,
    subjectSlug: row.subject_slug,
    subjectName: row.subject_name,
    subjectIcon: row.subject_icon,
    subjectColor: row.subject_color,
    grade: row.grade,
    examType: row.exam_type,
    curriculumTopicId: row.curriculum_topic_id,
    topicTitle: row.topic_title,
    unitTitle: row.unit_title,
    topicStatus: row.topic_status,
    sortOrder: row.sort_order,
  };
}

function mapCourseContentItem(
  course: Course,
  unit: CourseUnit,
  topic: CourseTopic,
  item: ContentItem
): UnifiedMediaItem | null {
  const rawType = (item.type || "video").toLowerCase();
  if (rawType !== "video" && rawType !== "pdf" && rawType !== "text") return null;
  const contentType = rawType as UnifiedMediaItem["contentType"];
  const playbackUrl =
    contentType === "video" ? item.video?.cdn_url || item.url || null : item.url || null;
  const durationSeconds =
    contentType === "video"
      ? item.video?.duration_seconds ?? item.duration_seconds ?? 0
      : item.duration_seconds ?? 0;
  const thumb =
    contentType === "video"
      ? getVideoThumbnail(playbackUrl, item.video?.thumbnail_url ?? null)
      : null;
  return {
    key: `course-${course.id}-${topic.id}-${item.id}`,
    source: "course",
    contentType,
    id: item.id,
    title: item.title || "İçerik",
    url: item.url ?? playbackUrl,
    playbackUrl,
    thumbnailUrl: thumb,
    durationSeconds,
    isFree: item.is_free !== false,
    subjectSlug: `course-${course.id}`,
    subjectName: course.title,
    grade: String(course.grade ?? ""),
    examType: course.exam_type ?? "",
    topicTitle: topic.title,
    unitTitle: unit.title,
    sortOrder: item.sort_order ?? 0,
    courseId: course.id,
    courseTopicId: topic.id,
    courseTitle: course.title,
    progressStatus: item.progress_status,
  };
}

async function loadCourseArchiveItems(courses: Course[]): Promise<UnifiedMediaItem[]> {
  const out: UnifiedMediaItem[] = [];
  for (const course of courses) {
    let units: CourseUnit[] = [];
    try {
      units = await api.getCourseUnits(course.id);
    } catch (e) {
      console.error("getCourseUnits error", course.id, e);
      continue;
    }
    for (const unit of units) {
      const topics = unit.topics ?? [];
      for (const topic of topics) {
        const ext = topic as CourseTopic & { content_items?: ContentItem[] };
        const raw = ext.contentItems ?? ext.content_items ?? [];
        for (const ci of raw) {
          const mapped = mapCourseContentItem(course, unit, topic, ci);
          if (mapped) out.push(mapped);
        }
      }
    }
  }
  return out;
}

export function useMediaHubCatalog(options: { includeCourseArchive?: boolean; token: string | null }) {
  const { includeCourseArchive = false, token } = options;
  const [catalog, setCatalog] = useState<MediaCatalogResponse | null>(null);
  const [courseItems, setCourseItems] = useState<UnifiedMediaItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    if (!token) {
      setCatalog(null);
      return;
    }
    setLoadingCatalog(true);
    setError(null);
    try {
      const data = await curriculumApi.getMediaCatalog();
      if (!data) {
        setError("Müfredat kataloğu yüklenemedi.");
        setCatalog(null);
      } else {
        setCatalog(data);
      }
    } catch (e) {
      console.error("useMediaHubCatalog catalog", e);
      setError("Müfredat kataloğu yüklenemedi.");
      setCatalog(null);
    } finally {
      setLoadingCatalog(false);
    }
  }, [token]);

  const includeCourseArchiveRef = useRef(includeCourseArchive);
  includeCourseArchiveRef.current = includeCourseArchive;

  const reloadCourseArchive = useCallback(async () => {
    if (!token || !includeCourseArchiveRef.current) {
      setCourseItems([]);
      return;
    }
    setLoadingCourses(true);
    try {
      const res = await api.getCourses();
      const courses = Array.isArray(res) ? (res as Course[]) : [];
      const items = await loadCourseArchiveItems(courses);
      setCourseItems(items);
    } catch (e) {
      console.error("useMediaHubCatalog courses", e);
      setCourseItems([]);
      setError((prev) => prev ?? "Kurs arşivi yüklenemedi.");
    } finally {
      setLoadingCourses(false);
    }
  }, [token]);

  const refetchAll = useCallback(async () => {
    await loadCatalog();
    await reloadCourseArchive();
  }, [loadCatalog, reloadCourseArchive]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!token || !includeCourseArchive) {
      setCourseItems([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      await reloadCourseArchive();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [token, includeCourseArchive, reloadCourseArchive]);

  const curriculumItems = useMemo(() => {
    if (!catalog?.items?.length) return [] as UnifiedMediaItem[];
    return catalog.items.map(mapCatalogRow);
  }, [catalog]);

  const curriculumUrlSet = useMemo(() => {
    const s = new Set<string>();
    for (const i of curriculumItems) {
      const n = normalizeMediaUrl(i.playbackUrl || i.url);
      if (n) s.add(n);
    }
    return s;
  }, [curriculumItems]);

  const mergedItems = useMemo(() => {
    const merged: UnifiedMediaItem[] = [...curriculumItems];
    if (!includeCourseArchive || courseItems.length === 0) return merged;
    for (const c of courseItems) {
      const n = normalizeMediaUrl(c.playbackUrl || c.url);
      if (n && curriculumUrlSet.has(n)) continue;
      merged.push(c);
    }
    return merged;
  }, [curriculumItems, courseItems, includeCourseArchive, curriculumUrlSet]);

  const subjectsSummary = useMemo((): MediaHubSubjectSummary[] => {
    const base = (catalog?.subjects_summary ?? []).map((s) => ({ ...s, isCourseArchive: false }));
    if (!includeCourseArchive || courseItems.length === 0) return base;
    const courseCount = mergedItems.filter((i) => i.source === "course").length;
    if (courseCount === 0) return base;
    return [
      ...base,
      {
        slug: "__course_archive__",
        name: "Kurs arşivi",
        icon: null,
        color: null,
        grade: catalog?.grade ?? "",
        exam_type: catalog?.exam_type ?? "",
        media_count: courseCount,
        total_topics: 0,
        completed_topics: 0,
        progress_percent: 0,
        isCourseArchive: true,
      },
    ];
  }, [catalog, courseItems.length, includeCourseArchive, mergedItems]);

  const loading = loadingCatalog || (includeCourseArchive && loadingCourses);

  return {
    items: mergedItems,
    subjectsSummary,
    grade: catalog?.grade ?? "",
    examType: catalog?.exam_type ?? "",
    loading,
    error,
    refetch: refetchAll,
    refetchCatalog: loadCatalog,
  };
}
