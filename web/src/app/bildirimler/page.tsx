"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function notificationsPathForRole(role: string | undefined): string {
  switch (role) {
    case "teacher":
      return "/ogretmen/bildirimler";
    case "parent":
      return "/veli/bildirimler";
    case "admin":
      return "/admin/bildirimler";
    case "student":
    default:
      return "/ogrenci/bildirimler";
  }
}

export default function BildirimlerRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/giris");
      return;
    }
    router.replace(notificationsPathForRole(user.role));
  }, [user, loading, router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm">
      Yönlendiriliyor…
    </div>
  );
}
