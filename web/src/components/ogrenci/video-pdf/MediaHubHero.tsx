"use client";

import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";

export function MediaHubHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 px-6 py-10 text-white shadow-xl sm:px-10 lg:py-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl" aria-hidden />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Video & PDF
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tek yerden video ve PDF
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Müfredat içeriklerinizi keşfedin, ilerlemenizi takip edin; konu bazlı çalışma için{" "}
            <Link
              href="/ogrenci/dersler"
              className="font-semibold text-violet-300 underline decoration-violet-400/60 underline-offset-2 hover:text-white"
            >
              Derslerim
            </Link>{" "}
            sayfasına geçin.
          </p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <div className="relative flex h-44 w-full max-w-sm items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:h-52">
            <BookOpen className="h-20 w-20 text-violet-300/90 sm:h-24 sm:w-24" aria-hidden />
            <span className="sr-only">Medya hub illüstrasyonu</span>
          </div>
        </div>
      </div>
    </section>
  );
}
