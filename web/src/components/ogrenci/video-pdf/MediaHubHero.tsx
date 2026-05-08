"use client";

import { FileText, FolderOpen, Video } from "lucide-react";

export function MediaHubHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm shadow-slate-200/30 sm:px-6 sm:py-5">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-100/50 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-28 w-28 rounded-full bg-indigo-100/40 blur-xl" aria-hidden />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 sm:h-12 sm:w-12">
          <Video className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Video & PDF</h1>
          <p className="mt-1 max-w-2xl text-xs leading-snug text-slate-600 sm:text-sm">
            Tüm derslerinizin video ve PDF içeriklerine tek yerden ulaşın.
          </p>
        </div>

        <div className="relative hidden h-[4.5rem] shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 via-violet-50/35 to-indigo-50/50 px-4 xl:flex">
          <div className="relative flex h-full w-[7.5rem] items-center justify-center">
            <div className="absolute left-0 top-1 flex h-8 w-8 rotate-[-8deg] items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/70">
              <FolderOpen className="h-4 w-4 text-amber-500" aria-hidden />
            </div>
            <div className="absolute bottom-1 left-6 flex h-7 w-7 rotate-[6deg] items-center justify-center rounded-full bg-violet-600 text-white shadow-md">
              <Video className="h-3.5 w-3.5" aria-hidden />
            </div>
            <div className="absolute right-0 top-1 flex h-9 w-7 rotate-[4deg] items-center justify-center rounded-md border border-red-100 bg-white shadow-sm">
              <span className="text-[8px] font-black text-red-500">PDF</span>
            </div>
            <div className="absolute right-1 bottom-0 flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
              <FileText className="h-3.5 w-3.5" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
