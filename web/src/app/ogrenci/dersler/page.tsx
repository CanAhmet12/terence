"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, CurriculumSubject, CurriculumUnit, CurriculumTopic } from "@/lib/api";
import {
  ChevronDown, ChevronRight, Search, CheckCircle,
  BookOpen, Settings, Loader2, GraduationCap,
  X, Play, FileText, FileQuestion, BookMarked,
  ExternalLink, Sparkles,
} from "lucide-react";

// ─── Renkler ──────────────────────────────────────────────────────────────────

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

const CONTENT_ICONS: Record<string, { Icon: typeof Play; color: string; label: string }> = {
  video: { Icon: Play,         color: "#ef4444", label: "Video" },
  pdf:   { Icon: FileText,     color: "#f59e0b", label: "PDF"   },
  quiz:  { Icon: FileQuestion, color: "#8b5cf6", label: "Test"  },
  text:  { Icon: BookMarked,   color: "#0ea5e9", label: "Metin" },
};

// ─── Konu Accordion ───────────────────────────────────────────────────────────

function TopicRow({ topic, color, depth, onStatusChange }: {
  topic: CurriculumTopic;
  color: string;
  depth: number;
  onStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const done = topic.status === "completed";
  const items = topic.content_items ?? [];

  const toggleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = done ? "not_started" : "completed";
    setUpdating(true);
    try { await api.updateCurriculumProgress(topic.id, next); onStatusChange(topic.id, next); }
    catch { /* silent */ } finally { setUpdating(false); }
  };

  return (
    <div>
      {/* Konu başlık satırı */}
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 py-2.5 pr-4 cursor-pointer select-none hover:bg-slate-100/60 transition-colors rounded-lg"
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {/* Tamamlama butonu */}
        <button
          onClick={toggleDone} disabled={updating}
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-emerald-400"
          }`}
        >
          {updating
            ? <Loader2 className="w-2 h-2 animate-spin text-white" />
            : done ? <CheckCircle className="w-2.5 h-2.5 text-white" /> : null}
        </button>

        {/* Konu adı */}
        <span className={`flex-1 text-sm leading-snug ${done ? "line-through text-slate-400" : "text-slate-700"}`}>
          {topic.title}
        </span>

        {/* İçerik rozetleri */}
        {items.length > 0 && (
          <div className="flex gap-0.5 shrink-0">
            {items.slice(0, 2).map(ci => {
              const conf = CONTENT_ICONS[ci.type] ?? CONTENT_ICONS.text;
              return (
                <span key={ci.id} className="w-4 h-4 rounded flex items-center justify-center"
                  style={{ background: `${conf.color}18` }}>
                  <conf.Icon className="w-2 h-2" style={{ color: conf.color }} />
                </span>
              );
            })}
          </div>
        )}

        <ChevronDown
          className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* İçerik detay */}
      {open && (
        <div className="ml-[36px] mr-2 mb-2 mt-0.5 p-3 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          {items.length > 0 ? (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">İçerikler</p>
              {items.map(ci => {
                const conf = CONTENT_ICONS[ci.type] ?? CONTENT_ICONS.text;
                return (
                  <a key={ci.id} href={ci.url ?? "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm bg-slate-50 transition-all group">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${conf.color}15` }}>
                      <conf.Icon className="w-3.5 h-3.5" style={{ color: conf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{ci.title}</p>
                      <p className="text-[10px] text-slate-400">{conf.label}
                        {ci.duration_seconds ? ` · ${Math.round(ci.duration_seconds / 60)} dk` : ""}
                        {!ci.is_free && <span className="ml-1 text-amber-500 font-semibold">Pro</span>}
                      </p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />
                  </a>
                );
              })}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-1">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color }} />
              <div>
                <p className="text-xs font-semibold text-slate-700">İçerik Yakında Eklenecek</p>
                <p className="text-[10px] text-slate-400">Video, PDF ve sorular hazırlanıyor.</p>
              </div>
            </div>
          )}
          <a href="/ogrenci/soru-bankasi"
            className="flex items-center gap-1 text-[11px] font-semibold"
            style={{ color }}>
            <BookMarked className="w-3 h-3" />
            Bu konunun sorularını çöz
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Ünite Accordion ──────────────────────────────────────────────────────────

