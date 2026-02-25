"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Role = "student" | "teacher" | "admin" | "parent" | "any";

export function AuthGuard({
  children,
  role = "any",
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/giris");
      return;
    }
    if (role !== "any" && user.role !== role) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "teacher") router.replace("/ogretmen");
      else if (user.role === "parent") router.replace("/veli");
      else router.replace("/ogrenci");
    }
  }, [user, loading, role, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;
  if (role !== "any" && user.role !== role) return null;

  return <>{children}</>;
}
