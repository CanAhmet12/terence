"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, CurriculumSubject, CurriculumUnit, CurriculumTopic, CurriculumContentItem } from "@/lib/api";
import {
  ChevronDown, ChevronRight, Search, Play, FileText,
  CheckCircle, BookOpen, RefreshCw, Video,
  FileQuestion, BookMarked, Settings, Layers,
  Loader2, GraduationCap, X, ExternalLink,
  Circle, BarChart2, Lock, Sparkles
} from "lucide-react";

// ─── Tema Sabitleri ────────────────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, string> = {
  "Matematik": "#2563eb", "TYT Matematik": "#2563eb", "AYT Matematik": "#1d4ed8", "LGS Matematik": "#0891b2",
  "Fizik": "#7c3aed", "AYT Fizik": "#6d28d9",
  "Kimya": "#ea580c", "AYT Kimya": "#c2410c",
  "Biyoloji": "#16a34a", "AYT Biyoloji": "#15803d",
  "Türk Dili ve Edebiyatı": "#dc2626", "TYT Türkçe": "#b91c1c", "LGS Türkçe": "#991b1b",
  "Tarih": "#92400e", "Coğrafya": "#0369a1",
  "TYT Fen Bilimleri": "#059669", "LGS Fen Bilimleri": "#047857",
  "TYT Sosyal Bilimler": "#7e22ce",
  "KPSS Genel Yetenek": "#4338ca", "KPSS Genel Kültür": "#5b21b6",
};

const CONTENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof Play }> = {
  video: { label: "Video",  color: "#ef4444", bg: "#fef2f2", Icon: Play         },
  pdf:   { label: "PDF",   color: "#f59e0b", bg: "#fffbeb", Icon: FileText      },
  quiz:  { label: "Test",  color: "#8b5cf6", bg: "#f5f3ff", Icon: FileQuestion  },
  text:  { label: "Metin", color: "#0ea5e9", bg: "#f0f9ff", Icon: BookMarked    },
};

// ─── Yardımcı bileşenler ──────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-lg animate-pulse ${className ?? ""}`} />;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

