"use client";

import { Flame, Play } from "lucide-react";

export function StudyMotivationBanner({
  onStartQuick,
}: {
  onStartQuick: () => void;
}) {
  return (
    <aside
      aria-label="Çalışma hatırlatması"
      className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-gradient-to-r from-orange-950/80 via-amber-950/50 to-slate-950 p-6 shadow-[0_20px_60px_rgba(234,88,12,0.15)] sm:p-8"
    >
      <div className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-0 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/20 shadow-inner">
            <Flame className="h-7 w-7 text-orange-300" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-bold text-white sm:text-xl">Bugün bir set daha</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-100/80">
              Netini yükselten şey tek bir kahramanlık değil; düzenli tekrar. Hızlı set ile ısın, sonra zayıf konuya
              dal.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartQuick}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-stretch rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-xl transition hover:bg-orange-50 lg:self-center"
        >
          <Play className="h-5 w-5 fill-current" aria-hidden />
          Hızlı set ile başla
        </button>
      </div>
    </aside>
  );
}
