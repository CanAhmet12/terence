"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Notification } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Bell, ArrowLeft, Clock, FileCheck, AlertTriangle, Check, CheckCheck,
  RefreshCw, Trash2, BookOpen, MessageSquare, Trophy, Info, Filter
} from "lucide-react";

function getBackLink(role: string | undefined) {
  if (role === "student") return "/ogrenci";
  if (role === "teacher") return "/ogretmen";
  if (role === "parent") return "/veli";
  if (role === "admin") return "/admin";
  return "/";
}

type NotifCategory = "all" | "study" | "exam" | "risk" | "message" | "badge" | "other";

interface NotifConfig {
  icon: React.ElementType;
  bg: string;
  border: string;
  iconColor: string;
  label: string;
  category: NotifCategory;
}

function getNotifConfig(type: string): NotifConfig {
  if (["study", "calisma", "daily_reminder", "plan"].includes(type)) {
    return { icon: Clock, bg: "bg-teal-50", border: "border-teal-100", iconColor: "text-teal-600", label: "Çalışma", category: "study" };
  }
  if (["exam", "deneme", "sinav"].includes(type)) {
    return { icon: FileCheck, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-600", label: "Deneme", category: "exam" };
  }
  if (["risk", "hedef", "risk_alert", "goal"].includes(type)) {
    return { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-100", iconColor: "text-red-600", label: "Hedef Risk", category: "risk" };
  }
  if (["message", "mesaj", "chat"].includes(type)) {
    return { icon: MessageSquare, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-600", label: "Mesaj", category: "message" };
  }
  if (["badge", "rozet", "achievement"].includes(type)) {
    return { icon: Trophy, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-600", label: "Rozet", category: "badge" };
  }
  if (["lesson", "ders", "content"].includes(type)) {
    return { icon: BookOpen, bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-600", label: "Ders", category: "study" };
  }
  return { icon: Info, bg: "bg-slate-50", border: "border-slate-100", iconColor: "text-slate-500", label: "Genel", category: "other" };
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

const CATEGORY_TABS: { key: NotifCategory; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "Tümü", icon: Bell },
  { key: "study", label: "Çalışma", icon: Clock },
  { key: "exam", label: "Deneme", icon: FileCheck },
  { key: "risk", label: "Hedef Risk", icon: AlertTriangle },
  { key: "message", label: "Mesaj", icon: MessageSquare },
  { key: "badge", label: "Rozet", icon: Trophy },
];

export default function BildirimlerPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<NotifCategory>("all");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.getNotifications(token, { per_page: 100 });
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!user) { router.replace("/giris"); return; }
    loadNotifications();
  }, [user, router, loadNotifications]);

  const handleMarkRead = async (notif: Notification) => {
    if (notif.is_read) return;
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
    if (!token) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await api.markAllNotificationsRead(token);
    } catch {
      await loadNotifications();
    }
    setMarkingAll(false);
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeleting(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.deleteNotification(token, id);
    } catch {
      await loadNotifications();
    }
    setDeleting(null);
  };

  if (!user) return null;

  // Filtreleme
  const filtered = notifications.filter((n) => {
    const config = getNotifConfig(n.type);
    if (activeTab !== "all" && config.category !== activeTab) return false;
    if (filter === "unread" && n.is_read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Kategoriye göre sayılar
  const countByCategory = (cat: NotifCategory) =>
    cat === "all"
      ? notifications.length
      : notifications.filter((n) => getNotifConfig(n.type).category === cat).length;

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

          {/* Başlık */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-teal-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                Bildirimler
              </h1>
              <p className="text-slate-500 mt-2 text-sm">Çalışma hatırlatmaları, deneme uyarıları, hedef risk bildirimleri</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button
                onClick={loadNotifications}
                disabled={loading}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors"
                >
                  {markingAll ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Tümünü Oku</span>
                </button>
              )}
            </div>
          </div>

          {/* Sekme Filtreleri */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
            {CATEGORY_TABS.map((tab) => {
              const count = countByCategory(tab.key);
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-600"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Okundu/Okunmadı filtresi */}
          <div className="flex items-center gap-2 mb-5">
            <Filter className="w-4 h-4 text-slate-400" />
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {f === "all" ? "Tümü" : `Okunmamış (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* Liste */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-700 mb-1">Bildirim bulunamadı</h3>
              <p className="text-sm text-slate-500">
                {filter === "unread" ? "Tüm bildirimler okunmuş." : "Bu kategoride bildirim yok."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((n) => {
                const config = getNotifConfig(n.type);
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n)}
                    className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      n.is_read
                        ? "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                        : `bg-white border-l-4 shadow-sm ${
                            config.category === "risk"
                              ? "border-l-red-400 border-red-200/60"
                              : config.category === "badge"
                              ? "border-l-purple-400 border-purple-200/60"
                              : "border-l-teal-400 border-teal-200/60"
                          }`
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wide ${config.iconColor}`}>
                            {config.label}
                          </span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                          )}
                        </div>
                        <p className={`font-bold text-slate-900 ${n.is_read ? "font-semibold text-slate-700" : ""}`}>
                          {n.title}
                        </p>
                        <p className="text-slate-600 mt-0.5 leading-relaxed text-sm">{n.body}</p>
                        <p className="text-xs text-slate-400 mt-2 font-medium">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n); }}
                            className="w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-100 flex items-center justify-center transition-colors"
                            title="Okundu"
                          >
                            <Check className="w-3.5 h-3.5 text-teal-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                          disabled={deleting === n.id}
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Sil"
                        >
                          {deleting === n.id
                            ? <RefreshCw className="w-3.5 h-3.5 text-red-400 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          }
                        </button>
                      </div>
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
