"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Notification } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Bell, ArrowLeft, Clock, FileCheck, AlertTriangle, Check, CheckCheck, RefreshCw } from "lucide-react";

function getBackLink(role: string | undefined) {
  if (role === "student") return "/ogrenci";
  if (role === "teacher") return "/ogretmen";
  if (role === "parent") return "/veli";
  if (role === "admin") return "/admin";
  return "/";
}

function getNotifConfig(type: string) {
  if (type === "study" || type === "calisma" || type === "daily_reminder") {
    return { icon: Clock, bg: "bg-teal-50", border: "border-teal-100", iconColor: "text-teal-600", label: "Çalışma" };
  }
  if (type === "exam" || type === "deneme") {
    return { icon: FileCheck, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-600", label: "Deneme" };
  }
  if (type === "risk" || type === "hedef" || type === "risk_alert") {
    return { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-100", iconColor: "text-red-600", label: "Hedef Risk" };
  }
  return { icon: Bell, bg: "bg-slate-50", border: "border-slate-100", iconColor: "text-slate-500", label: "Genel" };
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

// Demo bildirimleri
const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "calisma", title: "Çalışma Hatırlatması", body: "Bugün 2 saat çalışma hedefin var. 45 dk tamamladın, devam et!", is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, type: "calisma", title: "Günlük görevlerin bekliyor", body: "3 görev kaldı: M.8.1.1 tekrar, Fizik video, TYT deneme", is_read: false, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 3, type: "deneme", title: "Deneme Uyarısı", body: "Bu hafta TYT Deneme 2'yi çözmen gerekiyor. Son tarih: Cuma", is_read: false, created_at: new Date(Date.now() - 18000000).toISOString() },
  { id: 4, type: "hedef", title: "Hedef Risk Uyarısı", body: "Bu hızla devam edersen hedef bölüm risk altında. Pro pakete geçersen net artış ihtimalin %43 artar.", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 5, type: "deneme", title: "Deneme sonucun hazır", body: "TYT Deneme 1 — 42 net, Türkiye #12.500", is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
];

export default function BildirimlerPage() {
  const { user, token } = useAuth();
  const router = useRouter();


  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications(DEMO_NOTIFICATIONS);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getNotifications(token, { per_page: 50 });
      setNotifications(res.data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!user) { router.replace("/giris"); return; }
    loadNotifications();
  }, [user, router, loadNotifications]);

  const handleMarkRead = async (notif: Notification) => {
    if (notif.is_read) return;
    // Optimistik
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
    if (token) {
      try {
        await api.markNotificationRead(token, notif.id);
      } catch {
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: false } : n));
      }
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (token) {
      try {
        await api.markAllNotificationsRead(token);
      } catch {
        await loadNotifications();
      }
    }
    setMarkingAll(false);
  };

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-slate-50/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link
            href={getBackLink(user.role)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri dön
          </Link>

          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-teal-600" />
                </div>
                Bildirimler
              </h1>
              <p className="text-slate-600 mt-2">Çalışma hatırlatmaları, deneme uyarıları, hedef risk bildirimleri</p>
              {!loading && unreadCount > 0 && (
                <p className="mt-1.5 text-sm font-semibold text-teal-600">
                  {unreadCount} okunmamış bildirim
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                {markingAll ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-700 mb-1">Bildirim yok</h3>
              <p className="text-sm text-slate-500">Yeni bildirimler burada görünecek.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const config = getNotifConfig(n.type);
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 ${
                      n.is_read
                        ? "bg-white border-slate-200/80 hover:border-slate-300"
                        : `bg-white border-l-4 ${
                            n.type === "hedef" || n.type === "risk_alert"
                              ? "border-l-red-400 border-red-200/60 shadow-sm"
                              : "border-l-teal-400 border-teal-200/60 shadow-sm"
                          }`
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {config.label}
                          </span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                          )}
                        </div>
                        <p className="font-bold text-slate-900">{n.title}</p>
                        <p className="text-slate-600 mt-0.5 leading-relaxed text-sm">{n.body}</p>
                        <p className="text-xs text-slate-400 mt-2 font-medium">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkRead(n)}
                          className="w-9 h-9 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-100 flex items-center justify-center shrink-0 transition-colors"
                          title="Okundu olarak işaretle"
                        >
                          <Check className="w-4 h-4 text-teal-600" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}



