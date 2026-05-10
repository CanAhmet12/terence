"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type QuestionBankDisplayRow, type QuestionBankDisplayInput } from "@/lib/api";
import { ArrowLeft, Loader2, Plus, Trash2, Pencil, Library } from "lucide-react";

const emptyForm: QuestionBankDisplayInput = {
  subject: "",
  grade: 0,
  badge_label: "",
  year_label: "",
  brand_label: "",
  title_override: "",
  footer_label: "",
  cta_label: "",
  cover_hex: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminSoruBankasiKitaplariPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<QuestionBankDisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<QuestionBankDisplayInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getQuestionBankDisplays();
      setRows(data);
    } catch {
      setError("Kayıtlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (r: QuestionBankDisplayRow) => {
    setEditingId(r.id);
    setForm({
      subject: r.subject,
      grade: r.grade,
      badge_label: r.badge_label ?? "",
      year_label: r.year_label ?? "",
      brand_label: r.brand_label ?? "",
      title_override: r.title_override ?? "",
      footer_label: r.footer_label ?? "",
      cta_label: r.cta_label ?? "",
      cover_hex: r.cover_hex ?? "",
      sort_order: r.sort_order ?? 0,
      is_active: r.is_active !== false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.subject.trim()) {
      setError("Ders adı zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        subject: form.subject.trim(),
        grade: Number(form.grade ?? 0),
        sort_order: Number(form.sort_order ?? 0),
        badge_label: form.badge_label || null,
        year_label: form.year_label || null,
        brand_label: form.brand_label || null,
        title_override: form.title_override || null,
        footer_label: form.footer_label || null,
        cta_label: form.cta_label || null,
        cover_hex: form.cover_hex?.trim() || null,
      };
      if (editingId) {
        await api.updateQuestionBankDisplay(editingId, payload);
      } else {
        await api.createQuestionBankDisplay(payload);
      }
      cancelEdit();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Bu kaydı silmek istiyor musunuz?")) return;
    try {
      await api.deleteQuestionBankDisplay(id);
      await load();
    } catch {
      setError("Silinemedi.");
    }
  };

  return (
    <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10 overflow-x-hidden">
      <Link href="/admin/icerik-merkezi" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        İçerik merkezine dön
      </Link>

      <div className="mb-8 flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 shrink-0">
            <Library className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Soru bankası — 3D kitap görünümü</h1>
            <p className="text-slate-600 mt-1 text-sm">
              Öğrenci soru bankasındaki ders kartlarının kapak metinleri ve isteğe bağlı düz renk buradan yönetilir.
              <strong className="font-semibold text-slate-800"> Ders adı</strong>, soru kayıtlarındaki <code className="text-xs bg-slate-100 px-1 rounded">subject</code> ile birebir eşleşmelidir.
              Sınıf <code className="text-xs bg-slate-100 px-1 rounded">0</code> tüm sınıflar için varsayılan kayıttır; belirli sınıf için ayrı satır açabilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            {editingId ? <Pencil className="w-4 h-4 text-teal-600" /> : <Plus className="w-4 h-4 text-teal-600" />}
            {editingId ? "Kayıt düzenle" : "Yeni kayıt"}
          </h2>
          <div>
            <label className="text-xs font-bold text-slate-700">Ders (subject)</label>
            <input required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Matematik" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Sınıf (0=tümü)</label>
              <input type="number" min={0} max={12} value={form.grade ?? 0} onChange={(e) => setForm((f) => ({ ...f, grade: Number(e.target.value) }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Sıra</label>
              <input type="number" min={0} value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          {[
            ["badge_label", "Üst rozet"],
            ["year_label", "Yıl"],
            ["brand_label", "Marka satırı"],
            ["title_override", "Kapak başlığı (boş=ders adı)"],
            ["footer_label", "Alt sol metin"],
            ["cta_label", "Buton metni"],
            ["cover_hex", "Kapak rengi (#RRGGBB)"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-bold text-slate-700">{label}</label>
              <input
                value={(() => {
                  const k = key as keyof QuestionBankDisplayInput
                  const v = form[k]
                  if (v == null) return ""
                  return typeof v === "string" ? v : String(v)
                })()}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Aktif
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? "Güncelle" : "Ekle"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">
                İptal
              </button>
            )}
          </div>
        </form>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-800 text-sm">Kayıtlar</div>
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Henüz kayıt yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
              {rows.map((r) => (
                <li key={r.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{r.subject} <span className="text-slate-400 font-normal text-xs">· sınıf {r.grade}</span></p>
                    <p className="text-xs text-slate-500 truncate mt-1">{r.title_override || "—"} · {r.badge_label || "—"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => startEdit(r)} className="p-2 rounded-lg text-teal-600 hover:bg-teal-50" aria-label="Düzenle">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => remove(r.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" aria-label="Sil">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
