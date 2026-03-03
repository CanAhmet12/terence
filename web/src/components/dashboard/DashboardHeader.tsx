"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { LogOut, User, ChevronDown, Bell, GraduationCap } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export function DashboardHeader() {
  const router = useRouter();
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

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          {/* Bildirim zili */}
          <Link
            href="/bildirimler"
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label={`${unreadCount} okunmamış bildirim`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <span className="text-sm font-medium text-slate-600 hidden sm:block">{user.name}</span>

          {/* Kullanıcı dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
              aria-expanded={dropdownOpen}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center border border-teal-200/50 overflow-hidden">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-teal-700">{initials}</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
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
                    {user.subscription_plan && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full capitalize">
                        {user.subscription_plan}
                      </span>
                    )}
                  </div>
                  <Link
                    href={dashboardHref}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    Panel
                  </Link>
                  <Link
                    href="/profil"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profil
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

