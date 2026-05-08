"use client";

import { FileText, FolderOpen, Video } from "lucide-react";

export function MediaHubHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-8 shadow-md shadow-slate-200/40 sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-100/60 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-indigo-100/50 blur-2xl" aria-hidden />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 sm:h-[4.5rem] sm:w-[4.5rem]">
            <Video className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-[2rem] lg:text-4xl">Video & PDF</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Tüm derslerinizin video ve PDF içeriklerine tek yerden ulaşın.
            </p>
          </div>
        </div>

        <div className="relative hidden h-44 items-center justify-center rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-violet-50/40 to-indigo-50/60 p-6 lg:flex">
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="absolute left-4 top-6 flex h-14 w-14 rotate-[-8deg] items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-200/80">
              <FolderOpen className="h-7 w-7 text-amber-500" aria-hidden />
            </div>
            <div className="absolute bottom-8 left-10 flex h-12 w-12 rotate-[6deg] items-center justify-center rounded-full bg-violet-600 text-white shadow-lg">
              <Video className="h-5 w-5" aria-hidden />
            </div>
            <div className="absolute right-6 top-8 flex h-16 w-12 rotate-[4deg] items-center justify-center rounded-lg border border-red-100 bg-white shadow-md">
              <span className="text-[10px] font-black text-red-500">PDF</span>
            </div>
            <div className="absolute right-10 bottom-10 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 shadow-inner">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
