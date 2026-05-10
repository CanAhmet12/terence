"use client";

import { usePathname } from "next/navigation";
import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { AuthGuard } from "@/components/auth/AuthGuard";

export function TeacherLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pendingOnly = pathname.startsWith("/ogretmen/onay-bekleniyor");

  return (
    <AuthGuard role="teacher">
      {pendingOnly ? (
        <div className="min-h-screen bg-slate-50">{children}</div>
      ) : (
        <DashboardWrapper sidebar={<TeacherSidebar />} header={<DashboardHeader />}>
          {children}
        </DashboardWrapper>
      )}
    </AuthGuard>
  );
}
