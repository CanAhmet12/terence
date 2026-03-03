"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Video, FileText, HelpCircle, Trash2, Search, RefreshCw, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, AdminContentItem } from "@/lib/api";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4 text-teal-600" />,
  pdf: <FileText className="w-4 h-4 text-amber-600" />,
  question: <HelpCircle className="w-4 h-4 text-blue-600" />,
  quiz: <BookOpen className="w-4 h-4 text-purple-600" />,
};

const TYPE_LABELS: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  question: "Soru",
  quiz: "Quiz",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminIcerikPage() {
  const { token } = useAuth();

  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadContent = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminContent(token, {
        search: search || undefined,
        type: typeFilter || undefined,
      });
      setItems(res.data);
    } catch {
      setError("İçerikler yüklenemedi. API endpoint'i henüz hazır olmayabilir.");
    } finally {
      setLoading(false);
    }
  }, [token, search, typeFilter]);

  useEffect(() => { loadContent(); }, [loadContent]);

  const handleDelete = async (item: AdminContentItem) => {
    if (!token) return;
    if (!confirm(`"${item.title}" içeriğini silmek istediğinizden emin misiniz?`)) return;
    setDeletingId(item.id);
    try {
      await api.deleteAdminContent(token, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      setError(`"${item.title}" silinemedi.`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Panele dön
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">İçerik Yönetimi</h1>
          <p className="text-slate-600 mt-1">Video, PDF, soru ve quiz içeriklerini yönetin</p>
        </div>
        <button
          onClick={loadContent}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium flex justify-between items-start">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-3 text-red-500 hover:text-red-700 font-semibold text-xs">Kapat</button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İçerik ara..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
        >
          <option value="">Tüm Türler</option>
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="question">Soru</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">İçerik bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-5 font-semibold text-slate-700">Tür</th>
                  <th className="text-left py-4 px-5 font-semibold text-slate-700">Başlık</th>
                  <th className="text-left py-4 px-5 font-semibold text-slate-700">Ders / Ünite</th>
                  <th className="text-left py-4 px-5 font-semibold text-slate-700">Boyut</th>
                  <th className="text-left py-4 px-5 font-semibold text-slate-700">Eklenme</th>
                  <th className="w-16 py-4 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <span className="flex items-center gap-2">
                        {TYPE_ICONS[item.type] ?? <BookOpen className="w-4 h-4 text-slate-400" />}
                        <span className="capitalize">{TYPE_LABELS[item.type] ?? item.type}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-900 max-w-[260px] truncate" title={item.title}>
                      {item.title}
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      {item.subject ?? "—"}
                      {item.unit ? <span className="text-slate-400 text-xs ml-1">/ {item.unit}</span> : null}
                    </td>
                    <td className="py-4 px-5 text-slate-500">{formatSize(item.size_bytes)}</td>
                    <td className="py-4 px-5 text-slate-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {deletingId === item.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        <button
                          onClick={() => handleDelete(item)}
                          aria-label={`${item.title} sil`}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