// ─── İçerik Paneli ────────────────────────────────────────────────────────────
function ContentPanel({ topic, subjectColor, onClose }: {
  topic: CurriculumTopic;
  subjectColor: string;
  onClose: () => void;
}) {
  const items = topic.content_items ?? [];
  const hasContent = items.length > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: `${subjectColor}15`, color: subjectColor }}>
              {topic.meb_code ?? "Konu"}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 leading-tight">{topic.title}</h3>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {hasContent ? (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              İçerikler ({items.length})
            </p>
            <div className="space-y-2">
              {items.map((item) => {
                const conf = CONTENT_TYPE_CONFIG[item.type] ?? CONTENT_TYPE_CONFIG.text;
                const Icon = conf.Icon;
                return (
                  <a key={item.id} href={item.url ?? "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
                    style={{ background: conf.bg }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${conf.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: conf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{conf.label}
                        {item.duration_seconds ? ` · ${Math.round(item.duration_seconds / 60)} dk` : ""}
                        {!item.is_free && <span className="ml-1.5 text-amber-500">Pro</span>}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                  </a>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `${subjectColor}10` }}>
              <Sparkles className="w-6 h-6" style={{ color: subjectColor }} />
            </div>
            <p className="font-semibold text-slate-700 text-sm">İçerik Yakında</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[200px] mx-auto">
              Bu konu için video, PDF ve sorular yakında eklenecek.
            </p>
          </div>
        )}

        {/* Konu anlatımı placeholder */}
        <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5" />
            Soru Bankası
          </p>
          <a href={`/ogrenci/soru-bankasi`}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: subjectColor }}>
            Bu konunun sorularını çöz
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Konu Satırı ──────────────────────────────────────────────────────────────
function TopicRow({ topic, subjectColor, isSelected, onSelect, onStatusChange }: {
  topic: CurriculumTopic;
  subjectColor: string;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [updating, setUpdating] = useState(false);
  const isDone = topic.status === "completed";

  const toggleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = isDone ? "not_started" : "completed";
    setUpdating(true);
    try { await api.updateCurriculumProgress(topic.id, next); onStatusChange(topic.id, next); }
    catch { /* silent */ }
    setUpdating(false);
  };

  const hasContent = (topic.content_items?.length ?? 0) > 0;

  return (
    <button onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left group ${
        isSelected
          ? "shadow-sm"
          : "hover:bg-slate-50"
      }`}
      style={isSelected ? { background: `${subjectColor}08`, borderLeft: `3px solid ${subjectColor}` } : {}}
    >
      {/* Tamamlama butonu */}
      <button onClick={toggleDone} disabled={updating}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          isDone ? "border-emerald-500 bg-emerald-500" : "border-slate-300 group-hover:border-slate-400"
        }`}>
        {updating ? <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
          : isDone ? <CheckCircle className="w-3 h-3 text-white" /> : null}
      </button>

      {/* Başlık */}
      <span className={`flex-1 text-sm leading-tight ${isDone ? "line-through text-slate-400" : isSelected ? "font-semibold text-slate-900" : "text-slate-700"}`}>
        {topic.title}
      </span>

      {/* İçerik ikonları */}
      <div className="flex items-center gap-1 shrink-0">
        {hasContent && (topic.content_items ?? []).slice(0, 2).map((ci) => {
          const conf = CONTENT_TYPE_CONFIG[ci.type] ?? CONTENT_TYPE_CONFIG.text;
          return (
            <span key={ci.id} className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: conf.bg }}>
              <conf.Icon className="w-2.5 h-2.5" style={{ color: conf.color }} />
            </span>
          );
        })}
        <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isSelected ? "" : "text-slate-300 group-hover:text-slate-400"}`}
          style={isSelected ? { color: subjectColor } : {}} />
      </div>
    </button>
  );
}

// ─── Ünite Accordion ──────────────────────────────────────────────────────────
function UnitSection({ unit, subjectColor, selectedTopicId, onTopicSelect, onTopicStatusChange, defaultOpen }: {
  unit: CurriculumUnit;
  subjectColor: string;
  selectedTopicId: number | null;
  onTopicSelect: (t: CurriculumTopic) => void;
  onTopicStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = unit.progress_percent ?? 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition-colors">
        {/* Numara */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
          style={{ background: subjectColor }}>
          {unit.sort_order}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-bold text-slate-800 text-sm leading-tight">{unit.title}</p>
          <div className="flex items-center gap-2">
            <ProgressBar value={pct} color={subjectColor} />
            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
              {unit.completed_topics}/{unit.total_topics}
            </span>
          </div>
        </div>

        {/* Meb kodu */}
        {unit.meb_code && (
          <span className="text-[10px] font-mono text-slate-400 shrink-0 hidden sm:block">
            {unit.meb_code}
          </span>
        )}

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 py-1.5 px-1">
          {unit.topics.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 px-3">Konu bulunamadı.</p>
          ) : unit.topics.map((t) => (
            <TopicRow key={t.id} topic={t} subjectColor={subjectColor}
              isSelected={selectedTopicId === t.id}
              onSelect={() => onTopicSelect(t)}
              onStatusChange={onTopicStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function DerslerimPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradeStr = user?.grade != null ? String(user.grade) : undefined;
  const examStr = user?.target_exam ?? user?.exam_goal ?? undefined;
  const hasGrade = gradeStr != null && gradeStr !== "" && gradeStr !== "null";

  // Ders listesi
  const loadSubjects = useCallback(async () => {
    if (!user || !hasGrade) return;
    setLoadingList(true); setError(null);
    try {
      const res = await api.getCurriculum(gradeStr, examStr);
      const list = Array.isArray(res?.subjects) ? res.subjects : [];
      setSubjects(list);
      if (list.length > 0) setSelectedSlug(p => p || list[0].slug);
    } catch (e) { setError((e as Error).message); }
    finally { setLoadingList(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.grade, user?.target_exam, user?.exam_goal]);

  useEffect(() => { if (!authLoading) loadSubjects(); }, [authLoading, loadSubjects]);

  // Ünite listesi
  useEffect(() => {
    if (!selectedSlug) return;
    setLoadingUnits(true); setUnits([]); setSelectedTopic(null);
    api.getCurriculumSubject(selectedSlug)
      .then(res => setUnits(Array.isArray(res.units) ? res.units : []))
      .catch(() => setUnits([]))
      .finally(() => setLoadingUnits(false));
  }, [selectedSlug]);

  const selectedSubject = subjects.find(s => s.slug === selectedSlug);
  const subjectColor = SUBJECT_COLORS[selectedSubject?.name ?? ""] ?? selectedSubject?.color ?? "#6366f1";

  // Arama filtresi
  const filteredUnits = units.map(u => ({
    ...u,
    topics: search ? u.topics.filter(t => t.title.toLowerCase().includes(search.toLowerCase())) : u.topics,
  })).filter(u => !search || u.topics.length > 0);

  // Konu durum güncellemesi
  const handleTopicStatusChange = (topicId: number, status: "not_started" | "in_progress" | "completed") => {
    setUnits(prev => prev.map(u => ({
      ...u,
      topics: u.topics.map(t => t.id === topicId ? { ...t, status } : t),
      completed_topics: u.topics.filter(t => (t.id === topicId ? status : t.status) === "completed").length,
      progress_percent: u.total_topics > 0
        ? Math.round((u.topics.filter(t => (t.id === topicId ? status : t.status) === "completed").length / u.total_topics) * 100)
        : 0,
    })));
    if (selectedTopic?.id === topicId) setSelectedTopic(p => p ? { ...p, status } : p);
  };

  // İstatistikler
  const totalTopics = units.reduce((s, u) => s + u.total_topics, 0);
  const completedTopics = units.reduce((s, u) => s + u.completed_topics, 0);
  const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Loading/guard durumları
  if (authLoading) return (
    <div className="min-h-full flex items-center justify-center bg-slate-50">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  if (!hasGrade) return (
    <div className="min-h-full flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm text-slate-500">Müfredatın ayarlanmamış.</p>
        <button onClick={() => router.push("/ogrenci/onboarding")}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg">
          Müfredatı Ayarla
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full h-full flex flex-col">

        {/* ── Üst başlık çubuğu ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-slate-500" />
            <h1 className="text-base font-bold text-slate-800">Derslerim</h1>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">MEB Müfredatı</span>
            {gradeStr && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
                style={{ borderColor: `${subjectColor}40`, color: subjectColor, background: `${subjectColor}08` }}>
                {gradeStr === "mezun" ? "Mezun" : `${gradeStr}. Sınıf`}
              </span>
            )}
            {examStr && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {examStr}
              </span>
            )}
          </div>
          <button onClick={() => router.push("/ogrenci/onboarding")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
            <Settings className="w-3.5 h-3.5" />
            Müfredatı Değiştir
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={loadSubjects} className="ml-auto"><RefreshCw className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── Ana layout: 3 panel ── */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

          {/* Panel 1: Ders listesi */}
          <div className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dersler</p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {loadingList ? (
                <div className="px-3 space-y-2 pt-1">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-11" />)}
                </div>
              ) : subjects.map(subject => {
                const color = SUBJECT_COLORS[subject.name] ?? subject.color ?? "#6366f1";
                const isActive = subject.slug === selectedSlug;
                return (
                  <button key={subject.slug} onClick={() => setSelectedSlug(subject.slug)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${isActive ? "bg-slate-50" : "hover:bg-slate-50/60"}`}>
                    {/* Sol çubuk */}
                    <div className="w-0.5 h-8 rounded-full shrink-0"
                      style={{ background: isActive ? color : "transparent" }} />
                    {/* İkon */}
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ background: `${color}15` }}>
                      {subject.icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={`text-[13px] font-semibold truncate leading-tight ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                        {subject.name}
                      </p>
                      {subject.total_topics != null && (
                        <ProgressBar value={subject.progress_percent ?? 0} color={color} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobil ders seçimi */}
          <div className="lg:hidden px-4 pt-3 bg-white border-b border-slate-200 w-full">
            <select value={selectedSlug} onChange={e => setSelectedSlug(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none mb-3">
              {subjects.map(s => <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>)}
            </select>
          </div>

          {/* Panel 2: Ünite/Konu listesi */}
          <div className={`flex flex-col transition-all duration-300 bg-slate-50 border-r border-slate-200 ${selectedTopic ? "w-72 shrink-0" : "flex-1"}`}>
            {/* Ders başlığı + stats */}
            {selectedSubject && (
              <div className="bg-white border-b border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${subjectColor}12` }}>
                    {selectedSubject.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-tight">{selectedSubject.name}</p>
                    <p className="text-xs text-slate-500">{units.length} ünite · {totalTopics} konu</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black" style={{ color: subjectColor }}>%{overallPct}</p>
                  </div>
                </div>
                <ProgressBar value={overallPct} color={subjectColor} />
              </div>
            )}

            {/* Arama */}
            <div className="px-3 py-2.5 bg-white border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Konu ara…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 outline-none"
                  style={{ '--tw-ring-color': subjectColor } as React.CSSProperties} />
                {search && (
                  <button onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Üniteler */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingUnits ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-16" />)
              ) : filteredUnits.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    {search ? `"${search}" bulunamadı` : "Bu ders için henüz içerik yok"}
                  </p>
                </div>
              ) : filteredUnits.map((unit, i) => (
                <UnitSection key={unit.id} unit={unit} subjectColor={subjectColor}
                  selectedTopicId={selectedTopic?.id ?? null}
                  onTopicSelect={setSelectedTopic}
                  onTopicStatusChange={handleTopicStatusChange}
                  defaultOpen={i === 0} />
              ))}
            </div>

            {/* Alt istatistikler */}
            {units.length > 0 && (
              <div className="border-t border-slate-200 bg-white px-4 py-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Ünite",       value: units.length,     icon: Layers    },
                  { label: "Konu",        value: totalTopics,      icon: BookOpen  },
                  { label: "Tamamlanan",  value: completedTopics,  icon: CheckCircle },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center">
                    <Icon className="w-3.5 h-3.5 mx-auto mb-0.5 text-slate-400" />
                    <p className="text-sm font-bold text-slate-900">{value}</p>
                    <p className="text-[10px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel 3: Konu İçerik Paneli */}
          {selectedTopic ? (
            <div className="flex-1 min-w-0 overflow-y-auto">
              <ContentPanel topic={selectedTopic} subjectColor={subjectColor}
                onClose={() => setSelectedTopic(null)} />
            </div>
          ) : (
            <div className="flex-1 hidden lg:flex items-center justify-center bg-slate-50/50">
              <div className="text-center space-y-3 max-w-xs px-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: `${subjectColor}10` }}>
                  <BookOpen className="w-7 h-7" style={{ color: subjectColor }} />
                </div>
                <p className="font-semibold text-slate-600 text-sm">Bir konu seçin</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sol taraftan bir konuya tıklayarak içerikleri, notları ve soruları görüntüleyebilirsiniz.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
