import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { AuthGuard } from "@/components/auth/AuthGuard";

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
