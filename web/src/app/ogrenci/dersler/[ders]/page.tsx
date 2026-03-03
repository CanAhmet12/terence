"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Unit, ContentItem } from "@/lib/api";
import {
  ArrowLeft, Play, FileText, CheckCircle, RefreshCw, ChevronDown, ChevronRight,
  Lock, Clock, FileDown
} from "lucide-react";

const DEMO_UNITS: Unit[] = [
  {
    id: 1, course_id: 1, title: "Üslü Sayılar", order: 1,
    topics: [
      { id: 1, unit_id: 1, title: "Üslü İfadeler", kazanim_code: "M.8.1.1", kazanim_desc: "Üslü ifadeleri tanır ve hesaplar", order: 1, progress: "completed" },
      { id: 2, unit_id: 1, title: "Üslü İfadelerde İşlemler", kazanim_code: "M.8.1.2", kazanim_desc: "Üslü ifadelerle toplama ve çarpma yapar", order: 2, progress: "in_progress" },
    ],
  },
  {
    id: 2, course_id: 1, title: "Köklü Sayılar", order: 2,
    topics: [
      { id: 3, unit_id: 2, title: "Köklü İfadeler", kazanim_code: "M.8.2.1", kazanim_desc: "Kareköklü ifadeleri hesaplar", order: 1, progress: "not_started" },
    ],
  },
  {
    id: 3, course_id: 1, title: "Cebirsel İfadeler", order: 3,
    topics: [
      { id: 4, unit_id: 3, title: "Cebirsel Denklemler", kazanim_code: "M.8.3.1", kazanim_desc: "Birinci dereceden denklemleri çözer", order: 1, progress: "not_started" },
      { id: 5, unit_id: 3, title: "Eşitsizlikler", kazanim_code: "M.8.3.2", kazanim_desc: "Birinci dereceden eşitsizlikleri çözer", order: 2, progress: "not_started" },
    ],
  },
];

type ProgressType = "not_started" | "in_progress" | "completed";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

const PROGRESS_CONFIG: Record<ProgressType, { label: string; dot: string }> = {
  completed: { label: "Tamamlandı", dot: "bg-teal-500" },
  in_progress: { label: "Devam ediyor", dot: "bg-amber-500" },
  not_started: { label: "Başlanmadı", dot: "bg-slate-300" },
};

