"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Question } from "@/lib/api";
import { ArrowLeft, Search, Plus, RefreshCw, Trash2, AlertCircle, Loader2, BookOpen } from "lucide-react";

const DIFFICULTY_LABELS: Record<string, { label: string; cls: string }> = {
  easy: { label: "Kolay", cls: "bg-green-100 text-green-700" },
  medium: { label: "Orta", cls: "bg-amber-100 text-amber-700" },
  hard: { label: "Zor", cls: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
  classic: "Klasik",
  new_gen: "Yeni Nesil",
  paragraph: "Paragraf",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function AdminSorularPage() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounce arama
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadQuestions = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getQuestions(token, {
        q: debouncedSearch || undefined,
        difficulty: difficulty || undefined,
        per_page: 20,
        page,
      });
      setQuestions(res.data);
      setTotal(res.meta.total);
      setCurrentPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sorular yüklenemedi.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, difficulty]);

  useEffect(() => { loadQuestions(1); }, [loadQuestions]);

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Bu soruyu silmek istediğine emin misin?")) return;
    setDeletingId(id);
    try {
      await api.deleteAdminQuestion(token, id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Soru silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Panele dön
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Soru Havuzu</h1>
          <p className="text-slate-600 mt-1">
            {total > 0 ? `${total} soru · ` : ""}Konu, zorluk ve tür bazlı soru yönetimi
          </p>
        </div>
        <Link
          href="/admin/sorular/yeni"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Soru Ekle
        </Link>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kazanım kodu veya soru ara..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
        >
          <option value="">Tüm Zorluklar</option>
          <option value="easy">Kolay</option>
          <option value="medium">Orta</option>
          <option value="hard">Zor</option>
        </select>
      </div>

      {/* Hata */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => loadQuestions(currentPage)}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
        </div>
      )}

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">Soru bulunamadı</p>
            <p className="text-sm text-slate-500 mt-1">Farklı filtre dene veya yeni soru ekle.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-4 font-semibold text-slate-700">Kazanım</th>
                    <th className="text-left p-4 font-semibold text-slate-700 hidden md:table-cell">Ders</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Zorluk</th>
                    <th className="text-left p-4 font-semibold text-slate-700 hidden lg:table-cell">Tip</th>
                    <th className="text-left p-4 font-semibold text-slate-700 hidden xl:table-cell">Soru (önizleme)</th>
                    <th className="text-right p-4 font-semibold text-slate-700">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions.map((q) => {
                    const diff = DIFFICULTY_LABELS[q.difficulty ?? "medium"] ?? DIFFICULTY_LABELS.medium;
                    const typeLabel = TYPE_LABELS[q.type ?? "classic"] ?? q.type ?? "—";
                    return (
                      <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          {q.kazanim_code ? (
                            <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                              {q.kazanim_code}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-700 hidden md:table-cell">{q.subject ?? "—"}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${diff.cls}`}>
                            {diff.label}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 hidden lg:table-cell">{typeLabel}</td>
                        <td className="p-4 max-w-xs hidden xl:table-cell">
                          <p className="text-slate-700 text-xs truncate">{q.question_text}</p>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDelete(q.id)}
                            disabled={deletingId === q.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deletingId === q.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                            Sil
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            {lastPage > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-500">{total} soru · Sayfa {currentPage}/{lastPage}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadQuestions(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    ← Önceki
                  </button>
                  <button
                    onClick={() => loadQuestions(currentPage + 1)}
                    disabled={currentPage >= lastPage || loading}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Sonraki →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