function UnitRow({ unit, color, depth, onTopicStatusChange }: {
  unit: CurriculumUnit;
  color: string;
  depth: number;
  onTopicStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [open, setOpen] = useState(false);
  const pct = unit.progress_percent ?? 0;

  return (
    <div>
      {/* Ünite başlık satırı */}
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 py-2.5 pr-4 cursor-pointer select-none hover:bg-slate-100/60 transition-colors rounded-lg"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Numara badge */}
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0"
          style={{ background: color }}>
          {unit.sort_order}
        </div>

        {/* Başlık */}
        <span className="flex-1 text-sm font-semibold text-slate-800 leading-snug">
          {unit.title}
        </span>

        {/* İlerleme */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 tabular-nums w-8 text-right">
            {unit.completed_topics}/{unit.total_topics}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Konular */}
      {open && (
        <div className="ml-1 mt-0.5 mb-1 border-l-2 pl-2" style={{ borderColor: `${color}30` }}>
          {unit.topics.length === 0
            ? <p className="text-xs text-slate-400 py-2 pl-3">Konu bulunamadı.</p>
            : unit.topics.map(t => (
              <TopicRow key={t.id} topic={t} color={color} depth={depth + 1} onStatusChange={onTopicStatusChange} />
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── Ders Accordion (sol menüde) ──────────────────────────────────────────────

function SubjectRow({ subject, units, loading, onOpen, onTopicStatusChange }: {
  subject: CurriculumSubject;
  units: CurriculumUnit[];
  loading: boolean;
  onOpen: () => void;
  onTopicStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [open, setOpen] = useState(false);
  const color = SUBJECT_COLORS[subject.name] ?? subject.color ?? "#6366f1";
  const pct = subject.progress_percent ?? 0;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) onOpen(); // ilk açılışta üniteleri yükle
  };

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Ders başlık */}
      <div
        onClick={handleToggle}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
          open ? "bg-slate-50" : "hover:bg-slate-50/80"
        }`}
      >
        {/* Sol renk çizgisi */}
        <div className="w-0.5 h-8 rounded-full shrink-0 transition-all"
          style={{ background: open ? color : "transparent" }} />

        {/* İkon */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ background: `${color}15` }}>
          {subject.icon}
        </div>

        {/* Ad + progress */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-tight truncate ${open ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
            {subject.name}
          </p>
          <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Ünite + Konu listesi */}
      {open && (
        <div className="px-3 pb-2 pt-1 bg-slate-50/50">
          {loading ? (
            <div className="space-y-1.5 py-2">
              {[1,2,3].map(i => <div key={i} className="h-9 bg-slate-200 rounded-lg animate-pulse" />)}
            </div>
          ) : units.length === 0 ? (
            <div className="py-6 text-center">
              <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs text-slate-400">Bu ders için henüz içerik yok.</p>
            </div>
          ) : units.map(unit => (
            <UnitRow key={unit.id} unit={unit} color={color} depth={1} onTopicStatusChange={onTopicStatusChange} />
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
  const [unitsBySlug, setUnitsBySlug] = useState<Record<string, CurriculumUnit[]>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const gradeStr = user?.grade != null ? String(user.grade) : undefined;
  const examStr  = user?.target_exam ?? user?.exam_goal ?? undefined;
  const hasGrade = !!gradeStr && gradeStr !== "null" && gradeStr !== "";

  // Ders listesi
  const loadSubjects = useCallback(async () => {
    if (!user || !hasGrade) return;
    setLoadingList(true); setError(null);
    try {
      const res = await api.getCurriculum(gradeStr, examStr);
      setSubjects(Array.isArray(res?.subjects) ? res.subjects : []);
    } catch (e) { setError((e as Error).message); }
    finally { setLoadingList(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.grade, user?.target_exam, user?.exam_goal]);

  useEffect(() => { if (!authLoading) loadSubjects(); }, [authLoading, loadSubjects]);

  // Bir ders açılınca ünitelerini lazy yükle
  const loadUnits = useCallback(async (slug: string) => {
    if (unitsBySlug[slug]) return; // zaten yüklü
    setLoadingSlug(slug);
    try {
      const res = await api.getCurriculumSubject(slug);
      setUnitsBySlug(p => ({ ...p, [slug]: Array.isArray(res.units) ? res.units : [] }));
    } catch {
      setUnitsBySlug(p => ({ ...p, [slug]: [] }));
    } finally { setLoadingSlug(null); }
  }, [unitsBySlug]);

  // Konu durum güncellemesi
  const handleTopicStatusChange = useCallback((slug: string, topicId: number, status: "not_started" | "in_progress" | "completed") => {
    setUnitsBySlug(prev => {
      const units = prev[slug] ?? [];
      return {
        ...prev,
        [slug]: units.map(u => ({
          ...u,
          topics: u.topics.map(t => t.id === topicId ? { ...t, status } : t),
          completed_topics: u.topics.filter(t => (t.id === topicId ? status : t.status) === "completed").length,
          progress_percent: u.total_topics > 0
            ? Math.round(u.topics.filter(t => (t.id === topicId ? status : t.status) === "completed").length / u.total_topics * 100)
            : 0,
        })),
      };
    });
  }, []);

  // Arama filtresi
  const filteredSubjects = search
    ? subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : subjects;

  // Guard
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
      <div className="w-full px-4 sm:px-6 py-6">

        {/* Başlık */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <GraduationCap className="w-5 h-5 text-slate-500" />
            <h1 className="text-xl font-bold text-slate-900">Derslerim</h1>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500">MEB Müfredatı</span>
            {gradeStr && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
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
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors">
            <Settings className="w-3.5 h-3.5" />
            Müfredatı Değiştir
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 flex items-center gap-2">
            {error}
            <button onClick={loadSubjects} className="ml-auto text-red-500 text-xs font-semibold hover:underline">Yenile</button>
          </div>
        )}

        {/* Arama */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Ders, ünite veya konu ara..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ders listesi — tek kolon accordion */}
        {loadingList ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600 text-sm">
              {search ? `"${search}" ile eşleşen ders bulunamadı` : "Henüz ders yok"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredSubjects.map(subject => (
              <SubjectRow
                key={subject.slug}
                subject={subject}
                units={unitsBySlug[subject.slug] ?? []}
                loading={loadingSlug === subject.slug}
                onOpen={() => loadUnits(subject.slug)}
                onTopicStatusChange={(tid, s) => handleTopicStatusChange(subject.slug, tid, s)}
              />
            ))}
          </div>
        )}

        {/* Son boşluk */}
        <div className="h-4" />

      </div>
    </div>
  );
}
