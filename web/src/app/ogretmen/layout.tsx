import type { Metadata } from "next";
import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Öğretmen Paneli",
  description: "Terence Eğitim öğretmen paneli — sınıf yönetimi, canlı ders, ödev atama ve içerik yükleme.",
  robots: { index: false, follow: false },
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="teacher">
      <DashboardWrapper
        sidebar={<TeacherSidebar />}
        header={<DashboardHeader />}
      >
        {children}
      </DashboardWrapper>
    </AuthGuard>
  );
}
