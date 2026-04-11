"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, CurriculumSubject, CurriculumUnit, CurriculumTopic } from "@/lib/api";
import {
  ChevronDown, ChevronRight, Search, Play, FileText,
  CheckCircle, BookOpen, BarChart3, RefreshCw,
  Video, FileQuestion, BookMarked, Settings, Layers,
  Lock, AlertCircle, Loader2, GraduationCap,
} from "lucide-react";

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

const SUBJECT_BG_COLORS: Record<string, string> = {
  "Matematik":              "#1565c0",
  "TYT Matematik":         "#1565c0",
  "AYT Matematik":         "#0d47a1",
  "LGS Matematik":         "#00695c",
  "KPSS Genel Yetenek":    "#4527a0",
  "KPSS Genel Kültür":     "#6a1b9a",
  "Fizik":                 "#6a1b9a",
  "AYT Fizik":             "#4a148c",
  "Kimya":                 "#e65100",
  "AYT Kimya":             "#bf360c",
  "Biyoloji":              "#2e7d32",
  "AYT Biyoloji":          "#1b5e20",
  "Türk Dili ve Edebiyatı":"#c62828",
  "TYT Türkçe":            "#b71c1c",
  "LGS Türkçe":            "#b71c1c",
  "Tarih":                 "#4e342e",
  "Coğrafya":              "#01579b",
  "TYT Fen Bilimleri":     "#2e7d32",
  "LGS Fen Bilimleri":     "#558b2f",
  "TYT Sosyal Bilimler":   "#4e342e",
  "Fen Bilimleri":         "#2e7d32",
};

const CONTENT_ICONS: Record<string, { icon: typeof Play; color: string; label: string }> = {
  video: { icon: Play,         color: "#ef4444", label: "Video" },
  pdf:   { icon: FileText,     color: "#f59e0b", label: "PDF"   },
  quiz:  { icon: FileQuestion, color: "#8b5cf6", label: "Test"  },
  text:  { icon: BookMarked,   color: "#0ea5e9", label: "Metin" },
};

const STATUS_CONFIG = {
  not_started: { label: "Başlanmadı", color: "text-slate-400", dot: "bg-slate-300"  },
  in_progress: { label: "Devam Ediyor", color: "text-amber-600", dot: "bg-amber-400" },
  completed:   { label: "Tamamlandı", color: "text-green-600",  dot: "bg-green-500" },
};

