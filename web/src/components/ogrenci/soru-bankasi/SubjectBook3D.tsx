"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Düz kapak + sırt için hafif ton farkı (belirgin gradient yok) */
export type SubjectBookTheme = {
  cover: string;
  spineTop: string;
  spineBottom: string;
  pages: string;
};

const DEFAULT_THEME: SubjectBookTheme = {
  cover: "#4f46e5",
  spineTop: "#6366f1",
  spineBottom: "#4338ca",
  pages: "#f4f1eb",
};

export function subjectToBookTheme(subject: string): SubjectBookTheme {
  const s = subject.toLowerCase();
  if (s.includes("matematik"))
    return {
      cover: "#6d28d9",
      spineTop: "#7c3aed",
      spineBottom: "#5b21b6",
      pages: "#faf5ff",
    };
  if (s.includes("türk") || s.includes("turk"))
    return {
      cover: "#be123c",
      spineTop: "#e11d48",
      spineBottom: "#9f1239",
      pages: "#fff1f2",
    };
  if (s.includes("fen"))
    return {
      cover: "#059669",
      spineTop: "#10b981",
      spineBottom: "#047857",
      pages: "#ecfdf5",
    };
  if (s.includes("fizik"))
    return {
      cover: "#0369a1",
      spineTop: "#0ea5e9",
      spineBottom: "#075985",
      pages: "#f0f9ff",
    };
  if (s.includes("kimya"))
    return {
      cover: "#d97706",
      spineTop: "#f59e0b",
      spineBottom: "#b45309",
      pages: "#fffbeb",
    };
  if (s.includes("biyoloji"))
    return {
      cover: "#65a30d",
      spineTop: "#84cc16",
      spineBottom: "#4d7c0f",
      pages: "#f7fee7",
    };
  if (s.includes("tarih"))
    return {
      cover: "#c2410c",
      spineTop: "#ea580c",
      spineBottom: "#9a3412",
      pages: "#fff7ed",
    };
  if (s.includes("coğrafya") || s.includes("cografya"))
    return {
      cover: "#0e7490",
      spineTop: "#06b6d4",
      spineBottom: "#0f766e",
      pages: "#ecfeff",
    };
  return DEFAULT_THEME;
}

type SubjectBook3DProps = {
  subject: string;
  meta: string;
  href: string;
  className?: string;
  onActivate?: () => void;
};

/** Kapak ölçüleri (px) — tek yerden büyütme */
const BOOK_W = 210;
const BOOK_H = 286;
const SPINE_W = 28;

export function SubjectBook3D({ subject, meta, href, className, onActivate }: SubjectBook3DProps) {
  const th = subjectToBookTheme(subject);
  const safeHref = href?.trim() || `/ogrenci/soru-bankasi?subject=${encodeURIComponent(subject)}`;

  const cls = cn(
    "group/book relative block w-[248px] shrink-0 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50",
    className
  );

  const visual = (
    <div className="perspective-[1500px]">
      <div
        className="pointer-events-none absolute -bottom-1 left-1/2 h-6 w-[85%] -translate-x-1/2 rounded-[100%] bg-slate-900/12 blur-xl transition-all duration-500 group-hover/book:w-[92%]"
        aria-hidden
      />

      <div
        className={cn(
          "relative mx-auto origin-center [transform-style:preserve-3d]",
          "transition-[transform] duration-500 ease-[cubic-bezier(0.33,1.34,0.64,1)]",
          "group-hover/book:[transform:rotateY(-24deg)_rotateX(5deg)_translateY(-10px)_translateZ(12px)]",
          "[transform:rotateY(-16deg)_rotateX(3deg)_translateZ(0)]"
        )}
      >
        <div
          className="pointer-events-none absolute left-0 top-[12px] z-0 rounded-l-md shadow-[inset_-3px_0_10px_rgba(0,0,0,0.2)]"
          style={{
            width: SPINE_W,
            height: `calc(100% - 24px)`,
            transform: "rotateY(-90deg)",
            transformOrigin: "right center",
            background: `linear-gradient(180deg, ${th.spineTop} 0%, ${th.spineBottom} 100%)`,
          }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute z-[1] overflow-hidden rounded-r-[3px] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.08)]"
          style={{
            width: 15,
            right: -13,
            top: 14,
            bottom: 14,
            background: th.pages,
            transform: "translateZ(-4px)",
          }}
          aria-hidden
        >
          <div
            className="absolute inset-y-3 right-1 w-px opacity-40"
            style={{
              backgroundImage: `repeating-linear-gradient(
                  0deg,
                  rgba(0,0,0,0.06) 0px,
                  rgba(0,0,0,0.06) 1px,
                  transparent 1px,
                  transparent 6px
                )`,
            }}
          />
        </div>

        <div
          className="relative z-[2] flex flex-col justify-between overflow-hidden rounded-r-[15px] border border-black/[0.08] p-[18px] shadow-[10px_14px_28px_rgba(15,23,42,0.14)]"
          style={{
            width: BOOK_W,
            height: BOOK_H,
            backgroundColor: th.cover,
          }}
        >
          {/* Çok hafif üst parlama — belirgin gradient yok */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent"
            aria-hidden
          />

          <div className="relative flex items-start justify-between gap-2">
            <span className="rounded border border-white/25 bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/95">
              Soru Bankası
            </span>
            <span className="text-[11px] font-semibold text-white/70">2026</span>
          </div>

          <div className="relative mt-1">
            <p className="text-[12px] font-medium uppercase tracking-wide text-white/75">Terence Eğitim</p>
            <h3 className="mt-2 line-clamp-3 text-[22px] font-bold leading-snug tracking-tight text-white">
              {subject}
            </h3>
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/85">{meta}</p>
          </div>

          <div className="relative flex items-center justify-between gap-2 border-t border-white/20 pt-3">
            <span className="text-[12px] font-medium text-white/75">Çöz · İlerle</span>
            <span className="rounded-full bg-black/15 px-3 py-1 text-[12px] font-semibold text-white transition-colors group-hover/book:bg-black/25">
              Aç →
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (onActivate) {
    return (
      <button
        type="button"
        onClick={onActivate}
        className={cn(cls, "cursor-pointer border-0 bg-transparent p-0")}
        aria-label={`${subject} soru bankasını aç`}
      >
        {visual}
      </button>
    );
  }

  return (
    <Link href={safeHref} className={cls}>
      {visual}
    </Link>
  );
}
