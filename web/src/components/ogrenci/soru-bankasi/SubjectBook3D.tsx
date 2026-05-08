"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

type Size = "carousel" | "hero";

const sceneClass: Record<Size, string> = {
  carousel: "qb-book3d-scene qb-book3d-scene--carousel",
  hero: "qb-book3d-scene qb-book3d-scene--hero",
};

const iconClass: Record<Size, string> = {
  carousel: "qb-book3d-icon",
  hero: "qb-book3d-icon qb-book3d-icon--hero",
};

/** Mockuptaki dik duran kitap + parlak kapak + sırt derinliği (saf CSS 3D) */
export function SubjectBook3D({
  g1,
  g2,
  Icon,
  size = "carousel",
}: {
  g1: string;
  g2: string;
  Icon: LucideIcon;
  size?: Size;
}) {
  return (
    <div className={sceneClass[size]}>
      <div className="qb-book3d">
        <div className="qb-book3d-spine" aria-hidden />
        <div
          className="qb-book3d-cover"
          style={
            {
              "--qb-g1": g1,
              "--qb-g2": g2,
            } as CSSProperties
          }
        >
          <div className="qb-book3d-gloss" aria-hidden />
          <Icon className={iconClass[size]} strokeWidth={2.25} aria-hidden />
        </div>
        <div className="qb-book3d-pages" aria-hidden />
      </div>
    </div>
  );
}
