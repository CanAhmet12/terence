"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, CurriculumSubject, CurriculumUnit, CurriculumTopic } from "@/lib/api";
import {
  ChevronDown, Search, CheckCircle, BookOpen,
  Settings, Loader2, GraduationCap, X,
  Play, FileText, FileQuestion, BookMarked,
  ExternalLink, Sparkles, BarChart2, Circle,
} from "lucide-react";

// ─── Konfigürasyon ─────────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
  "Matematik": "#2563eb",
  "TYT Matematik": "#2563eb", "AYT Matematik": "#1d4ed8", "LGS Matematik": "#0891b2",
  "Fizik": "#7c3aed", "AYT Fizik": "#6d28d9",
  "Kimya": "#ea580c", "AYT Kimya": "#c2410c",
  "Biyoloji": "#16a34a", "AYT Biyoloji": "#15803d",
  "Türk Dili ve Edebiyatı": "#dc2626", "TYT Türkçe": "#b91c1c", "LGS Türkçe": "#991b1b",
  "Tarih": "#92400e", "Coğrafya": "#0369a1",
  "TYT Fen Bilimleri": "#059669", "LGS Fen Bilimleri": "#047857",
  "TYT Sosyal Bilimler": "#7e22ce",
  "KPSS Genel Yetenek": "#4338ca", "KPSS Genel Kültür": "#5b21b6",
};

const CONTENT_ICONS: Record<string, { Icon: typeof Play; color: string; label: string }> = {
  video: { Icon: Play,         color: "#ef4444", label: "Video" },
  pdf:   { Icon: FileText,     color: "#f59e0b", label: "PDF"   },
  quiz:  { Icon: FileQuestion, color: "#8b5cf6", label: "Test"  },
  text:  { Icon: BookMarked,   color: "#0ea5e9", label: "Metin" },
};

// ─── Konu Satırı ──────────────────────────────────────────────────────────────

function TopicItem({ topic, color, onStatusChange }: {
  topic: CurriculumTopic;
  color: string;
  onStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const done = topic.status === "completed";
  const items = topic.content_items ?? [];

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = done ? "not_started" : "completed";
    setUpdating(true);
    try { await api.updateCurriculumProgress(topic.id, next); onStatusChange(topic.id, next); }
    catch { /* silent */ } finally { setUpdating(false); }
  };

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Konu başlık satırı */}
      <div
        className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors group select-none ${
          open ? "bg-slate-50" : "hover:bg-slate-50/60"
        }`}
        onClick={() => setOpen(o => !o)}
      >
        {/* Tamamlama */}
        <button
          onClick={toggle} disabled={updating}
          className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 group-hover:border-slate-400"
          }`}
        >
          {updating
            ? <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
            : done ? <CheckCircle className="w-2.5 h-2.5 text-white" /> : null
          }
        </button>

        {/* MEB kodu */}
        {topic.meb_code && (
          <span className="text-[10px] font-mono font-bold shrink-0 hidden sm:block"
            style={{ color: `${color}80` }}>
            {topic.meb_code}
          </span>
        )}

        {/* Başlık */}
        <span className={`flex-1 text-sm leading-snug ${
          done ? "line-through text-slate-400" : "text-slate-700 group-hover:text-slate-900"
        }`}>
          {topic.title}
        </span>

        {/* İçerik rozetleri */}
        {items.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {items.slice(0, 3).map(ci => {
              const conf = CONTENT_ICONS[ci.type] ?? CONTENT_ICONS.text;
              return (
                <span key={ci.id}
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ background: `${conf.color}18` }}>
                  <conf.Icon className="w-2.5 h-2.5" style={{ color: conf.color }} />
                </span>
              );
            })}
          </div>
        )}

        {/* Genişlet ok */}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 shrink-0 transition-transform ${open ? "rotate-180 text-slate-500" : ""}`} />
      </div>

      {/* İçerik paneli */}
      {open && (
        <div className="px-5 pb-4 pt-1 bg-slate-50/80 space-y-3">
          {items.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">İçerikler</p>
              {items.map(ci => {
                const conf = CONTENT_ICONS[ci.type] ?? CONTENT_ICONS.text;
                const Icon = conf.Icon;
                return (
                  <a key={ci.id} href={ci.url ?? "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group/item">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${conf.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: conf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{ci.title}</p>
                      <p className="text-xs text-slate-400">
                        {conf.label}{ci.duration_seconds ? ` · ${Math.round(ci.duration_seconds / 60)} dk` : ""}
                        {!ci.is_free && <span className="ml-1 text-amber-500 font-semibold">Pro</span>}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-slate-500 shrink-0" />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}12` }}>
                <Sparkles className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">İçerik Yakında</p>
                <p className="text-xs text-slate-400">Video, PDF ve sorular hazırlanıyor.</p>
              </div>
            </div>
          )}

          <a href="/ogrenci/soru-bankasi"
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color }}>
            <BookMarked className="w-3.5 h-3.5" />
            Bu konunun sorularını çöz
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Ünite Accordion ──────────────────────────────────────────────────────────

