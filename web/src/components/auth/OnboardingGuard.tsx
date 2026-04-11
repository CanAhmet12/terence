"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Öğrencinin grade bilgisi yoksa onboarding sayfasına yönlendirir.
 * - Onboarding sayfasının kendisinde çalışmaz
 * - Auth yüklenene kadar bekler
 * - Bir kere yönlendirdikten sonra tekrar yönlendirmez
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Auth yüklenene kadar bekle
    if (loading) return;
    // Kullanıcı yoksa AuthGuard halleder
    if (!user) return;
    // Onboarding sayfasındaysa döngüye girme
    if (pathname === "/ogrenci/onboarding") return;
    // Zaten yönlendirildiyse tekrar yönlendirme
    if (hasRedirected.current) return;

    // grade yoksa veya null/undefined ise onboarding'e yönlendir
    const gradeValue = user.grade;
    const hasGrade = gradeValue !== null && gradeValue !== undefined && gradeValue !== "";

    if (!hasGrade) {
      hasRedirected.current = true;
      router.push("/ogrenci/onboarding");
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
