"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Öğrencinin grade bilgisi yoksa onboarding sayfasına yönlendirir.
 * Onboarding sayfasının kendisinde bu guard çalışmaz.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (pathname === "/ogrenci/onboarding") return;

    // grade yoksa onboarding'e yönlendir
    if (!user.grade) {
      router.push("/ogrenci/onboarding");
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
