"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/#ozellikler", label: "Özellikler" },
  { href: "/#neden-biz", label: "Neden Biz" },
  { href: "/#paketler", label: "Paketler" },
  { href: "/#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "/#sss", label: "SSS" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "teacher"
        ? "/ogretmen"
        : user?.role === "parent"
          ? "/veli"
          : "/ogrenci";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo - premium görünüm */}
          <Link
            href="/"
            className="flex items-center gap-3 text-slate-900 hover:opacity-90 transition-opacity group"
          >
            <Image src="/logo.png" alt="Terence Eğitim" width={44} height={44} className="rounded-2xl" />
            <span className="font-bold text-xl tracking-tight">
              TERENCE{" "}
              <span className="text-teal-600 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                EĞİTİM
              </span>
            </span>
          </Link>

          {/* Desktop Nav - temiz, profesyonel */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50/80 font-medium rounded-xl transition-all duration-200 text-[15px]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profil"
                  className="px-4 py-2.5 text-slate-600 hover:text-teal-700 font-medium transition-colors"
                >
                  Profil
                </Link>
                <Link
                  href={dashboardHref}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/35 hover:-translate-y-0.5"
                >
                  Panele Git
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="px-4 py-2.5 text-slate-600 hover:text-teal-700 font-semibold transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/35 hover:-translate-y-0.5"
                >
                  Ücretsiz Başla
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu - full screen overlay hissi */}
        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200/80 bg-white/95 backdrop-blur-sm animate-fade-in">
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3.5 px-4 text-slate-700 hover:bg-teal-50 font-medium rounded-xl mx-1 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-slate-200 mx-1">
                {user ? (
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="py-3.5 px-4 text-center bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25"
                  >
                    Panele Git
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/giris"
                      onClick={() => setMobileOpen(false)}
                      className="py-3.5 px-4 text-center font-semibold text-slate-700 rounded-xl hover:bg-slate-100"
                    >
                      Giriş Yap
                    </Link>
                    <Link
                      href="/kayit"
                      onClick={() => setMobileOpen(false)}
                      className="py-3.5 px-4 text-center bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25"
                    >
                      Ücretsiz Başla
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
