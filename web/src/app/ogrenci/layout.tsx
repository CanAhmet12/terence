import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { AuthGuard } from "@/components/auth/AuthGuard";

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
