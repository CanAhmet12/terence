import Image from "next/image";
import { cn } from "@/lib/utils";

/** Öğrenci paneli — Dijital Koç marka ikonu (`/dijitalkocicon.png`). PNG şeffaf alfa ile kullanılmalıdır. */
export function DigitalCoachIcon({
  className,
  size = 20,
}: {
  className?: string;
  /** Kare ikon kenarı (px) */
  size?: number;
}) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-visible", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/dijitalkocicon.png"
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain object-center select-none"
        sizes={`${size}px`}
        draggable={false}
      />
    </span>
  );
}
