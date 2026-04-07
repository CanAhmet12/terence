"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Course } from "@/lib/api";
import { ChevronRight, BookOpen, Search, Lock, AlertCircle, RefreshCw } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-2xl animate-pulse ${className ?? ""}`} />;
}

const EXAM_COLORS: Record<string, string> = {
  TYT: "bg-teal-100 text-teal-700",
  AYT: "bg-indigo-100 text-indigo-700",
  LGS: "bg-amber-100 text-amber-700",
  KPSS: "bg-purple-100 text-purple-700",
};

export default function OgrenciDerslerPage() {
  const { token, user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("");

  const loadCourses = useCallback(async () => {
    if (!token) { setLoading(false); return; }
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
  }, [token]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const isPro = user?.subscription_plan && user.subscription_plan !== "free";

  const filtered = courses.filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchExam = !examFilter || c.exam_type === examFilter;
    return matchSearch && matchExam;
  });

  const examTypes = [...new Set(courses.map((c) => c.exam_type).filter(Boolean))];

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Derslerim</h1>
        <p className="text-slate-600 mt-1">
          Konu anlatım videoları, PDF notlar, kazanım bazlı ilerleme takibi
        </p>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ders ara..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setExamFilter("")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !examFilter ? "bg-teal-600 text-white shadow-sm" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Tümü
          </button>
          {examTypes.map((type) => (
            <button
              key={type}
              onClick={() => setExamFilter(examFilter === type ? "" : type!)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                examFilter === type ? "bg-teal-600 text-white shadow-sm" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Hata durumu */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={loadCourses}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
        </div>
      )}

      {/* Ders listesi */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">
            {search || examFilter ? "Arama kriterine uyan ders bulunamadı" : "Henüz ders eklenmemiş"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {search || examFilter ? "Filtreleri temizlemeyi dene." : "Dersler yakında eklenecek."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const locked = !course.is_free && !isPro;
            const progress = course.progress_percent ?? 0;
            return (
              <div key={course.id} className="relative group">
                {locked && (
                  <div className="absolute inset-0 bg-white/80 rounded-2xl z-10 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">Pro paket gerekli</p>
                    <Link
                      href="/paketler"
                      className="text-xs font-bold text-teal-600 hover:underline"
                    >
                      Paketi Yükselt →
                    </Link>
                  </div>
                )}
                <Link
                  href={locked ? "#" : `/ogrenci/dersler/${course.slug}`}
                  onClick={(e) => locked && e.preventDefault()}
                  className={`block bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                    locked
                      ? "border-slate-200 opacity-60"
                      : "border-slate-200 hover:shadow-md hover:border-teal-200 group-hover:border-teal-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-teal-600" />
                    </div>
                    {course.exam_type && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${EXAM_COLORS[course.exam_type] ?? "bg-slate-100 text-slate-600"}`}>
                        {course.exam_type}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {course.units_count ?? "—"} ünite
                  </p>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">%{progress} tamamlandı</p>
                    {!locked && (
                      <span className="flex items-center text-teal-600 font-medium text-sm">
                        {progress > 0 ? "Devam et" : "Başla"}
                        <ChevronRight className="w-4 h-4 ml-0.5" />
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Kilitli içerik uyarısı */}
      {!loading && !isPro && courses.some((c) => !c.is_free) && (
        <div className="mt-8 p-5 rounded-2xl bg-teal-50 border border-teal-200">
          <p className="font-semibold text-teal-900">Tüm derslere erişmek ister misin?</p>
          <p className="text-sm text-teal-700 mt-1">
            Bronze veya üstü bir pakete geçerek kilitli tüm derslerin kilidini açabilirsin.
          </p>
          <Link
            href="/paketler"
            className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-teal-700 hover:underline"
          >
            Paketleri İncele →
          </Link>
        </div>
      )}
    </div>
  );
}
