"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Users, BarChart3, Bell, ChevronLeft, UserCircle } from "lucide-react";
import Image from "next/image";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const veliNav = [
  { href: "/veli", icon: Users, label: "Çocuklarım" },
  { href: "/veli/rapor", icon: BarChart3, label: "Raporlar" },
  { href: "/veli/bildirim", icon: Bell, label: "Bildirimler" },
  { href: "/veli/profil", icon: UserCircle, label: "Profil & Ayarlar" },
];

export default function VeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <AuthGuard role="parent">
      <div className="flex min-h-screen bg-slate-50/80">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-slate-200/80 flex-col shrink-0">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-100/80 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
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
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r shadow-2xl transform transition-transform lg:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                    pathname === item.href ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50"
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
              <span className="font-bold text-slate-900 text-sm">TERENCE EĞİTİM</span>
            </div>
          </div>
          <DashboardHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
