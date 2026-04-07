"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Tag, Trash2, RefreshCw, Search, AlertCircle, CheckCircle, Copy, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, AdminCoupon } from "@/lib/api";

type Coupon = AdminCoupon;

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function timeLeft(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "Süresi doldu";
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Bugün sona erer";
  return `${days} gün kaldı`;
}

const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white text-sm";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

export default function AdminKuponPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 10,
    max_uses: "" as string | number,
    expires_at: "",
    applicable_plans: [] as string[],
  });

  const loadCoupons = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminCoupons();
      const resObj = res as Record<string, unknown>;
      setCoupons((Array.isArray(resObj.data) ? resObj.data : Array.isArray(res) ? res : []) as AdminCoupon[]);
    } catch (e) {
      setError((e as Error).message || "Kuponlar yüklenemedi.");
    }
    setLoading(false);
  }, [token, search]);

  useEffect(() => {
    const t = setTimeout(loadCoupons, 300);
    return () => clearTimeout(t);
  }, [loadCoupons]);

  const handleCreate = async () => {
    if (!form.code.trim()) { setSaveError("Kupon kodu zorunludur."); return; }
    if (form.discount_value <= 0) { setSaveError("İndirim değeri 0'dan büyük olmalıdır."); return; }
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.createAdminCoupon({
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        max_uses: form.max_uses ? Number(form.max_uses) : undefined,
        expires_at: form.expires_at || undefined,
      } as Parameters<typeof api.createAdminCoupon>[0]);
      setShowForm(false);
      setForm({ code: "", discount_type: "percent", discount_value: 10, max_uses: "", expires_at: "", applicable_plans: [] });
      loadCoupons();
    } catch (e) {
      setSaveError((e as Error).message || "Kupon oluşturulamadı.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kuponu silmek istediğinizden emin misiniz?") || !token) return;
    setDeletingId(id);
    try {
      await api.deleteAdminCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert((e as Error).message || "Silinemedi.");
    }
    setDeletingId(null);
  };

  const handleToggle = async (coupon: Coupon) => {
    if (!token) return;
    try {
      await api.updateAdminCoupon(coupon.id, { is_active: !coupon.is_active });
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
    } catch {}
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm((f) => ({ ...f, code }));
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm font-medium mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard'a Dön
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
                <Tag className="w-5 h-5 text-teal-600" />
              </div>
              Kupon Yönetimi
            </h1>
            <p className="text-slate-600 mt-1">Promosyon ve indirim kuponlarını oluştur, yönet</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadCoupons}
              disabled={loading}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Yeni Kupon
            </button>
          </div>
        </div>
      </div>

      {/* Arama */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="Kupon kodu ara..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
        />
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error} — Kupon API endpoint'i henüz hazır olmayabilir.
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : coupons.length === 0 && !error ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700 mb-1">Henüz kupon yok</h3>
          <p className="text-sm text-slate-500 mb-4">İlk kuponu oluşturmak için "Yeni Kupon" butonuna tıkla.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-colors"
          >
            Kupon Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => {
            const tl = timeLeft(c.expires_at);
            const isExpired = tl === "Süresi doldu";
            const usagePct = c.max_uses ? Math.round((c.used_count / c.max_uses) * 100) : null;
            return (
              <div key={c.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                !c.is_active || isExpired ? "opacity-60 border-slate-200" : "border-slate-200 hover:border-teal-200"
              }`}>
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button
                        onClick={() => handleCopy(c.code)}
                        className="flex items-center gap-1.5 font-mono font-bold text-teal-700 text-lg hover:text-teal-800 transition-colors group"
                        title="Kopyala"
                      >
                        {c.code}
                        {copied === c.code
                          ? <CheckCircle className="w-4 h-4 text-teal-600" />
                          : <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        }
                      </button>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        c.discount_type === "percent" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {c.discount_type === "percent" ? `%${c.discount_value} indirim` : `${c.discount_value}₺ indirim`}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        c.is_active && !isExpired ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {isExpired ? "Süresi Doldu" : c.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {c.max_uses && (
                        <span>{c.used_count}/{c.max_uses} kullanım
                          {usagePct !== null && <span className="ml-1 text-slate-400">(%{usagePct})</span>}
                        </span>
                      )}
                      {!c.max_uses && <span>{c.used_count} kullanım (sınırsız)</span>}
                      {tl && <span className={isExpired ? "text-red-500 font-medium" : "text-amber-600"}>{tl}</span>}
                      {c.applicable_plans?.length ? (
                        <span>Geçerli: {c.applicable_plans.join(", ")}</span>
                      ) : <span>Tüm paketlerde geçerli</span>}
                    </div>
                    {c.max_uses && usagePct !== null && (
                      <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[160px]">
                        <div
                          className={`h-full rounded-full ${usagePct > 80 ? "bg-red-400" : usagePct > 50 ? "bg-amber-400" : "bg-teal-400"}`}
                          style={{ width: `${Math.min(usagePct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(c)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                        c.is_active
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                      }`}
                    >
                      {c.is_active ? "Pasif Et" : "Aktif Et"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all disabled:opacity-50"
                      title="Sil"
                    >
                      {deletingId === c.id
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Yeni Kupon Formu Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-900">Yeni Kupon Oluştur</h3>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Kod */}
              <div>
                <label className={labelCls}>Kupon Kodu <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="YENIYIL20"
                    className={`${inputCls} flex-1 font-mono font-bold`}
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors shrink-0"
                  >
                    Rastgele
                  </button>
                </div>
              </div>

              {/* İndirim Tipi + Değer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>İndirim Tipi</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "percent" | "fixed" }))}
                    className={inputCls}
                  >
                    <option value="percent">Yüzde (%)</option>
                    <option value="fixed">Sabit (₺)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>
                    {form.discount_type === "percent" ? "İndirim Oranı (%)" : "İndirim Tutarı (₺)"}
                  </label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
                    min={1}
                    max={form.discount_type === "percent" ? 100 : undefined}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Maks. Kullanım + Son Tarih */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Maks. Kullanım (boş=sınırsız)</label>
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                    placeholder="100"
                    min={1}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Son Geçerlilik Tarihi</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                    className={inputCls}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Geçerli Paketler */}
              <div>
                <label className={labelCls}>Geçerli Paketler (boş=tümü)</label>
                <div className="flex gap-2 flex-wrap">
                  {["bronze", "plus", "pro"].map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        applicable_plans: f.applicable_plans.includes(plan)
                          ? f.applicable_plans.filter((p) => p !== plan)
                          : [...f.applicable_plans, plan],
                      }))}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                        form.applicable_plans.includes(plan)
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Oluşturuluyor...</> : <><Tag className="w-4 h-4" /> Kuponu Oluştur</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
