"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { parentApi, type ChildSummary, type ExamSession } from "@/lib/api";
import { ClipboardList, Loader2, RefreshCw } from "lucide-react";

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
}

export default function VeliDenemelerPage() {
  const { token } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [childId, setChildId] = useState<number | "">("");
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    if (!token) return;
    try {
      const list = await parentApi.getChildren();
      setChildren(Array.isArray(list) ? list : []);
    } catch {
      setChildren([]);
    }
  }, [token]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (children.length > 0 && childId === "") {
      setChildId(children[0].child.id);
    }
  }, [children, childId]);

  const loadExams = useCallback(async () => {
    if (!token || !childId) {
      setExams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await parentApi.getChildExams(Number(childId));
      setExams(Array.isArray(data) ? data : []);
    } catch {
      setExams([]);
    }
    setLoading(false);
  }, [token, childId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  return (
    <div className="min-h-full min-w-0 overflow-x-hidden bg-slate-50 px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Denemeler</h1>
        <p className="mb-8 text-slate-600">
          Bağlı çocuğunuzun tamamladığı denemeleri salt okunur olarak görüntüleyin.
        </p>

        {!token ? (
          <p className="text-slate-600">Giriş yapmanız gerekir.</p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-xs font-bold text-slate-700">Çocuk</label>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {children.length === 0 ? (
                    <option value="">Bağlı öğrenci yok</option>
                  ) : (
                    children.map((c) => (
                      <option key={c.child.id} value={c.child.id}>
                        {c.child.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                type="button"
                onClick={loadExams}
                disabled={loading || !childId}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                <ClipboardList className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-bold text-slate-800">Tamamlanan denemeler</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : exams.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-slate-500">Henüz kayıtlı deneme yok.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3">Deneme</th>
                        <th className="px-4 py-3 hidden sm:table-cell">Tarih</th>
                        <th className="px-4 py-3 text-right">Net</th>
                        <th className="px-4 py-3 text-right hidden md:table-cell">D/Y/B</th>
                        <th className="px-4 py-3 text-right hidden lg:table-cell">Süre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {exams.map((e) => {
                        const d = e.correct_count ?? 0;
                        const y = e.wrong_count ?? 0;
                        const b = e.empty_count ?? 0;
                        return (
                          <tr key={e.id} className="hover:bg-slate-50/80">
                            <td className="px-5 py-3 font-semibold text-slate-800">
                              {e.title ?? `${e.exam_type ?? "TYT"} denemesi`}
                            </td>
                            <td className="px-4 py-3 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                              {fmt(e.finished_at)}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-cyan-700">
                              {Number(e.net_score ?? 0).toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-600 hidden md:table-cell whitespace-nowrap">
                              {d} / {y} / {b}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500 text-xs hidden lg:table-cell whitespace-nowrap">
                              {e.time_spent_seconds != null ? `${Math.round(e.time_spent_seconds / 60)} dk` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
