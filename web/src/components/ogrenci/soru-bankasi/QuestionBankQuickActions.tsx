"use client";

import { Crosshair, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuestionBankQuickActions({
  onQuick10,
  onWeakFocus,
  disabled,
}: {
  onQuick10: () => void;
  onWeakFocus: () => void;
  disabled: boolean;
}) {
  const cards = [
    {
      title: "Hızlı 10",
      desc: "Rastgele 10 soruluk set — akışa gir.",
      icon: Zap,
      onClick: onQuick10,
      gradient: "bg-gradient-to-br from-amber-50 to-orange-50/90 border-amber-100",
      ring: "hover:shadow-md hover:border-amber-200",
    },
    {
      title: "Zayıf kazanım seti",
      desc: "İlk zayıf konundan başlayarak otomatik yükle.",
      icon: Crosshair,
      onClick: onWeakFocus,
      gradient: "bg-gradient-to-br from-rose-50 to-violet-50/90 border-rose-100",
      ring: "hover:shadow-md hover:border-rose-200",
    },
  ];

  return (
    <fieldset className="space-y-3 border-0 p-0">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Hızlı modlar
      </legend>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map(({ title, desc, icon: Icon, onClick, gradient, ring }) => (
          <button
            key={title}
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50",
              "disabled:pointer-events-none disabled:opacity-45",
              gradient,
              ring,
              "hover:-translate-y-0.5"
            )}
          >
            <div className="relative flex flex-col gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/90 bg-white text-violet-700 shadow-sm">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <span className="text-base font-bold text-slate-900">{title}</span>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 opacity-0 transition group-hover:opacity-100">
                Başlat →
              </span>
            </div>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
