"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronLeft } from "lucide-react";
import {
  Bell,
  ChartBar,
  ClipboardText,
  GearSix,
  UserCircle,
  UsersThree,
} from "@phosphor-icons/react";
import Image from "next/image";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SidebarMenuIcon } from "@/components/dashboard/SidebarMenuIcon";

const veliNav = [
  { href: "/veli", icon: UsersThree, label: "Çocuklarım" },
  { href: "/veli/denemeler", icon: ClipboardText, label: "Denemeler" },
  { href: "/veli/rapor", icon: ChartBar, label: "Raporlar" },
  { href: "/veli/bildirimler", icon: Bell, label: "Bildirimler" },
  { href: "/veli/bildirim", icon: GearSix, label: "Bildirim Ayarları" },
  { href: "/veli/profil", icon: UserCircle, label: "Profil & Ayarlar" },
];

export default function VeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setNarrowViewport(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!narrowViewport && mobileOpen) setMobileOpen(false);
  }, [narrowViewport, mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showMobileBackdrop = mobileOpen && narrowViewport;

  return (
    <AuthGuard role="parent">
      <div className="flex min-h-dvh w-full max-w-[100vw] items-stretch bg-slate-50/80">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 min-h-dvh shrink-0 flex-col border-r border-slate-200/80 bg-white">
          <div className="p-6 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow">
                <Image src="/logo.png" alt="Terence Eğitim" width={44} height={44} />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">
                TERENCE <span className="text-teal-600">EĞİTİM</span>
              </span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {veliNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-100/80 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <SidebarMenuIcon
                    icon={item.icon}
                    active={isActive}
                    size={20}
                    className={isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-100">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50/50 rounded-xl text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Siteye Dön
            </Link>
          </div>
        </aside>

        {/* Mobile overlay */}
        {showMobileBackdrop && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r shadow-2xl transform transition-transform lg:hidden ${
            mobileOpen && narrowViewport ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-4 right-4 z-10">
            <button onClick={() => setMobileOpen(false)} className="p-2.5 rounded-xl hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div onClick={() => setMobileOpen(false)} className="overflow-y-auto h-full pt-4">
            <div className="p-6 border-b border-slate-100">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl overflow-hidden">
                  <Image src="/logo.png" alt="Terence Eğitim" width={44} height={44} />
                </div>
                <span className="font-bold text-slate-900">TERENCE EĞİTİM</span>
              </Link>
            </div>
            <nav className="p-4 space-y-1">
              {veliNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                    pathname === item.href ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <SidebarMenuIcon
                    icon={item.icon}
                    active={pathname === item.href}
                    size={20}
                    className={
                      pathname === item.href ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                    }
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <div className="lg:hidden flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
            <button onClick={() => setMobileOpen(true)} className="p-2.5 rounded-xl hover:bg-slate-100">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/logo.png" alt="Terence Eğitim" width={32} height={32} />
              </div>
              <span className="font-bold text-slate-900 text-sm">TERENCE EĞİTİM</span>
            </div>
          </div>
          <DashboardHeader />
          <main className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
