import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Öğrenci Paneli",
  description: "Terence Eğitim öğrenci paneli — günlük plan, dersler, soru bankası, denemeler ve performans raporları.",
  robots: { index: false, follow: false },
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="student">
      <DashboardWrapper
        sidebar={<DashboardSidebar />}
        header={<DashboardHeader />}
      >
        {children}
      </DashboardWrapper>
    </AuthGuard>
  );
}
