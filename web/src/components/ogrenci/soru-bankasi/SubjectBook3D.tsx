"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type SubjectBookTheme = {
  coverFrom: string;
  coverVia: string;
  coverTo: string;
  spineTop: string;
  spineBottom: string;
  rimLight: string;
  pages: string;
};

const DEFAULT_THEME: SubjectBookTheme = {
  coverFrom: "#4338ca",
  coverVia: "#312e81",
  coverTo: "#1e1b4b",
  spineTop: "#6366f1",
  spineBottom: "#1e1b4b",
  rimLight: "rgba(255,255,255,0.28)",
  pages: "#f4efe6",
};

/** Gerçek soru bankası kapaklarına yakın, CSS ile 3D kitap görünümü */
export function subjectToBookTheme(subject: string): SubjectBookTheme {
  const s = subject.toLowerCase();
  if (s.includes("matematik"))
    return {
      coverFrom: "#6d28d9",
      coverVia: "#4c1d95",
      coverTo: "#2e1065",
      spineTop: "#a78bfa",
      spineBottom: "#1e1b4b",
      rimLight: "rgba(196,181,253,0.45)",
      pages: "#faf5ff",
    };
  if (s.includes("türk") || s.includes("turk"))
    return {
      coverFrom: "#be123c",
      coverVia: "#881337",
      coverTo: "#4c0519",
      spineTop: "#fb7185",
      spineBottom: "#450a0a",
      rimLight: "rgba(254,202,213,0.4)",
      pages: "#fff1f2",
    };
  if (s.includes("fen"))
    return {
      coverFrom: "#059669",
      coverVia: "#047857",
      coverTo: "#064e3b",
      spineTop: "#34d399",
      spineBottom: "#022c22",
      rimLight: "rgba(167,243,208,0.35)",
      pages: "#ecfdf5",
    };
  if (s.includes("fizik"))
    return {
      coverFrom: "#0284c7",
      coverVia: "#0369a1",
      coverTo: "#0c4a6e",
      spineTop: "#7dd3fc",
      spineBottom: "#082f49",
      rimLight: "rgba(186,230,253,0.45)",
      pages: "#f0f9ff",
    };
  if (s.includes("kimya"))
    return {
      coverFrom: "#d97706",
      coverVia: "#b45309",
      coverTo: "#78350f",
      spineTop: "#fcd34d",
      spineBottom: "#451a03",
      rimLight: "rgba(253,230,138,0.4)",
      pages: "#fffbeb",
    };
  if (s.includes("biyoloji"))
    return {
      coverFrom: "#65a30d",
      coverVia: "#4d7c0f",
      coverTo: "#365314",
      spineTop: "#bef264",
      spineBottom: "#1a2e05",
      rimLight: "rgba(217,249,157,0.35)",
      pages: "#f7fee7",
    };
  if (s.includes("tarih"))
    return {
      coverFrom: "#c2410c",
      coverVia: "#9a3412",
      coverTo: "#431407",
      spineTop: "#fdba74",
      spineBottom: "#431407",
      rimLight: "rgba(254,215,170,0.4)",
      pages: "#fff7ed",
    };
  if (s.includes("coğrafya") || s.includes("cografya"))
    return {
      coverFrom: "#0891b2",
      coverVia: "#0e7490",
      coverTo: "#164e63",
      spineTop: "#67e8f9",
      spineBottom: "#083344",
      rimLight: "rgba(165,243,252,0.4)",
      pages: "#ecfeff",
    };
  return DEFAULT_THEME;
}

type SubjectBook3DProps = {
  subject: string;
  meta: string;
  href: string;
  className?: string;
};

export function SubjectBook3D({ subject, meta, href, className }: SubjectBook3DProps) {
  const th = subjectToBookTheme(subject);

  return (
    <Link
      href={href}
      className={cn(
        "group/book relative block w-[200px] shrink-0 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50",
        className
      )}
    >
      <div className="perspective-[1400px]">
        {/* Masaya düşen gölge */}
        <div
          className="pointer-events-none absolute -bottom-1 left-1/2 h-5 w-[85%] -translate-x-1/2 rounded-[100%] bg-slate-900/15 blur-xl transition-all duration-500 group-hover/book:w-[92%] group-hover/book:opacity-90"
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
          {/* Kitap sırtı — 3B yüzey */}
          <div
            className="absolute left-0 top-[10px] z-0 h-[calc(100%-20px)] w-[26px] rounded-l-md shadow-[inset_-4px_0_12px_rgba(0,0,0,0.45),inset_3px_0_8px_rgba(255,255,255,0.12)]"
            style={{
              transform: "rotateY(-90deg)",
              transformOrigin: "right center",
              background: `linear-gradient(180deg, ${th.spineTop} 0%, ${th.spineBottom} 100%)`,
            }}
            aria-hidden
          />

          {/* Sayfa kesiti */}
          <div
            className="absolute -right-[11px] top-[12px] bottom-[12px] z-[1] w-[14px] overflow-hidden rounded-r-[3px] shadow-[inset_-3px_0_6px_rgba(0,0,0,0.12)]"
            style={{
              background: `linear-gradient(90deg, #e7dfd4 0%, ${th.pages} 35%, #cfc4b8 100%)`,
              transform: "translateZ(-4px)",
            }}
            aria-hidden
          >
            <div
              className="absolute inset-y-2 right-1 w-px bg-black/[0.06]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  rgba(0,0,0,0.07) 0px,
                  rgba(0,0,0,0.07) 1px,
                  transparent 1px,
                  transparent 5px
                )`,
              }}
            />
          </div>

          {/* Ön kapak */}
          <div
            className="relative z-[2] flex h-[248px] w-[178px] flex-col justify-between overflow-hidden rounded-r-[14px] border border-white/15 p-4 shadow-[12px_18px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.15)]"
            style={{
              background: `linear-gradient(155deg, ${th.coverFrom} 0%, ${th.coverVia} 48%, ${th.coverTo} 100%)`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/40"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-50 blur-2xl"
              style={{ background: th.rimLight }}
              aria-hidden
            />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />

            <div className="relative flex items-start justify-between gap-2">
              <span className="rounded border border-white/20 bg-black/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
                Soru Bankası
              </span>
              <span className="text-[10px] font-semibold text-white/55">2026</span>
            </div>

            <div className="relative mt-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Terence Eğitim</p>
              <h3 className="mt-2 line-clamp-3 text-xl font-bold leading-snug tracking-tight text-white drop-shadow-md">
                {subject}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/80">{meta}</p>
            </div>

            <div className="relative flex items-center justify-between gap-2 border-t border-white/15 pt-3">
              <span className="text-[11px] font-medium text-white/65">Çöz · İlerle</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white shadow-inner backdrop-blur-md transition-colors group-hover/book:bg-white/25">
                Aç →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
