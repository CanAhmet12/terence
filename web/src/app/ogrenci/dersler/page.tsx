"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, CurriculumSubject, CurriculumUnit, CurriculumTopic } from "@/lib/api";
import {
  ChevronDown, ChevronRight, Search, CheckCircle,
  BookOpen, Settings, Loader2, GraduationCap,
  X, Play, FileText, FileQuestion, BookMarked,
  ExternalLink, Sparkles, BarChart2,
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

// ─── Sağ Taraf: Seçili Konu İçerik Paneli ─────────────────────────────────────

function ContentPanel({ topic, subject, unit, color }: {
  topic: CurriculumTopic;
  subject: CurriculumSubject;
  unit: CurriculumUnit;
  color: string;
}) {
  const items = topic.content_items ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Üst başlık */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <span>{subject.icon} {subject.name}</span>
          <ChevronRight className="w-3 h-3" />
          <span>{unit.title}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{topic.title}</h1>
        {topic.meb_code && (
          <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ background: `${color}12`, color }}>
            {topic.meb_code}
          </span>
        )}
      </div>

      {/* İçerik alanı */}
      <div className="flex-1 overflow-y-auto px-8 py-7 space-y-8 bg-slate-50">

        {/* İçerikler varsa göster */}
        {items.length > 0 ? (
          <div>
            <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
              <BookMarked className="w-4 h-4" style={{ color }} />
              İçerikler
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map(ci => {
                const conf = CONTENT_ICONS[ci.type] ?? CONTENT_ICONS.text;
                const Icon = conf.Icon;
                return (
                  <a key={ci.id} href={ci.url ?? "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${conf.color}15` }}>
                      <Icon className="w-6 h-6" style={{ color: conf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 leading-tight">{ci.title}</p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {conf.label}
                        {ci.duration_seconds ? ` · ${Math.round(ci.duration_seconds / 60)} dk` : ""}
                        {!ci.is_free && (
                          <span className="ml-2 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Pro</span>
                        )}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          /* İçerik yoksa */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: `${color}10` }}>
              <Sparkles className="w-9 h-9" style={{ color }} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">İçerik Yakında Eklenecek</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              Bu konu için video dersler, PDF notlar ve çözümlü sorular hazırlanıyor.
            </p>
          </div>
        )}

        {/* Soru Bankası kartı */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}12` }}>
              <FileQuestion className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Soru Bankası</p>
              <p className="text-sm text-slate-400">Bu konudan soru çöz</p>
            </div>
          </div>
          <a href="/ogrenci/soru-bankasi"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: color }}>
            Soruları Gör
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Ünite ilerleme özeti */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-1">{unit.title}</h3>
          <p className="text-sm text-slate-400 mb-3">
            {unit.completed_topics}/{unit.total_topics} konu tamamlandı
          </p>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${unit.progress_percent}%`, background: color }} />
          </div>
          <p className="text-sm font-bold mt-2" style={{ color }}>%{unit.progress_percent}</p>
        </div>

      </div>
    </div>
  );
}

// ─── Sol Menü: Konu satırı ────────────────────────────────────────────────────

function TopicMenuItem({ topic, color, isActive, onSelect, onStatusChange }: {
  topic: CurriculumTopic;
  color: string;
  isActive: boolean;
  onSelect: () => void;
  onStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [updating, setUpdating] = useState(false);
  const done = topic.status === "completed";

  const toggleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = done ? "not_started" : "completed";
    setUpdating(true);
    try { await api.updateCurriculumProgress(topic.id, next); onStatusChange(topic.id, next); }
    catch { /* silent */ } finally { setUpdating(false); }
  };

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
        isActive
          ? "text-white shadow-sm"
          : "hover:bg-slate-100 text-slate-600"
      }`}
      style={isActive ? { background: color } : {}}
    >
      {/* Tamamlama */}
      <button
        onClick={toggleDone} disabled={updating}
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          done
            ? isActive ? "border-white bg-white" : "border-emerald-500 bg-emerald-500"
            : isActive ? "border-white/60" : "border-slate-300"
        }`}
      >
        {updating
          ? <Loader2 className="w-2 h-2 animate-spin" style={{ color: isActive ? color : "white" }} />
          : done ? <CheckCircle className="w-2.5 h-2.5" style={{ color: isActive ? color : "white" }} /> : null
        }
      </button>

      {/* Başlık */}
      <span className={`flex-1 text-xs leading-snug ${done && !isActive ? "line-through opacity-50" : ""}`}>
        {topic.title}
      </span>
    </div>
  );
}

