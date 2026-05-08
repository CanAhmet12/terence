"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Home, Search } from "lucide-react";
import { HeaderUserMenu } from "@/components/dashboard/HeaderUserMenu";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
};

export function MediaHubPageHeader({ search, onSearchChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-[60] border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:gap-6 lg:py-3">
        <nav
          className="flex min-w-0 shrink-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-slate-600 sm:text-sm"
          aria-label="Konum"
        >
          <Link href="/ogrenci" className="shrink-0 text-slate-400 transition-colors hover:text-violet-600" title="Panel">
            <Home className="h-4 w-4" aria-hidden />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
          <span className="shrink-0 text-slate-500">Panel</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
          <span className="shrink-0 font-semibold text-slate-900">Video & PDF</span>
        </nav>

        <div className="relative min-w-0 flex-1 lg:px-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 lg:left-7" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Video veya PDF ara..."
            className="w-full rounded-full border border-slate-200 bg-slate-50/90 py-2.5 pl-10 pr-[5.5rem] text-sm text-slate-900 outline-none transition-shadow focus:border-violet-300 focus:ring-2 focus:ring-violet-100 lg:pl-11"
            aria-label="Video veya PDF ara"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 shadow-sm sm:inline-block">
            Ctrl+K
          </kbd>
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  );
}
