"use client";

import { cn } from "@/lib/utils";
import type { Icon } from "@phosphor-icons/react";

type SidebarMenuIconProps = {
  icon: Icon;
  className?: string;
  active?: boolean;
  /** px — sidebar satırıyla uyumlu */
  size?: number;
};

/** Yan menü: Phosphor duotone / seçiliyken fill — daha dolgun “uygulama” ikonları */
export function SidebarMenuIcon({
  icon: IconComponent,
  className,
  active = false,
  size = 18,
}: SidebarMenuIconProps) {
  return (
    <IconComponent
      className={cn("shrink-0", className)}
      size={size}
      weight={active ? "fill" : "duotone"}
      aria-hidden
    />
  );
}
