"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Role = "student" | "teacher" | "admin" | "parent" | "any";

const REDIRECT_COUNTER_KEY = "auth_redirect_count";
const MAX_REDIRECTS = 3;

export function AuthGuard({
  children,
  role = "any",
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    
    // Check redirect loop
    const redirectCount = parseInt(sessionStorage.getItem(REDIRECT_COUNTER_KEY) || "0", 10);
    if (redirectCount >= MAX_REDIRECTS) {
      console.error("Redirect loop detected");
      sessionStorage.removeItem(REDIRECT_COUNTER_KEY);
      // Show error page instead of continuing redirect loop
      if (pathname !== "/giris") {
        router.replace("/giris?error=redirect_loop");
      }
      return;
    }
    
    if (!user) {
      // Don't redirect if already on login page
      if (pathname !== "/giris") {
        sessionStorage.setItem(REDIRECT_COUNTER_KEY, (redirectCount + 1).toString());
        router.replace("/giris");
      }
      return;
    }
    
    if (role !== "any" && user.role !== role) {
      // Don't redirect if already on correct dashboard
      const targetPath = 
        user.role === "admin" ? "/admin" :
        user.role === "teacher" ? "/ogretmen" :
        user.role === "parent" ? "/veli" : "/ogrenci";
        
      if (pathname !== targetPath && !pathname.startsWith(targetPath + "/")) {
        sessionStorage.setItem(REDIRECT_COUNTER_KEY, (redirectCount + 1).toString());
        router.replace(targetPath);
      }
    } else {
      // Successful page load - clear redirect counter
      sessionStorage.removeItem(REDIRECT_COUNTER_KEY);
    }
  }, [user, loading, role, router, pathname]);

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
