"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LogOut, User, ChevronDown, Bell, GraduationCap } from "lucide-react";
import { useState } from "react";

export function DashboardHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const unreadCount = 2; // Mock - API ile gelecek

  const handleLogout = async () => {
    await logout();
    router.push("/giris");
  };

  if (!user) return null;

  const dashboardHref = user.role === "admin" ? "/admin" : user.role === "teacher" ? "/ogretmen" : user.role === "parent" ? "/veli" : "/ogrenci";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Link
              href="/bildirimler"
              className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </Link>
          )}
          <span className="text-sm font-medium text-slate-600 hidden sm:block">{user.name}</span>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center border border-teal-200/50">
                <User className="w-5 h-5 text-teal-600" />
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
                <div className="absolute right-0 mt-2 w-52 py-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 animate-fade-in">
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
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Profil
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
