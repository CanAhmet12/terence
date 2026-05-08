"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Bell, ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type HeaderUserMenuProps = {
  /** Örn. Video & PDF: mor rozet */
  notificationBadgeClassName?: string;
  /** Mockup: "12. Sınıf" satırı */
  profileSubtext?: string | null;
};

export function HeaderUserMenu({
  notificationBadgeClassName,
  profileSubtext,
}: HeaderUserMenuProps) {
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
      // ignore
    }
  }, [token]);

  useEffect(() => {
    if (!user) return;
    setPhotoUrl(user.profile_photo_url || null);
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [user, fetchUnread]);

  useEffect(() => {
    if (user?.profile_photo_url) setPhotoUrl(user.profile_photo_url);
  }, [user?.profile_photo_url]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/");
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

  const notificationsHref =
    user.role === "teacher"
      ? "/ogretmen/bildirimler"
      : user.role === "parent"
        ? "/veli/bildirimler"
        : user.role === "admin"
          ? "/admin/bildirimler"
          : "/ogrenci/bildirimler";

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <Link
        href={notificationsHref}
        className="relative flex items-center justify-center rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
        aria-label={`${unreadCount} okunmamış bildirim`}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span
            className={
              notificationBadgeClassName ??
              "absolute right-0.5 top-0.5 flex h-[18px] min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
            }
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

      <div className="hidden flex-col items-end text-right leading-tight md:flex">
        <span className="text-sm font-medium text-slate-800">{user.name}</span>
        {profileSubtext ? (
          <span className="text-[11px] font-medium text-slate-500">{profileSubtext}</span>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 rounded-xl px-1.5 py-1.5 text-slate-700 transition-colors hover:bg-slate-100 sm:gap-2 sm:px-2"
          aria-expanded={dropdownOpen}
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-100 to-indigo-100">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-violet-800">{initials}</span>
            )}
          </div>
          <ChevronDown className={`hidden h-4 w-4 transition-transform sm:block ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
              <div className="mb-1 border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <Link
                href={dashboardHref}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <LayoutDashboard className="h-4 w-4 text-violet-600" />
                Panel
              </Link>
              <Link
                href={profileHref}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profilim
              </Link>
              <div className="mt-1 border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
