"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  ChartBar,
  Exam,
  GearSix,
  SquaresFour,
  Stack,
  Tag,
  UserCircleCheck,
  Users,
} from "@phosphor-icons/react";
import Image from "next/image";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SidebarMenuIcon } from "@/components/dashboard/SidebarMenuIcon";

const navItems = [
  { href: "/admin", icon: SquaresFour, label: "Dashboard" },
  { href: "/admin/kullanicilar", icon: Users, label: "Kullanıcılar" },
  { href: "/admin/ogretmen-onay", icon: UserCircleCheck, label: "Öğretmen Onay" },
  { href: "/admin/icerik-merkezi", icon: Stack, label: "İçerik merkezi" },
  { href: "/admin/sorular", icon: Exam, label: "Soru Havuzu" },
  { href: "/admin/kupon", icon: Tag, label: "Kuponlar" },
  { href: "/admin/raporlar", icon: ChartBar, label: "Raporlar" },
  { href: "/admin/ayarlar", icon: GearSix, label: "Ayarlar" },
];

function adminNavItemActive(pathname: string, href: string) {
  if (href === "/admin/icerik-merkezi") {
    return (
      pathname === "/admin/icerik-merkezi" ||
      pathname.startsWith("/admin/icerik") ||
      pathname.startsWith("/admin/deneme-sablonlari") ||
      pathname.startsWith("/admin/soru-bankasi-kitaplari")
    );
  }
  return pathname === href;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  /** Tailwind dışı: dar pencerede menü açık kaldıysa veya lg:hidden üretimi sorunluysa overlay masaüstünde kalmasın */
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
    <AuthGuard role="admin">
      <div className="flex min-h-dvh w-full max-w-[100vw] items-stretch bg-slate-50/80">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 min-h-dvh shrink-0 flex-col bg-slate-900 text-white">
          <div className="p-6 border-b border-slate-700/80">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/30 transition-shadow">
                <Image src="/logo.png" alt="Terence Eğitim" width={44} height={44} />
              </div>
              <span className="font-bold tracking-tight">ADMIN</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = adminNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <SidebarMenuIcon
                    icon={item.icon}
                    active={isActive}
                    size={20}
                    className={isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-white"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {showMobileBackdrop && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 text-white shadow-2xl transform transition-transform lg:hidden ${
            mobileOpen && narrowViewport ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-4 right-4 z-10">
            <button onClick={() => setMobileOpen(false)} className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div onClick={() => setMobileOpen(false)} className="overflow-y-auto h-full pt-4">
            <div className="p-6 border-b border-slate-700">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl overflow-hidden">
                  <Image src="/logo.png" alt="Terence Eğitim" width={44} height={44} />
                </div>
                <span className="font-bold">ADMIN</span>
              </Link>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = adminNavItemActive(pathname, item.href);
                return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                    isActive
                      ? "bg-cyan-600/20 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <SidebarMenuIcon
                    icon={item.icon}
                    active={isActive}
                    size={20}
                    className={isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-white"}
                  />
                  {item.label}
                </Link>
              );
              })}
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
              <span className="font-bold text-slate-900 text-sm">ADMIN</span>
            </div>
          </div>
          <DashboardHeader />
          <main className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
