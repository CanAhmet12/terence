"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, ParentNotificationSettings } from "@/lib/api";
import {
  ArrowLeft, Mail, MessageSquare, Bell, Smartphone,
  CheckCircle, Loader2, AlertCircle, Settings
} from "lucide-react";

const DEMO_SETTINGS: ParentNotificationSettings = {
  sms_enabled: true,
  email_enabled: true,
  push_enabled: false,
  inactivity_alert: true,
  inactivity_days: 3,
  risk_alert: true,
  exam_results: true,
  live_lesson_reminder: true,
  homework_reminder: true,
  phone: "+90 5XX XXX XX XX",
  email: "veli@ornek.com",
};

function Toggle({
  checked, onChange, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-teal-600" : "bg-slate-200"
      } disabled:opacity-50`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function VeliBildirimPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [settings, setSettings] = useState<ParentNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const loadSettings = useCallback(async () => {
    if (isDemo || !token) {
      setSettings(DEMO_SETTINGS);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getParentNotificationSettings(token);
      setSettings(res);
    } catch {
      setSettings(DEMO_SETTINGS);
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setErr("");
    setSaved(false);
    if (!isDemo && token) {
      try {
        const updated = await api.updateParentNotificationSettings(token, settings);
        setSettings(updated);
      } catch (e) {
        setErr((e as Error).message || "Kaydedilemedi.");
        setSaving(false);
        return;
      }
    } else {
      await new Promise((r) => setTimeout(r, 600));
    }
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = <K extends keyof ParentNotificationSettings>(key: K, value: ParentNotificationSettings[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const NOTIFICATION_ROWS = [
    {
      key: "inactivity_alert" as const,
      label: "Çalışmama Uyarısı",
      desc: `Çocuğunuz ${settings?.inactivity_days ?? 3} gün çalışmadığında bildirim gönder`,
    },
    {
      key: "risk_alert" as const,
      label: "Hedef Risk Uyarısı",
      desc: "Hedef bölüme ulaşma riski olduğunda bildirim gönder",
    },
    {
      key: "exam_results" as const,
      label: "Deneme Sonuçları",
      desc: "Çocuğunuz deneme bitirdiğinde sonuçları paylaş",
    },
    {
      key: "live_lesson_reminder" as const,
      label: "Canlı Ders Hatırlatması",
      desc: "Canlı ders başlamadan 15 dakika önce hatırlat",
    },
    {
      key: "homework_reminder" as const,
      label: "Ödev Teslim Tarihi",
      desc: "Ödev bitiş tarihinden 24 saat önce hatırlat",
    },
  ];

  return (
    <div className="p-8 lg:p-12 max-w-3xl">
      <Link href="/veli" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Panele dön
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Bildirim Ayarları</h1>
        <p className="text-slate-600">SMS ve e-posta ile çocuğunuzun gelişimini takip edin.</p>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Demo Modu
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : settings ? (
        <div className="space-y-6">
          {/* Kanal seçimi */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-600" />
              Bildirim Kanalları
            </h2>
            <div className="space-y-4">
              {[
                {
                  key: "sms_enabled" as const,
                  icon: MessageSquare,
                  label: "SMS",
                  detail: settings.phone ?? "Telefon numarası ayarlı değil",
                  color: "text-green-600 bg-green-50",
                },
                {
                  key: "email_enabled" as const,
                  icon: Mail,
                  label: "E-posta",
                  detail: settings.email ?? "E-posta adresi ayarlı değil",
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  key: "push_enabled" as const,
                  icon: Smartphone,
                  label: "Push Bildirim",
                  detail: "Tarayıcı ve mobil uygulama bildirimleri",
                  color: "text-purple-600 bg-purple-50",
                },
              ].map(({ key, icon: Icon, label, detail, color }) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
                    </div>
                  </div>
                  <Toggle checked={settings[key] as boolean} onChange={(v) => update(key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Bildirim türleri */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" />
              Hangi Durumlarda Bildirim Alayım?
            </h2>
            <p className="text-sm text-slate-500 mb-5">Aktif kanallar üzerinden gönderilir.</p>

            <div className="space-y-1">
              {NOTIFICATION_ROWS.map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    {key === "inactivity_alert" && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500">Gün sayısı:</span>
                        <select
                          value={settings.inactivity_days}
                          onChange={(e) => update("inactivity_days", Number(e.target.value))}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-teal-500 outline-none"
                        >
                          {[1, 2, 3, 5, 7].map((d) => (
                            <option key={d} value={d}>{d} gün</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <Toggle
                    checked={settings[key] as boolean}
                    onChange={(v) => update(key, v)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mesaj */}
          {err && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {err}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Bildirim tercihlerin kaydedildi.
            </div>
          )}

          {/* Kaydet */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Kaydediliyor...</> : "Tercihleri Kaydet"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
