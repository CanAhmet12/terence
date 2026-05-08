"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { OnboardingGuard } from "@/components/auth/OnboardingGuard";

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Onboarding sayfasında sidebar gösterme
  if (pathname === "/ogrenci/onboarding") {
    return <>{children}</>;
  }

  const hideGlobalHeader = pathname === "/ogrenci/dersler" || pathname?.startsWith("/ogrenci/dersler/");

  return (
    <OnboardingGuard>
      <DashboardWrapper sidebar={<DashboardSidebar />} header={hideGlobalHeader ? null : <DashboardHeader />}>
        {children}
      </DashboardWrapper>
    </OnboardingGuard>
  );
}