function UnitAccordion({ unit, color, defaultOpen, onTopicStatusChange }: {
  unit: CurriculumUnit;
  color: string;
  defaultOpen: boolean;
  onTopicStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = unit.progress_percent ?? 0;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Ünite başlık */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        {/* Numara badge */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
          style={{ background: color }}
        >
          {unit.sort_order}
        </div>

        {/* Başlık + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-bold text-slate-900 text-sm leading-tight">{unit.title}</p>
            {unit.meb_code && (
              <span className="text-[10px] font-mono text-slate-400 hidden sm:block">{unit.meb_code}</span>
            )}
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 tabular-nums">
              {unit.completed_topics}/{unit.total_topics}
            </span>
          </div>
        </div>

        {/* Yüzde */}
        <div className="text-right shrink-0">
          <span className="text-base font-black" style={{ color: pct > 0 ? color : "#cbd5e1" }}>
            %{pct}
          </span>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Konular */}
      {open && (
        <div className="border-t border-slate-100">
          {unit.topics.length === 0 ? (
            <p className="text-sm text-slate-400 px-5 py-4">Konu bulunamadı.</p>
          ) : unit.topics.map(t => (
            <TopicItem key={t.id} topic={t} color={color} onStatusChange={onTopicStatusChange} />
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
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradeStr = user?.grade != null ? String(user.grade) : undefined;
  const examStr  = user?.target_exam ?? user?.exam_goal ?? undefined;
  const hasGrade = !!gradeStr && gradeStr !== "null" && gradeStr !== "";

  // Ders listesini yükle
  const loadSubjects = useCallback(async () => {
    if (!user || !hasGrade) return;
    setLoadingList(true); setError(null);
    try {
      const res = await api.getCurriculum(gradeStr, examStr);
      const list = Array.isArray(res?.subjects) ? res.subjects : [];
      setSubjects(list);
      if (list.length > 0) setActiveSlug(p => p || list[0].slug);
    } catch (e) { setError((e as Error).message); }
    finally { setLoadingList(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.grade, user?.target_exam, user?.exam_goal]);

  useEffect(() => { if (!authLoading) loadSubjects(); }, [authLoading, loadSubjects]);

  // Seçili dersin ünitelerini yükle
  useEffect(() => {
    if (!activeSlug) return;
    setLoadingUnits(true); setUnits([]);
    api.getCurriculumSubject(activeSlug)
      .then(res => setUnits(Array.isArray(res.units) ? res.units : []))
      .catch(() => setUnits([]))
      .finally(() => setLoadingUnits(false));
  }, [activeSlug]);

  // Konu durumu güncellenince state'i güncelle
  const handleTopicStatusChange = (topicId: number, status: "not_started" | "in_progress" | "completed") => {
    setUnits(prev => prev.map(u => ({
      ...u,
      topics: u.topics.map(t => t.id === topicId ? { ...t, status } : t),
      completed_topics: u.topics.filter(t => (t.id === topicId ? status : t.status) === "completed").length,
      progress_percent: u.total_topics > 0
        ? Math.round(u.topics.filter(t => (t.id === topicId ? status : t.status) === "completed").length / u.total_topics * 100)
        : 0,
    })));
  };

  const activeSubject = subjects.find(s => s.slug === activeSlug);
  const activeColor   = SUBJECT_COLORS[activeSubject?.name ?? ""] ?? activeSubject?.color ?? "#6366f1";

  const filteredUnits = units.map(u => ({
    ...u,
    topics: search ? u.topics.filter(t => t.title.toLowerCase().includes(search.toLowerCase())) : u.topics,
  })).filter(u => !search || u.topics.length > 0);

  const totalTopics     = units.reduce((s, u) => s + u.total_topics, 0);
  const completedTopics = units.reduce((s, u) => s + u.completed_topics, 0);
  const overallPct      = totalTopics > 0 ? Math.round(completedTopics / totalTopics * 100) : 0;

  // Guard durumları
  if (authLoading) return (
    <div className="min-h-full flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );
  if (!hasGrade) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm text-slate-500">Müfredatın ayarlanmamış.</p>
        <button onClick={() => router.push("/ogrenci/onboarding")}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl">
          Müfredatı Ayarla
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">

        {/* ── Sayfa başlığı ── */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-slate-500" />
              <h1 className="text-xl font-bold text-slate-900">Derslerim</h1>
            </div>
            <div className="h-4 w-px bg-slate-300 hidden sm:block" />
            <span className="text-sm text-slate-500">MEB Müfredatı</span>
            {gradeStr && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                style={{ borderColor: `${activeColor}35`, color: activeColor, background: `${activeColor}08` }}>
                {gradeStr === "mezun" ? "Mezun" : `${gradeStr}. Sınıf`}
              </span>
            )}
            {examStr && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
                {examStr}
              </span>
            )}
          </div>
          <button onClick={() => router.push("/ogrenci/onboarding")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300">
            <Settings className="w-3.5 h-3.5" />
            Müfredatı Değiştir
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 flex items-center gap-2">
            {error}
            <button onClick={loadSubjects} className="ml-auto text-red-500 hover:text-red-700">Yenile</button>
          </div>
        )}

        {/* ── İki kolon layout ── */}
        <div className="flex gap-5">

          {/* SOL: Ders Seçici */}
          <div className="w-56 shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dersler</p>
              </div>
              <div className="py-1.5 max-h-[calc(100vh-200px)] overflow-y-auto">
                {loadingList ? (
                  <div className="px-3 py-2 space-y-1.5">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : subjects.map(subj => {
                  const c = SUBJECT_COLORS[subj.name] ?? subj.color ?? "#6366f1";
                  const active = subj.slug === activeSlug;
                  return (
                    <button key={subj.slug} onClick={() => setActiveSlug(subj.slug)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                        active ? "bg-slate-50" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <div className={`w-1 h-7 rounded-full shrink-0 transition-all ${active ? "opacity-100" : "opacity-0"}`}
                        style={{ background: c }} />
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ background: `${c}15` }}>
                        {subj.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] leading-tight truncate ${active ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
                          {subj.name}
                        </p>
                        {subj.progress_percent != null && (
                          <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${subj.progress_percent}%`, background: c }} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SAĞ: Ders İçeriği */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Mobil ders seçici */}
            <div className="lg:hidden">
              <select value={activeSlug} onChange={e => setActiveSlug(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 outline-none">
                {subjects.map(s => <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>)}
              </select>
            </div>

            {/* Ders başlık kartı */}
            {activeSubject && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${activeColor}12` }}>
                    {activeSubject.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">{activeSubject.name}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm text-slate-500">{units.length} ünite</span>
                      <span className="text-slate-300 text-xs">·</span>
                      <span className="text-sm text-slate-500">{totalTopics} konu</span>
                      <span className="text-slate-300 text-xs">·</span>
                      <span className="text-sm text-slate-500">{completedTopics} tamamlandı</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black" style={{ color: activeColor }}>%{overallPct}</p>
                    <p className="text-xs text-slate-400 mt-0.5">tamamlandı</p>
                  </div>
                </div>
                {/* Genel progress */}
                <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${overallPct}%`, background: activeColor }} />
                </div>
              </div>
            )}

            {/* Arama */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Konu veya kazanım ara..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none shadow-sm placeholder-slate-400"
                style={{ '--tw-ring-color': activeColor } as React.CSSProperties} />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Üniteler */}
            {loadingUnits ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-600 text-sm">
                  {search ? `"${search}" ile eşleşen konu bulunamadı` : "Bu ders için henüz içerik yok"}
                </p>
                {search && (
                  <button onClick={() => setSearch("")} className="mt-2 text-xs font-semibold"
                    style={{ color: activeColor }}>
                    Aramayı Temizle
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUnits.map((unit, i) => (
                  <UnitAccordion key={unit.id} unit={unit} color={activeColor}
                    defaultOpen={i === 0}
                    onTopicStatusChange={handleTopicStatusChange} />
                ))}
              </div>
            )}

            {/* Alt istatistik kartları */}
            {units.length > 0 && !loadingUnits && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { label: "Toplam Ünite",  value: units.length,     color: "#6366f1",  bg: "#f5f3ff" },
                  { label: "Toplam Konu",   value: totalTopics,      color: "#0ea5e9",  bg: "#f0f9ff" },
                  { label: "Tamamlanan",    value: completedTopics,  color: "#22c55e",  bg: "#f0fdf4" },
                  { label: "Tamamlanma",    value: `%${overallPct}`, color: "#f59e0b",  bg: "#fffbeb" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="rounded-2xl p-4 border border-white shadow-sm"
                    style={{ background: bg }}>
                    <p className="text-[11px] font-semibold text-slate-500 mb-1">{label}</p>
                    <p className="text-xl font-black" style={{ color }}>{value}</p>
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