// ─── Sol Menü: Ünite satırı ───────────────────────────────────────────────────

function UnitMenuItem({ unit, color, activeTopicId, onTopicSelect, onTopicStatusChange, defaultOpen }: {
  unit: CurriculumUnit;
  color: string;
  activeTopicId: number | null;
  onTopicSelect: (t: CurriculumTopic) => void;
  onTopicStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0"
          style={{ background: color }}>
          {unit.sort_order}
        </div>
        <span className="flex-1 text-xs font-bold text-slate-700 leading-tight">{unit.title}</span>
        <span className="text-[10px] text-slate-400 shrink-0">{unit.completed_topics}/{unit.total_topics}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="ml-2 mt-0.5 mb-1 space-y-0.5 border-l-2 pl-2" style={{ borderColor: `${color}25` }}>
          {unit.topics.map(t => (
            <TopicMenuItem
              key={t.id} topic={t} color={color}
              isActive={activeTopicId === t.id}
              onSelect={() => onTopicSelect(t)}
              onStatusChange={onTopicStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sol Menü: Ders satırı ────────────────────────────────────────────────────

function SubjectMenuItem({ subject, units, loadingUnits, activeTopicId, onOpen, onTopicSelect, onTopicStatusChange }: {
  subject: CurriculumSubject;
  units: CurriculumUnit[];
  loadingUnits: boolean;
  activeTopicId: number | null;
  onOpen: () => void;
  onTopicSelect: (t: CurriculumTopic, u: CurriculumUnit, s: CurriculumSubject) => void;
  onTopicStatusChange: (id: number, s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [open, setOpen] = useState(false);
  const color = SUBJECT_COLORS[subject.name] ?? subject.color ?? "#6366f1";

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) onOpen();
  };

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Ders başlık */}
      <div
        onClick={handleToggle}
        className={`flex items-center gap-2.5 px-3 py-3 cursor-pointer select-none transition-colors ${
          open ? "bg-slate-50" : "hover:bg-slate-50/70"
        }`}
      >
        <div className="w-0.5 h-6 rounded-full shrink-0" style={{ background: open ? color : "transparent" }} />
        <span className="text-lg">{subject.icon}</span>
        <span className={`flex-1 text-sm leading-tight ${open ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
          {subject.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Üniteler */}
      {open && (
        <div className="px-2 pb-2 bg-slate-50/50 space-y-0.5">
          {loadingUnits ? (
            <div className="space-y-1.5 py-2">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-200 rounded-lg animate-pulse" />)}
            </div>
          ) : units.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 px-2 text-center">İçerik yakında eklenecek.</p>
          ) : units.map((unit, i) => (
            <UnitMenuItem
              key={unit.id} unit={unit} color={color}
              activeTopicId={activeTopicId}
              defaultOpen={i === 0}
              onTopicSelect={(t) => onTopicSelect(t, unit, subject)}
              onTopicStatusChange={onTopicStatusChange}
            />
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
  const [search, setSearch] = useState("");

  // Seçili konu
  const [activeTopic,   setActiveTopic]   = useState<CurriculumTopic | null>(null);
  const [activeUnit,    setActiveUnit]    = useState<CurriculumUnit | null>(null);
  const [activeSubject, setActiveSubject] = useState<CurriculumSubject | null>(null);

  const gradeStr = user?.grade != null ? String(user.grade) : undefined;
  const examStr  = user?.target_exam ?? user?.exam_goal ?? undefined;
  const hasGrade = !!gradeStr && gradeStr !== "null" && gradeStr !== "";
  const activeColor = SUBJECT_COLORS[activeSubject?.name ?? ""] ?? activeSubject?.color ?? "#6366f1";

  // Ders listesi
  const loadSubjects = useCallback(async () => {
    if (!user || !hasGrade) return;
    setLoadingList(true);
    try {
      const res = await api.getCurriculum(gradeStr, examStr);
      setSubjects(Array.isArray(res?.subjects) ? res.subjects : []);
    } catch { /* silent */ }
    finally { setLoadingList(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.grade, user?.target_exam, user?.exam_goal]);

  useEffect(() => { if (!authLoading) loadSubjects(); }, [authLoading, loadSubjects]);

  // Ders açılınca lazy yükle
  const loadUnits = useCallback(async (slug: string) => {
    if (unitsBySlug[slug]) return;
    setLoadingSlug(slug);
    try {
      const res = await api.getCurriculumSubject(slug);
      setUnitsBySlug(p => ({ ...p, [slug]: Array.isArray(res.units) ? res.units : [] }));
    } catch {
      setUnitsBySlug(p => ({ ...p, [slug]: [] }));
    } finally { setLoadingSlug(null); }
  }, [unitsBySlug]);

  // Konu tamamlama
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
    if (activeTopic?.id === topicId) setActiveTopic(p => p ? { ...p, status } : p);
  }, [activeTopic]);

  const handleTopicSelect = (t: CurriculumTopic, u: CurriculumUnit, s: CurriculumSubject) => {
    setActiveTopic(t);
    setActiveUnit(u);
    setActiveSubject(s);
  };

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
    <div className="flex h-screen overflow-hidden bg-white">

      {/* ═══════════════════════════════════════════════════════
          SOL: Accordion Menü
      ══════════════════════════════════════════════════════════ */}
      <div className="w-72 shrink-0 flex flex-col border-r border-slate-200 bg-white">

        {/* Menü başlığı */}
        <div className="px-4 py-4 border-b border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-800">Derslerim</h2>
            </div>
            <button onClick={() => router.push("/ogrenci/onboarding")}
              title="Müfredatı Değiştir"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Sınıf badge'leri */}
          <div className="flex gap-1.5 flex-wrap">
            {gradeStr && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {gradeStr === "mezun" ? "Mezun" : `${gradeStr}. Sınıf`}
              </span>
            )}
            {examStr && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {examStr}
              </span>
            )}
          </div>
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Ders ara..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-400 outline-none" />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Ders listesi */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-3 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="py-10 text-center px-4">
              <p className="text-xs text-slate-400">Ders bulunamadı.</p>
            </div>
          ) : filteredSubjects.map(subj => (
            <SubjectMenuItem
              key={subj.slug}
              subject={subj}
              units={unitsBySlug[subj.slug] ?? []}
              loadingUnits={loadingSlug === subj.slug}
              activeTopicId={activeTopic?.id ?? null}
              onOpen={() => loadUnits(subj.slug)}
              onTopicSelect={handleTopicSelect}
              onTopicStatusChange={(tid, s) => handleTopicStatusChange(subj.slug, tid, s)}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SAĞ: İçerik Alanı (Geniş Ekran)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {activeTopic && activeUnit && activeSubject ? (
          <ContentPanel
            topic={activeTopic}
            subject={activeSubject}
            unit={activeUnit}
            color={activeColor}
          />
        ) : (
          /* Henüz konu seçilmemiş */
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 bg-white border border-slate-200 shadow-sm">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Bir konu seçin</h2>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Sol menüden bir derse, ardından üniteye ve konuya tıklayın. İçerik burada açılacak.
            </p>
            {/* Hızlı başlangıç ipucu */}
            <div className="mt-8 flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm text-slate-500">
              <span className="text-xl">👈</span>
              Soldan ders → ünite → konu seçin
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
