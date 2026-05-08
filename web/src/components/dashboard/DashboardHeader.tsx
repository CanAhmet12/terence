"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { HeaderUserMenu } from "@/components/dashboard/HeaderUserMenu";
import {
  Target,
  Calendar,
  BookOpen,
  FileQuestion,
  Library,
  Video,
  BarChart3,
  Trophy,
  Zap,
  Bot,
  MessageSquare,
  Users,
  Upload,
  UserCircle,
  Settings,
  Home,
  RefreshCw,
  ChevronRight,
  LayoutDashboard,
  Bell,
} from "lucide-react";

const PATH_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  "/ogrenci": { label: "Ana Panel", icon: LayoutDashboard },
  "/ogrenci/hedef": { label: "Hedef & Net", icon: Target },
  "/ogrenci/plan": { label: "Günlük Plan", icon: Calendar },
  "/ogrenci/dersler": { label: "Derslerim", icon: BookOpen },
  "/ogrenci/deneme": { label: "Denemeler", icon: FileQuestion },
  "/ogrenci/soru-bankasi": { label: "Soru Bankası", icon: Library },
  "/ogrenci/mini-test": { label: "Mini Test", icon: Zap },
  "/ogrenci/video": { label: "Video & PDF", icon: Video },
  "/ogrenci/zayif-kazanim": { label: "Zayıf Kazanım", icon: RefreshCw },
  "/ogrenci/rapor": { label: "Performans", icon: BarChart3 },
  "/ogrenci/rozet": { label: "Rozetler", icon: Trophy },
  "/ogrenci/koc": { label: "Dijital Koç", icon: Bot },
  "/ogrenci/forum": { label: "Forum", icon: MessageSquare },
  "/ogrenci/bildirimler": { label: "Bildirimler", icon: Bell },
  "/ogrenci/profil": { label: "Profil & Ayarlar", icon: UserCircle },
  "/ogretmen": { label: "Ana Panel", icon: LayoutDashboard },
  "/ogretmen/dersler": { label: "Derslerim", icon: BookOpen },
  "/ogretmen/icerik": { label: "İçerik Yükleme", icon: Upload },
  "/ogretmen/canli-ders": { label: "Canlı Ders", icon: Video },
  "/ogretmen/siniflar": { label: "Sınıflarım", icon: Users },
  "/ogretmen/odev": { label: "Ödev & Test", icon: FileQuestion },
  "/ogretmen/analiz": { label: "Analiz Merkezi", icon: BarChart3 },
  "/ogretmen/mesaj": { label: "Mesaj & Duyuru", icon: MessageSquare },
  "/ogretmen/bildirimler": { label: "Bildirimler", icon: Bell },
  "/ogretmen/profil": { label: "Profil & Ayarlar", icon: UserCircle },
  "/veli": { label: "Çocuklarım", icon: Users },
  "/veli/rapor": { label: "Raporlar", icon: BarChart3 },
  "/veli/bildirim": { label: "Bildirim Ayarları", icon: Settings },
  "/veli/bildirimler": { label: "Bildirimler", icon: Bell },
  "/admin": { label: "Admin Paneli", icon: LayoutDashboard },
  "/admin/kullanicilar": { label: "Kullanıcılar", icon: Users },
  "/admin/icerik": { label: "İçerik Yönetimi", icon: Upload },
  "/admin/raporlar": { label: "Raporlar", icon: BarChart3 },
  "/admin/ayarlar": { label: "Sistem Ayarları", icon: Settings },
  "/admin/ogretmen-onay": { label: "Öğretmen Onay", icon: Users },
  "/admin/kupon": { label: "Kuponlar", icon: FileQuestion },
  "/admin/bildirimler": { label: "Bildirimler", icon: Bell },
  "/bildirimler": { label: "Bildirimler", icon: Bell },
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const dashboardHref =
    user.role === "admin"
      ? "/admin"
      : user.role === "teacher"
        ? "/ogretmen"
        : user.role === "parent"
          ? "/veli"
          : "/ogrenci";

  const currentPage =
    PATH_MAP[pathname] ||
    Object.entries(PATH_MAP).find(([key]) => pathname.startsWith(key + "/"))?.[1] ||
    ({ label: "Panel", icon: Home } as const);
  const PageIcon = currentPage.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 px-4 py-3.5 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={dashboardHref}
            className="hidden shrink-0 items-center gap-1.5 text-slate-400 transition-colors hover:text-teal-600 sm:flex"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">Panel</span>
          </Link>
          {pathname !== dashboardHref && (
            <>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 sm:block" />
              <div className="flex min-w-0 items-center gap-1.5">
                <PageIcon className="h-4 w-4 shrink-0 text-teal-600" />
                <span className="truncate text-sm font-semibold text-slate-800">{currentPage.label}</span>
              </div>
            </>
          )}
          {pathname === dashboardHref && (
            <div className="flex items-center gap-1.5 sm:hidden">
              <PageIcon className="h-4 w-4 shrink-0 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">{currentPage.label}</span>
            </div>
          )}
        </div>

        <HeaderUserMenu />
      </div>
    </header>
  );
}