function ProgressRing({ percent, size = 36, color = "#6366f1" }: { percent: number; size?: number; color?: string }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s" }} />
    </svg>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

// ─── Konu Satırı ────────────────────────────────────────────────────────────

function TopicRow({ topic, subjectColor, onStatusChange }: {
  topic: CurriculumTopic;
  subjectColor: string;
  onStatusChange: (topicId: number, status: "not_started" | "in_progress" | "completed") => void;
}) {
  const [updating, setUpdating] = useState(false);
  const statusConf = STATUS_CONFIG[topic.status ?? "not_started"];
  const contentItems = topic.content_items ?? [];

  const toggleComplete = async () => {
    const newStatus = topic.status === "completed" ? "not_started" : "completed";
    setUpdating(true);
    try {
      await api.updateCurriculumProgress(topic.id, newStatus);
      onStatusChange(topic.id, newStatus);
    } catch {}
    setUpdating(false);
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-slate-50 group ${
      topic.status === "completed" ? "opacity-75" : ""
    }`}>
      {/* Tamamlama butonu */}
      <button
        onClick={toggleComplete}
        disabled={updating}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          topic.status === "completed"
            ? "border-green-500 bg-green-500"
            : "border-slate-300 hover:border-green-400 group-hover:border-slate-400"
        }`}
      >
        {updating ? (
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        ) : topic.status === "completed" ? (
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        ) : null}
      </button>

      {/* Konu başlığı */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          topic.status === "completed" ? "line-through text-slate-400" : "text-slate-700"
        }`}>
          {topic.title}
        </p>
        {topic.meb_code && (
          <span className="text-xs text-slate-400 font-mono">{topic.meb_code}</span>
        )}
      </div>

      {/* İçerik ikonları */}
      {contentItems.length > 0 && (
        <div className="flex items-center gap-1">
          {contentItems.slice(0, 3).map((ci) => {
            const conf = CONTENT_ICONS[ci.type] ?? CONTENT_ICONS.text;
            const Icon = conf.icon;
            return (
              <div
                key={ci.id}
                title={ci.title}
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${conf.color}18` }}
              >
                <Icon className="w-3 h-3" style={{ color: conf.color }} />
              </div>
            );
          })}
          {contentItems.length > 3 && (
            <span className="text-xs text-slate-400">+{contentItems.length - 3}</span>
          )}
        </div>
      )}

      {/* Durum badge */}
      <div className={`flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${statusConf.color}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
        <span className="hidden sm:inline">{statusConf.label}</span>
      </div>
    </div>
  );
}

// ─── Ünite Accordion ────────────────────────────────────────────────────────

function UnitAccordion({ unit, subjectColor, onTopicStatusChange, defaultOpen = false }: {
  unit: CurriculumUnit;
  subjectColor: string;
  onTopicStatusChange: (topicId: number, status: "not_started" | "in_progress" | "completed") => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Ünite başlık */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: subjectColor, color: "#fff", fontSize: "12px", fontWeight: 800 }}>
          {unit.sort_order}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm leading-tight">{unit.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {unit.completed_topics}/{unit.total_topics} konu tamamlandı
          </p>
        </div>

        {/* Mini progress ring */}
        <div className="relative flex-shrink-0">
          <ProgressRing percent={unit.progress_percent} size={36} color={subjectColor} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-600">
            {unit.progress_percent}%
          </span>
        </div>

        {/* Chevron */}
        <div className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </button>

      {/* Konular listesi */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-2 pt-1 space-y-0.5">
          {unit.topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              subjectColor={subjectColor}
              onStatusChange={onTopicStatusChange}
            />
          ))}
          {unit.topics.length === 0 && (
            <p className="text-sm text-slate-400 py-3 text-center">Bu üniteye henüz konu eklenmedi.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ana Sayfa ──────────────────────────────────────────────────────────────

export default function DerslerimPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Eğer grade yoksa onboarding'e yönlendir
  useEffect(() => {
    if (user && !user.grade) {
      router.push("/ogrenci/onboarding");
    }
  }, [user, router]);

  // Ders listesini yükle
  const loadSubjects = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    setError(null);
    try {
      const res = await api.getCurriculum(
        user.grade ?? undefined,
        (user.target_exam ?? user.exam_goal) ?? undefined
      );
      const list = Array.isArray(res.subjects) ? res.subjects : [];
      setSubjects(list);
      if (list.length > 0 && !selectedSlug) {
        setSelectedSlug(list[0].slug);
      }
    } catch (e) {
      setError((e as Error).message || "Dersler yüklenemedi.");
    }
    setLoadingList(false);
  }, [user, selectedSlug]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  // Seçili dersin ünitelerini yükle
  useEffect(() => {
    if (!selectedSlug) return;
    setLoadingUnits(true);
    setUnits([]);
    api.getCurriculumSubject(selectedSlug).then((res) => {
      setUnits(Array.isArray(res.units) ? res.units : []);
    }).catch(() => setUnits([])).finally(() => setLoadingUnits(false));
  }, [selectedSlug]);

  const selectedSubject = subjects.find((s) => s.slug === selectedSlug);

  // Konu arama filtrelemesi
  const filteredUnits = units.map((unit) => ({
    ...unit,
    topics: search
      ? unit.topics.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      : unit.topics,
  })).filter((unit) => !search || unit.topics.length > 0);

  // Konu tamamlama durumu değişince state'i güncelle
  const handleTopicStatusChange = (topicId: number, status: "not_started" | "in_progress" | "completed") => {
    setUnits((prev) =>
      prev.map((unit) => ({
        ...unit,
        topics: unit.topics.map((t) => t.id === topicId ? { ...t, status } : t),
        completed_topics: unit.topics.reduce((acc, t) => {
          const st = t.id === topicId ? status : t.status;
          return acc + (st === "completed" ? 1 : 0);
        }, 0),
        progress_percent: unit.total_topics > 0 ? Math.round(
          (unit.topics.reduce((acc, t) => {
            const st = t.id === topicId ? status : t.status;
            return acc + (st === "completed" ? 1 : 0);
          }, 0) / unit.total_topics) * 100
        ) : 0,
      }))
    );
  };

  // Toplam istatistikler
  const totalTopics = units.reduce((s, u) => s + u.total_topics, 0);
  const completedTopics = units.reduce((s, u) => s + u.completed_topics, 0);
  const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const subjectColor = SUBJECT_BG_COLORS[selectedSubject?.name ?? ""] ?? selectedSubject?.color ?? "#6366f1";

  if (!user?.grade) return null;

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full px-4 sm:px-6 py-6">

        {/* Başlık */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              Derslerim
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-slate-500">MEB Müfredatı</span>
              <span className="text-slate-300">·</span>
              {user.grade && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  {user.grade === "mezun" ? "Mezun" : `${user.grade}. Sınıf`}
                </span>
              )}
              {(user.target_exam ?? user.exam_goal) && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                  {user.target_exam ?? user.exam_goal}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push("/ogrenci/onboarding")}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Müfredatı Değiştir</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={loadSubjects} className="ml-auto text-red-600 hover:text-red-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-5">

          {/* ── Sol: Ders Listesi ── */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Dersler
                </p>
              </div>
              {loadingList ? (
                <div className="p-3 space-y-2">
                  {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <ul className="py-2">
                  {subjects.map((subject) => {
                    const color = SUBJECT_BG_COLORS[subject.name] ?? subject.color ?? "#6366f1";
                    const isActive = subject.slug === selectedSlug;
                    return (
                      <li key={subject.slug}>
                        <button
                          onClick={() => setSelectedSlug(subject.slug)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-slate-50 ${
                            isActive ? "bg-indigo-50" : ""
                          }`}
                        >
                          {/* Renk çubuk */}
                          <div className="w-1 h-8 rounded-full flex-shrink-0"
                            style={{ background: isActive ? color : "transparent" }} />
                          {/* İkon */}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                            style={{ background: `${color}18` }}>
                            {subject.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700" : "text-slate-700"}`}>
                              {subject.name}
                            </p>
                            {subject.total_topics != null && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${subject.progress_percent ?? 0}%`, background: color }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {subject.progress_percent ?? 0}%
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* ── Sağ: İçerik Alanı ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Mobilde ders seçimi */}
            <div className="lg:hidden">
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>

            {/* Seçili ders başlığı + istatistik */}
            {selectedSubject && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                    style={{ background: `${subjectColor}18`, border: `2px solid ${subjectColor}30` }}>
                    {selectedSubject.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-900">{selectedSubject.name}</h2>
                    <p className="text-sm text-slate-500">
                      {units.length} ünite • {totalTopics} konu
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: subjectColor }}>
                      %{overallPercent}
                    </div>
                    <div className="text-xs text-slate-500">
                      {completedTopics}/{totalTopics} tamamlandı
                    </div>
                  </div>
                </div>
                {/* Genel progress bar */}
                <div className="mt-4 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${overallPercent}%`, background: subjectColor }}
                  />
                </div>
              </div>
            )}

            {/* Arama */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Konu ara... (örn: İntegral, Hücre, Osmanlı)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >✕</button>
              )}
            </div>

            {/* Üniteler */}
            {loadingUnits ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                {search ? (
                  <>
                    <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-600">"{search}" için konu bulunamadı</p>
                    <button onClick={() => setSearch("")} className="mt-2 text-sm text-indigo-600 hover:underline">
                      Aramayı temizle
                    </button>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-600">Bu ders için henüz içerik yok</p>
                    <p className="text-sm text-slate-500 mt-1">Yakında eklenecek.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUnits.map((unit, i) => (
                  <UnitAccordion
                    key={unit.id}
                    unit={unit}
                    subjectColor={subjectColor}
                    onTopicStatusChange={handleTopicStatusChange}
                    defaultOpen={i === 0}
                  />
                ))}
              </div>
            )}

            {/* İstatistik kartları */}
            {units.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { label: "Toplam Ünite",   value: units.length,     icon: Layers,      color: "#6366f1", bg: "bg-indigo-50" },
                  { label: "Toplam Konu",    value: totalTopics,      icon: BookMarked,  color: "#0ea5e9", bg: "bg-sky-50"    },
                  { label: "Tamamlanan",     value: completedTopics,  icon: CheckCircle, color: "#22c55e", bg: "bg-green-50"  },
                  { label: "Genel İlerleme", value: `%${overallPercent}`, icon: BarChart3, color: "#f59e0b", bg: "bg-amber-50" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-2xl p-3 border border-white shadow-sm`}>
                    <Icon className="w-4 h-4 mb-1" style={{ color }} />
                    <p className="text-xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
