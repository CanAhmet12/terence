"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  LogOut, User, ChevronDown, Bell, LayoutDashboard,
  Target, Calendar, BookOpen, FileQuestion, Library,
  Video, BarChart3, Trophy, Zap, Bot, MessageSquare,
  Users, Upload, UserCircle, Settings, Home,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const PATH_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  "/ogrenci": { label: "Ana Panel", icon: LayoutDashboard },
  "/ogrenci/hedef": { label: "Hedef & Net", icon: Target },
  "/ogrenci/plan": { label: "Günlük Plan", icon: Calendar },
  "/ogrenci/dersler": { label: "Derslerim", icon: BookOpen },
  "/ogrenci/deneme": { label: "Denemeler", icon: FileQuestion },
  "/ogrenci/soru-bankasi": { label: "Soru Bankası", icon: Library },
  "/ogrenci/mini-test": { label: "Mini Test", icon: Zap },
  "/ogrenci/video": { label: "Video & PDF", icon: Video },
  "/ogrenci/zayif-kazanim": { label: "Zayıf Kazanım", icon: RefreshCw },
  "/ogrenci/rapor": { label: "Performans", icon: BarChart3 },
  "/ogrenci/rozet": { label: "Rozetler", icon: Trophy },
  "/ogrenci/koc": { label: "Dijital Koç", icon: Bot },
  "/ogrenci/forum": { label: "Forum", icon: MessageSquare },
  "/ogrenci/profil": { label: "Profil & Ayarlar", icon: UserCircle },
  "/ogretmen": { label: "Ana Panel", icon: LayoutDashboard },
  "/ogretmen/dersler": { label: "Derslerim", icon: BookOpen },
  "/ogretmen/icerik": { label: "İçerik Yükleme", icon: Upload },
  "/ogretmen/canli-ders": { label: "Canlı Ders", icon: Video },
  "/ogretmen/siniflar": { label: "Sınıflarım", icon: Users },
  "/ogretmen/odev": { label: "Ödev & Test", icon: FileQuestion },
  "/ogretmen/analiz": { label: "Analiz Merkezi", icon: BarChart3 },
  "/ogretmen/mesaj": { label: "Mesaj & Duyuru", icon: MessageSquare },
  "/ogretmen/profil": { label: "Profil & Ayarlar", icon: UserCircle },
  "/veli": { label: "Çocuklarım", icon: Users },
  "/veli/rapor": { label: "Raporlar", icon: BarChart3 },
  "/veli/bildirim": { label: "Bildirimler", icon: Bell },
  "/admin": { label: "Admin Paneli", icon: LayoutDashboard },
  "/admin/kullanicilar": { label: "Kullanıcılar", icon: Users },
  "/admin/icerik": { label: "İçerik Yönetimi", icon: Upload },
  "/admin/raporlar": { label: "Raporlar", icon: BarChart3 },
  "/admin/ayarlar": { label: "Sistem Ayarları", icon: Settings },
  "/admin/ogretmen-onay": { label: "Öğretmen Onay", icon: Users },
  "/admin/kupon": { label: "Kuponlar", icon: FileQuestion },
  "/bildirimler": { label: "Bildirimler", icon: Bell },
};

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const notifications = await api.getNotifications(token, { per_page: 50 });
      const count = notifications.data.filter((n) => !n.is_read).length;
      setUnreadCount(count);
    } catch {
      // API hatası — sessizce geç
    }
  }, [token]);

  useEffect(() => {
    if (!user) return;
    setPhotoUrl(user.profile_photo_url || null);
    fetchUnread();

    // Her 60 saniyede bir yenile
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [user, fetchUnread]);

  // Profil fotoğrafı güncellenince senkronize et
  useEffect(() => {
    if (user?.profile_photo_url) setPhotoUrl(user.profile_photo_url);
  }, [user?.profile_photo_url]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/giris");
  };

  if (!user) return null;

  const dashboardHref =
    user.role === "admin"
      ? "/admin"
      : user.role === "teacher"
      ? "/ogretmen"
      : user.role === "parent"
      ? "/veli"
      : "/ogrenci";

  const profileHref =
    user.role === "admin"
      ? "/admin/profil"
      : user.role === "teacher"
      ? "/ogretmen/profil"
      : user.role === "parent"
      ? "/veli/profil"
      : "/ogrenci/profil";

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Aktif sayfa bilgisini bul (dinamik alt yollar için de çalışsın)
  const currentPage = PATH_MAP[pathname] ||
    Object.entries(PATH_MAP).find(([key]) => pathname.startsWith(key + "/"))?.[1] ||
    { label: "Panel", icon: Home };
  const PageIcon = currentPage.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Sol: Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={dashboardHref}
            className="hidden sm:flex items-center gap-1.5 text-slate-400 hover:text-teal-600 transition-colors shrink-0"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Panel</span>
          </Link>
          {pathname !== dashboardHref && (
            <>
              <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-slate-300 shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <PageIcon className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-sm font-semibold text-slate-800 truncate">{currentPage.label}</span>
              </div>
            </>
          )}
          {pathname === dashboardHref && (
            <div className="sm:hidden flex items-center gap-1.5">
              <PageIcon className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-sm font-semibold text-slate-800">{currentPage.label}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Bildirim zili */}
          <Link
            href="/bildirimler"
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label={`${unreadCount} okunmamış bildirim`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold leading-none px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <span className="text-sm font-medium text-slate-600 hidden md:block">{user.name}</span>

          {/* Kullanıcı dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
              aria-expanded={dropdownOpen}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center border border-teal-200/50 overflow-hidden">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-teal-700">{initials}</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-56 py-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50">
                  {/* Kullanıcı özeti */}
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        {user.role === "student" ? "Öğrenci" : user.role === "teacher" ? "Öğretmen" : user.role === "parent" ? "Veli" : "Admin"}
                      </span>
                      {user.subscription_plan && (
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full capitalize">
                          {user.subscription_plan}
                        </span>
                      )}
                      {user.goal?.exam_type && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                          {user.goal.exam_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={dashboardHref}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-teal-600" />
                    Panel
                  </Link>
                  <Link
                    href={profileHref}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profilim
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