export default function DersDetayPage() {
  const params = useParams();
  const slug = params.ders as string;
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openUnitId, setOpenUnitId] = useState<number | null>(null);
  const [openTopicId, setOpenTopicId] = useState<number | null>(null);
  const [topicContent, setTopicContent] = useState<Record<number, ContentItem[]>>({});
  const [loadingTopicId, setLoadingTopicId] = useState<number | null>(null);
  const [progressMap, setProgressMap] = useState<Record<number, ProgressType>>({});

  const loadUnits = useCallback(async () => {
    if (isDemo) {
      setUnits(DEMO_UNITS);
      // Demo ilerleme durumu
      const pm: Record<number, ProgressType> = {};
      DEMO_UNITS.forEach((u) => u.topics.forEach((t) => { pm[t.id] = t.progress ?? "not_started"; }));
      setProgressMap(pm);
      setOpenUnitId(DEMO_UNITS[0]?.id ?? null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getCourseUnits(slug, token ?? undefined);
      setUnits(res);
      const pm: Record<number, ProgressType> = {};
      res.forEach((u) => u.topics.forEach((t) => { pm[t.id] = t.progress ?? "not_started"; }));
      setProgressMap(pm);
      if (res.length > 0) setOpenUnitId(res[0].id);
    } catch {
      setUnits(DEMO_UNITS);
    }
    setLoading(false);
  }, [slug, token, isDemo]);

  useEffect(() => { loadUnits(); }, [loadUnits]);

  const loadTopicContent = async (topicId: number) => {
    if (topicContent[topicId]) return;
    setLoadingTopicId(topicId);
    try {
      const res = await api.getTopicContent(topicId, token ?? undefined);
      setTopicContent((prev) => ({ ...prev, [topicId]: res }));
    } catch {
      setTopicContent((prev) => ({ ...prev, [topicId]: [] }));
    }
    setLoadingTopicId(null);
  };

  const toggleTopic = (topicId: number) => {
    if (openTopicId === topicId) {
      setOpenTopicId(null);
    } else {
      setOpenTopicId(topicId);
      loadTopicContent(topicId);
    }
  };

  const updateProgress = async (topicId: number, status: ProgressType) => {
    setProgressMap((prev) => ({ ...prev, [topicId]: status }));
    if (token && !isDemo) {
      try {
        await api.updateProgress(token, { topic_id: topicId, status });
      } catch {
        // Sessizce geç
      }
    }
  };

  // Toplam ilerleme hesapla
  const allTopics = units.flatMap((u) => u.topics);
  const completedCount = allTopics.filter((t) => progressMap[t.id] === "completed").length;
  const totalCount = allTopics.length;
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const displaySlug = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="p-8 lg:p-12">
      <Link href="/ogrenci/dersler" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Derslere dön
      </Link>

      {/* Başlık + genel ilerleme */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{displaySlug}</h1>
          <p className="text-slate-600 mt-1">Ünite — Konu — Kazanım yapısı · İlerleme takibi</p>
        </div>
        {!loading && totalCount > 0 && (
          <div className="flex items-center gap-3 min-w-[180px]">
            <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-teal-600 whitespace-nowrap">%{overallPct}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-600">İçerik henüz eklenmemiş</p>
          <p className="text-sm mt-1">Bu ders için içerik yakında yüklenecek.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit) => {
            const unitTopics = unit.topics ?? [];
            const unitCompleted = unitTopics.filter((t) => progressMap[t.id] === "completed").length;
            const unitPct = unitTopics.length > 0 ? Math.round((unitCompleted / unitTopics.length) * 100) : 0;
            const isOpen = openUnitId === unit.id;

            return (
              <div key={unit.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Ünite başlığı */}
                <button
                  onClick={() => setOpenUnitId(isOpen ? null : unit.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-50/80 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900 text-lg">{unit.title}</h3>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        {unitTopics.length} konu
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${unitPct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">%{unitPct}</span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                  )}
                </button>

                {/* Konular */}
                {isOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {unitTopics.map((topic) => {
                      const progress = progressMap[topic.id] ?? "not_started";
                      const pConf = PROGRESS_CONFIG[progress];
                      const isTopicOpen = openTopicId === topic.id;
                      const contents = topicContent[topic.id] ?? [];

                      return (
                        <div key={topic.id}>
                          {/* Konu satırı */}
                          <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-1">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pConf.dot}`} />
                                  <h4 className="font-semibold text-slate-900">{topic.title}</h4>
                                </div>
                                {topic.kazanim_code && (
                                  <div className="flex items-center gap-2 ml-5">
                                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                                      {topic.kazanim_code}
                                    </span>
                                    {topic.kazanim_desc && (
                                      <span className="text-xs text-slate-500 truncate">{topic.kazanim_desc}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Aksiyon butonları */}
                              <div className="flex items-center gap-2 shrink-0 ml-5 sm:ml-0">
                                <button
                                  onClick={() => toggleTopic(topic.id)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  İçerik
                                </button>

                                {progress !== "not_started" && (
                                  <>
                                    <button
                                      onClick={() => updateProgress(topic.id, "completed")}
                                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                        progress === "completed"
                                          ? "bg-teal-100 text-teal-700 border border-teal-200"
                                          : "border border-teal-200 hover:bg-teal-50 text-teal-700"
                                      }`}
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Anladım
                                    </button>
                                    <button
                                      onClick={() => updateProgress(topic.id, "in_progress")}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 hover:bg-amber-50 text-amber-700 text-sm font-medium transition-colors"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      Tekrar
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* İçerik listesi (açılır) */}
                            {isTopicOpen && (
                              <div className="mt-4 ml-5 space-y-2">
                                {loadingTopicId === topic.id ? (
                                  <div className="space-y-2">
                                    {[1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
                                  </div>
                                ) : contents.length === 0 ? (
                                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <Lock className="w-4 h-4 text-slate-400" />
                                    <p className="text-sm text-slate-500">Bu konuya henüz içerik eklenmemiş.</p>
                                  </div>
                                ) : (
                                  contents.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                          item.type === "video" ? "bg-teal-100" : item.type === "pdf" ? "bg-red-100" : "bg-amber-100"
                                        }`}>
                                          {item.type === "video" ? (
                                            <Play className="w-4 h-4 text-teal-600" />
                                          ) : item.type === "pdf" ? (
                                            <FileText className="w-4 h-4 text-red-600" />
                                          ) : (
                                            <CheckCircle className="w-4 h-4 text-amber-600" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                          {item.duration_seconds && (
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {Math.floor(item.duration_seconds / 60)} dk
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {item.url ? (
                                        item.type === "pdf" ? (
                                          <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
                                          >
                                            <FileDown className="w-3.5 h-3.5" />
                                            İndir
                                          </a>
                                        ) : (
                                          <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => updateProgress(topic.id, "in_progress")}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
                                          >
                                            <Play className="w-3.5 h-3.5" />
                                            İzle
                                          </a>
                                        )
                                      ) : (
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                          <Lock className="w-3.5 h-3.5" />
                                          Yakında
                                        </span>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-sm text-slate-500">
        <strong>Anladım:</strong> Konuyu öğrendim olarak işaretler. &nbsp;
        <strong>Tekrar:</strong> Günlük plana otomatik eklenir.
      </p>
    </div>
  );
}
