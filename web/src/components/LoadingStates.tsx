import { Suspense } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

/** Inline / küçük alanlar için — ince ring, cyan vurgu */
export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const ring = {
    sm: "h-5 w-5 border-2",
    md: "h-9 w-9 border-2",
    lg: "h-12 w-12 border-[3px]",
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <div
        className={`${ring} rounded-full border-slate-200/90 border-t-cyan-500 border-r-cyan-400/40 shadow-sm animate-spin`}
        style={{ animationDuration: size === "sm" ? "0.7s" : "0.85s" }}
        role="status"
        aria-label={text || "Yükleniyor"}
      />
      {text ? <p className="max-w-xs text-center text-sm font-medium text-slate-500">{text}</p> : null}
    </div>
  );
}

/** Route geçişleri (`app/loading.tsx`) — tam ekran, cam kart, yumuşak arka plan */
export function FullPageLoading({ text = "Sayfa hazırlanıyor" }: { text?: string }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(6,182,212,0.14),transparent_58%),radial-gradient(ellipse_70%_45%_at_100%_80%,rgba(6,182,212,0.07),transparent_50%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] [--border:rgb(226_232_240)]"
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-8 rounded-3xl border border-slate-200/70 bg-white/75 px-14 py-12 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-16 sm:py-14">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/15 to-cyan-400/5 blur-md" aria-hidden />
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" aria-hidden />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyan-500 border-r-cyan-400/50 animate-spin"
            style={{ animationDuration: "0.9s" }}
            role="status"
            aria-label={text}
          />
          <div className="absolute inset-[10px] rounded-full bg-white/90" aria-hidden />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[15px] font-semibold tracking-tight text-slate-800">{text}</p>
          <p className="text-xs font-medium text-slate-500">Bir saniye…</p>
        </div>

        <div className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-cyan-500/35 animate-pulse"
              style={{ animationDelay: `${i * 180}ms`, animationDuration: "1.2s" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return <FullPageLoading text="Yükleniyor" />;
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg bg-white p-4 shadow">
      <div className="mb-3 h-4 w-3/4 rounded bg-slate-200"></div>
      <div className="mb-2 h-3 w-full rounded bg-slate-200"></div>
      <div className="h-3 w-5/6 rounded bg-slate-200"></div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingText?: string;
}

export function SuspenseWrapper({ children, fallback, loadingText }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner size="md" text={loadingText || "Yükleniyor…"} />}>
      {children}
    </Suspense>
  );
}

export default LoadingSpinner;
