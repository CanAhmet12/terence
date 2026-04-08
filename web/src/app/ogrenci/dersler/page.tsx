"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Course } from "@/lib/api";
import {
  BookOpen, Search, Lock, AlertCircle, RefreshCw,
  ChevronRight, Play, FileText, BarChart3, Clock,
  Layers, Sparkles, ArrowRight, Crown
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

// Sınav türü renk paleti
const EXAM_COLORS: Record<string, { bg: string; text: string; border: string; badge: string; dot: string }> = {
  TYT:   { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200",  badge: "bg-indigo-100 text-indigo-700",  dot: "bg-indigo-500"  },
  AYT:   { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  badge: "bg-violet-100 text-violet-700",  dot: "bg-violet-500"  },
  LGS:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  KPSS:  { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-500"   },
  Genel: { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200",    badge: "bg-teal-100 text-teal-700",    dot: "bg-teal-500"    },
};

// Ders kapak renkleri (thumbnail yoksa)
const COVER_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-teal-500 to-emerald-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-purple-500 to-indigo-600",
];

// Ders ikonu
const SUBJECT_ICONS: Record<string, string> = {
  "Matematik":      "📐",
  "Türkçe":         "📖",
  "Fizik":          "⚡",
  "Kimya":          "🧪",
  "Biyoloji":       "🌿",
  "Tarih":          "🏛️",
  "Coğrafya":       "🌍",
  "Fen Bilimleri":  "🔬",
  "İngilizce":      "🌐",
};

// Kurs kartı bileşeni
function CourseCard({ course, index, isPro }: {
  course: Course;
  index: number;
  isPro: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const locked = !course.is_free && !isPro;
  const progress = course.completion_percentage ?? course.progress_percent ?? 0;
  const examColors = EXAM_COLORS[course.exam_type ?? "Genel"] ?? EXAM_COLORS.Genel;
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length];
  const icon = SUBJECT_ICONS[course.subject ?? ""] ?? "📚";

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${
        locked
          ? "border-slate-200 opacity-80"
          : `border-slate-200 ${hovered ? "shadow-xl shadow-slate-200/60 -translate-y-1 border-slate-300" : "shadow-sm hover:border-slate-300"}`
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Kilit overlay */}
      {locked && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Pro Paket Gerekli</p>
          <Link
            href="/paketler"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Crown className="w-3 h-3" />
            Yükselt
          </Link>
        </div>
      )}

      {/* Thumbnail / Kapak */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {course.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-2" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}>
                {icon}
              </div>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Sınav türü badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${examColors.badge} backdrop-blur-sm`}>
            {course.exam_type ?? "Genel"}
          </span>
        </div>

        {/* Ücretsiz badge */}
        {course.is_free && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700 backdrop-blur-sm">
              Ücretsiz
            </span>
          </div>
        )}

        {/* Play overlay (hover'da) */}
        {!locked && hovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all">
            <div className="w-12 h-12 rounded-full bg-white/90 shadow-xl flex items-center justify-center">
              <Play className="w-5 h-5 text-slate-800 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        {/* İlerleme çubuğu (altta) */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Kart içeriği */}
      <div className="p-5 bg-white">
        <h3 className="font-bold text-slate-900 text-base leading-tight mb-1 line-clamp-2">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Meta bilgiler */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
          {course.units_count !== undefined && (
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {course.units_count} ünite
            </span>
          )}
          {course.subject && (
            <span className={`flex items-center gap-1 ${examColors.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${examColors.dot}`} />
              {course.subject}
            </span>
          )}
        </div>

        {/* İlerleme */}
        {progress > 0 ? (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>İlerleme</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 h-2 bg-slate-100 rounded-full" />
        )}

        {/* CTA */}
        {!locked && (
          <Link
            href={`/ogrenci/dersler/${course.slug}`}
            className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
              progress > 0
                ? `bg-gradient-to-r ${gradient} text-white shadow-sm hover:opacity-90`
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {progress > 0 ? (
              <><Play className="w-4 h-4" fill="white" /> Devam Et</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Başla</>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function OgrenciDerslerPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("");

  const isPro = !(!user?.subscription_plan || user.subscription_plan === "free");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCourses();
      setCourses(Array.isArray(res) ? res as Course[] : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dersler yüklenemedi.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  // Filtreleme
  const filtered = courses.filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.subject ?? "").toLowerCase().includes(search.toLowerCase());
    const matchExam = !examFilter || c.exam_type === examFilter;
    return matchSearch && matchExam;
  });

  const examTypes = [...new Set(courses.map((c) => c.exam_type).filter(Boolean))] as string[];

  // Devam eden ders (ilerleme > 0)
  const inProgressCourse = courses.find((c) => (c.completion_percentage ?? c.progress_percent ?? 0) > 0 && (c.completion_percentage ?? c.progress_percent ?? 0) < 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Başlık ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Derslerim</h1>
            <p className="text-slate-500 mt-1 font-medium">Konu anlatım videoları, PDF notlar, kazanım bazlı ilerleme</p>
          </div>
          <button
            onClick={loadCourses}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Devam eden ders hero ── */}
        {!loading && inProgressCourse && (
          <Link
            href={`/ogrenci/dersler/${inProgressCourse.slug}`}
            className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${COVER_GRADIENTS[courses.indexOf(inProgressCourse) % COVER_GRADIENTS.length]} flex items-center justify-center text-3xl shrink-0 shadow-md`}>
              {SUBJECT_ICONS[inProgressCourse.subject ?? ""] ?? "📚"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Kaldığın Yerden Devam Et</p>
              <h3 className="font-bold text-slate-900 text-base truncate">{inProgressCourse.title}</h3>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    style={{ width: `${inProgressCourse.completion_percentage ?? inProgressCourse.progress_percent ?? 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  %{Math.round(inProgressCourse.completion_percentage ?? inProgressCourse.progress_percent ?? 0)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors shrink-0">
              <Play className="w-5 h-5 text-indigo-600 ml-0.5" fill="currentColor" />
            </div>
          </Link>
        )}

        {/* ── Filtreler ── */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ders veya konu ara..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setExamFilter("")}
              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                !examFilter
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tümü
            </button>
            {examTypes.map((type) => {
              const ec = EXAM_COLORS[type] ?? EXAM_COLORS.Genel;
              return (
                <button
                  key={type}
                  onClick={() => setExamFilter(examFilter === type ? "" : type)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    examFilter === type
                      ? `${ec.bg} ${ec.text} border-2 ${ec.border}`
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Hata ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
            <button onClick={loadCourses} className="ml-auto font-semibold hover:underline flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Yenile
            </button>
          </div>
        )}

        {/* ── Kurs Grid ── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 overflow-hidden">
                <Skeleton className="h-36 rounded-none" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full mt-3" />
                  <Skeleton className="h-10 w-full mt-2 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 text-lg">
              {search || examFilter ? "Sonuç bulunamadı" : "Henüz ders eklenmemiş"}
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              {search || examFilter
                ? "Farklı arama kriterleri deneyin"
                : "Dersler yakında eklenecek"
              }
            </p>
            {(search || examFilter) && (
              <button
                onClick={() => { setSearch(""); setExamFilter(""); }}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} isPro={isPro} />
            ))}
          </div>
        )}

        {/* ── Pro Upsell (ücretsiz kullanıcılar) ── */}
        {!loading && !isPro && courses.some((c) => !c.is_free) && (
          <div className="flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-lg">Tüm derslere erişmek ister misin?</p>
              <p className="text-white/80 text-sm mt-0.5">
                Pro pakete geçerek {courses.filter((c) => !c.is_free).length} kilitli dersin kilidini aç, sınırsız soru bankası ve AI koçunu kullan.
              </p>
            </div>
            <Link
              href="/paketler"
              className="shrink-0 flex items-center gap-1.5 px-5 py-3 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
            >
              Paketleri Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
