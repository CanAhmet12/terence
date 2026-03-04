"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileQuestion,
  BarChart3,
  Settings,
  Menu,
  X,
  UserCheck,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/kullanicilar", icon: Users, label: "Kullanıcılar" },
  { href: "/admin/ogretmen-onay", icon: UserCheck, label: "Öğretmen Onay" },
  { href: "/admin/icerik", icon: BookOpen, label: "İçerik" },
  { href: "/admin/sorular", icon: FileQuestion, label: "Soru Havuzu" },
  { href: "/admin/kupon", icon: Tag, label: "Kuponlar" },
  { href: "/admin/raporlar", icon: BarChart3, label: "Raporlar" },
  { href: "/admin/ayarlar", icon: Settings, label: "Ayarlar" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard role="admin">
      <div className="flex min-h-screen bg-slate-50/80">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 min-h-screen bg-slate-900 text-white flex-col shrink-0">
          <div className="p-6 border-b border-slate-700/80">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow">
                <Image src="/logo.png" alt="Terence Eğitim" width={44} height={44} />
              </div>
              <span className="font-bold tracking-tight">ADMIN</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-teal-600/20 text-teal-400 border border-teal-500/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 text-white shadow-2xl transform transition-transform lg:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
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
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                    pathname === item.href ? "bg-teal-600/20 text-teal-400" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
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
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
