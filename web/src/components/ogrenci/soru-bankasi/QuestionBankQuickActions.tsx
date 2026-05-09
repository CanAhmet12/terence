"use client";

import { Clock, Crosshair, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuestionBankQuickActions({
  onQuick10,
  onWeakFocus,
  onTimedPractice,
  disabled,
}: {
  onQuick10: () => void;
  onWeakFocus: () => void;
  onTimedPractice: () => void;
  disabled: boolean;
}) {
  const cards = [
    {
      title: "Hızlı 10",
      desc: "Rastgele 10 soruluk set — akışa gir.",
      icon: Zap,
      onClick: onQuick10,
      gradient: "from-amber-500/25 via-orange-950/40 to-slate-950",
      ring: "hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]",
    },
    {
      title: "Zayıf kazanım seti",
      desc: "İlk zayıf konundan başlayarak otomatik yükle.",
      icon: Crosshair,
      onClick: onWeakFocus,
      gradient: "from-rose-500/20 via-violet-950/50 to-slate-950",
      ring: "hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]",
    },
    {
      title: "Süreli 5 dk",
      desc: "15 soru · 300 saniye geri sayım.",
      icon: Clock,
      onClick: onTimedPractice,
      gradient: "from-cyan-500/20 via-slate-900/60 to-slate-950",
      ring: "hover:shadow-[0_0_40px_rgba(34,211,238,0.12)]",
    },
  ];

  return (
    <fieldset className="space-y-4 border-0 p-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Hızlı modlar
      </legend>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ title, desc, icon: Icon, onClick, gradient, ring }) => (
          <button
            key={title}
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br p-5 text-left shadow-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070712]",
              "disabled:pointer-events-none disabled:opacity-45",
              gradient,
              ring,
              "hover:-translate-y-0.5 hover:border-white/15"
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-70" />
            <div className="relative flex flex-col gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/35 text-white shadow-inner backdrop-blur-sm">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <span className="text-base font-bold text-white">{title}</span>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-300/90 opacity-0 transition group-hover:opacity-100">
                Başlat →
              </span>
            </div>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
