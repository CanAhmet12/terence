"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  adminApi,
  type ExamTemplateAdminRow,
  type ExamTemplateQuestionRow,
  type Question,
} from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  ClipboardList,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";

const EXAM_TYPES = ["TYT", "AYT", "LGS", "Mini", "TYT-AYT", "KPSS"] as const;

export default function AdminDenemeSablonlariPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<ExamTemplateAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [questions, setQuestions] = useState<ExamTemplateQuestionRow[]>([]);
  const [jsonInput, setJsonInput] = useState("[]");
  const [savingJson, setSavingJson] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newExamType, setNewExamType] = useState<string>("TYT");
  const [newDuration, setNewDuration] = useState(135);
  const [newGrade, setNewGrade] = useState<string>("");
  const [qSearch, setQSearch] = useState("");
  const [qHits, setQHits] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getExamTemplates();
      setRows(data);
    } catch {
      setError("Şablonlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = async (id: number) => {
    setSelectedId(id);
    setDetailLoading(true);
    setError(null);
    try {
      const { questions: q } = await adminApi.getExamTemplateDetail(id);
      setQuestions(q);
      setJsonInput(
        JSON.stringify(
          q.map((r: ExamTemplateQuestionRow) => ({ question_id: r.question_id, section: r.section ?? undefined })),
          null,
          2
        )
      );
    } catch {
      setError("Detay yüklenemedi.");
      setQuestions([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError("Başlık zorunlu.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const row = await adminApi.createExamTemplate({
        title: newTitle.trim(),
        exam_type: newExamType,
        duration_minutes: newDuration,
        grade: newGrade ? Number(newGrade) : null,
        is_active: true,
      });
      setNewTitle("");
      await load();
      await loadDetail(row.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Oluşturulamadı");
    } finally {
      setCreating(false);
    }
  };

  const saveQuestions = async () => {
    if (!selectedId) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      setError("JSON geçersiz.");
      return;
    }
    if (!Array.isArray(parsed) || parsed.length < 1) {
      setError("En az bir soru gerekli.");
      return;
    }
    const out: Array<{ question_id: number; section?: string | null }> = [];
    for (const item of parsed) {
      if (typeof item === "number") {
        out.push({ question_id: item });
      } else if (item && typeof item === "object" && typeof (item as { question_id?: unknown }).question_id === "number") {
        const o = item as { question_id: number; section?: string | null };
        out.push({ question_id: o.question_id, section: o.section ?? null });
      } else {
        setError("Her öğe question_id veya tam sayı olmalı.");
        return;
      }
    }
    setSavingJson(true);
    setError(null);
    try {
      await adminApi.syncExamTemplateQuestions(selectedId, out);
      await loadDetail(selectedId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSavingJson(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Bu şablonu silmek istiyor musunuz?")) return;
    try {
      await adminApi.deleteExamTemplate(id);
      if (selectedId === id) {
        setSelectedId(null);
        setQuestions([]);
        setJsonInput("[]");
      }
      await load();
    } catch {
      setError("Silinemedi.");
    }
  };

  const toggleActive = async (r: ExamTemplateAdminRow) => {
    try {
      await adminApi.updateExamTemplate(r.id, { is_active: !r.is_active, published_at: !r.is_active ? new Date().toISOString() : null });
      await load();
      if (selectedId === r.id) await loadDetail(r.id);
    } catch {
      setError("Güncellenemedi.");
    }
  };

  useEffect(() => {
    if (!qSearch.trim() || qSearch.trim().length < 2) {
      setQHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setQLoading(true);
      try {
        const res = await adminApi.getAdminQuestions({ search: qSearch.trim() });
        setQHits(res.data ?? []);
      } catch {
        setQHits([]);
      } finally {
        setQLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [qSearch]);

  const appendQuestionId = (id: number) => {
    try {
      const cur = JSON.parse(jsonInput) as unknown[];
      const arr = Array.isArray(cur) ? cur : [];
      arr.push({ question_id: id });
      setJsonInput(JSON.stringify(arr, null, 2));
    } catch {
      setJsonInput(JSON.stringify([{ question_id: id }], null, 2));
    }
  };

  const selected = rows.find((r) => r.id === selectedId);

  return (
    <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10 overflow-x-hidden">
      <Link href="/admin/icerik-merkezi" className="inline-flex items-center gap-2 text-slate-600 hover:text-cyan-600 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        İçerik merkezine dön
      </Link>

      <div className="mb-8 flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-cyan-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Deneme şablonları</h1>
            <p className="text-slate-600 text-sm mt-1">
              Sabit soru seti ve sırası tanımlayın. Öğrenci panelinde &quot;Hazır denemeler&quot; olarak listelenir; çözüm sırası şablondaki gibidir.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <form onSubmit={createTemplate} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-600" />
              Yeni şablon
            </h2>
            <div>
              <label className="text-xs font-semibold text-slate-500">Başlık</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Örn: TYT Deneme 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Sınav türü</label>
                <select
                  value={newExamType}
                  onChange={(e) => setNewExamType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Süre (dk)</label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value) || 135)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Sınıf (boş = tümü)</label>
              <input
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="9–12 veya boş"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Oluştur
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Kayıtlar</h2>
              <button type="button" onClick={() => load()} className="p-2 rounded-lg hover:bg-slate-50 text-slate-500" aria-label="Yenile">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
              </div>
            ) : rows.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Henüz şablon yok. Yukarıdan oluşturun; ardından soru listesini JSON ile kaydedin.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {rows.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50/80">
                      <button
                        type="button"
                        onClick={() => loadDetail(r.id)}
                        className={`flex-1 text-left min-w-0 ${selectedId === r.id ? "text-cyan-700 font-semibold" : ""}`}
                      >
                        <span className="block truncate">{r.title}</span>
                        <span className="text-xs text-slate-500">
                          {r.exam_type} · {r.template_questions_count ?? 0} soru · {r.is_active ? "yayında" : "taslak"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(r)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 text-slate-600 shrink-0"
                      >
                        {r.is_active ? "Kapat" : "Aç"}
                      </button>
                      <button type="button" onClick={() => remove(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0" aria-label="Sil">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900">Soru sırası (JSON)</h2>
          {!selectedId ? (
            <p className="text-sm text-slate-500">Soldan bir şablon seçin.</p>
          ) : detailLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                <strong className="text-slate-800">{selected?.title}</strong> —{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">{selected?.slug}</code>
              </p>
              <p className="text-xs text-slate-500">
                Format: <code>[{`{"question_id": 1, "section": "Türkçe"}`}, …]</code> veya sadece ID listesi{" "}
                <code>[1,2,3]</code>
              </p>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={14}
                className="w-full font-mono text-xs rounded-xl border border-slate-200 p-3 bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => void saveQuestions()}
                disabled={savingJson}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {savingJson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Soru sırasını kaydet
              </button>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Soru ara (havuz)
                </h3>
                <input
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-2"
                  placeholder="Metin ara…"
                />
                {qLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mb-2" />}
                <ul className="space-y-1 max-h-40 overflow-y-auto text-xs">
                  {qHits.map((q) => (
                    <li key={q.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50">
                      <span className="truncate text-slate-700">
                        #{q.id} {q.subject ?? ""}{" "}
                        {q.question_text ? q.question_text.slice(0, 48) : ""}…
                      </span>
                      <button
                        type="button"
                        onClick={() => appendQuestionId(q.id)}
                        className="shrink-0 px-2 py-1 rounded-lg bg-cyan-50 text-cyan-800 font-semibold hover:bg-cyan-100"
                      >
                        +Ekle
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {questions.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Kayıtlı sıra</h3>
                  <ol className="text-xs text-slate-600 space-y-1 max-h-32 overflow-y-auto list-decimal pl-4">
                    {questions.map((q) => (
                      <li key={`${q.sort_order}-${q.question_id}`}>
                        #{q.question_id} {q.preview ?? ""}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
