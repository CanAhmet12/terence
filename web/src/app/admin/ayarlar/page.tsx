"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Shield, Key, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, AuditLog } from "@/lib/api";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.terenceegitim.com";

export default function AdminAyarlarPage() {
  const { token } = useAuth();

  const [lang, setLang] = useState("tr");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const res = await api.getAdminAuditLogs(token, { per_page: 10 });
      setLogs(res.data);
    } catch {
      // Loglar yüklenemedi — sessizce geç
    } finally {
      setLogsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.updateAdminSettings(token, { language: lang, maintenance_mode: maintenanceMode });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Ayarlar kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-8 lg:p-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Panele dön
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Sistem Ayarları</h1>
      <p className="text-slate-600 mb-8">Dil, bakım modu, API bilgisi ve güvenlik logları</p>

      <div className="space-y-6 max-w-2xl">
        {/* Dil seçenekleri */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-teal-600" />
            Dil Seçenekleri
          </h2>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Bakım modu */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-teal-600" />
            Bakım Modu
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={maintenanceMode}
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${maintenanceMode ? "bg-red-500" : "bg-slate-200"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${maintenanceMode ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {maintenanceMode ? "Bakım modu aktif — Site kullanıcılara kapalı" : "Site normal çalışıyor"}
            </span>
          </label>
        </div>

        {/* API bilgisi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-teal-600" />
            API Bilgisi
          </h2>
          <div className="p-4 bg-slate-50 rounded-xl font-mono text-sm break-all text-slate-700">
            {API_URL}
          </div>
        </div>

        {/* Kaydet butonu */}
        {saveError && (
          <div role="alert" className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Ayarlar başarıyla kaydedildi.
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </button>

        {/* Güvenlik logları */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Güvenlik Logları
            </h2>
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="text-slate-400 hover:text-teal-600 transition-colors"
              aria-label="Logları yenile"
            >
              <RefreshCw className={`w-4 h-4 ${logsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-4">Kim giriş yaptı, hangi işlemler yapıldı</p>
          {logsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Henüz log kaydı yok.</p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0">
                  <span className="text-slate-700">
                    <span className="font-medium">{log.user?.email ?? `Kullanıcı #${log.user_id}`}</span>
                    <span className="text-slate-400 mx-1">—</span>
                    {log.action}
                    {log.description && <span className="text-slate-400 text-xs ml-1">({log.description})</span>}
                  </span>
                  <span className="text-slate-400 shrink-0 ml-4">{formatLogDate(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
