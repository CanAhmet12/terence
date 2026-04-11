import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { StudentShell } from "@/components/StudentShell";

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
      <StudentShell>
        {children}
      </StudentShell>
    </AuthGuard>
  );
}
