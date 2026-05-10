"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardWrapper({ sidebar, header, children }: Props) {
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
    <div className="flex min-h-dvh w-full max-w-[100vw] items-stretch bg-slate-50/80">
      {/* Desktop: sidebar — yükseklik içerikle büyür; ayrı scroll çubuğu oluşturmaz */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col self-stretch border-r border-slate-200/80 bg-white">
        {sidebar}
      </aside>

      {/* Mobile: overlay */}
      {showMobileBackdrop && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile: slide-out sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden",
          mobileOpen && narrowViewport ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-4 right-4 z-10 lg:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div onClick={() => setMobileOpen(false)} className="overflow-y-auto h-full">
          {sidebar}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div className="flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Terence Eğitim" width={32} height={32} />
            </div>
            <span className="text-sm font-bold text-slate-900">TERENCE EĞİTİM</span>
          </div>
        </div>
        {header}
        <main className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
