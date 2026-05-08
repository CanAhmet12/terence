"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  Search,
} from "lucide-react";
import { useCallback, useEffect, useRef, Suspense } from "react";

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
  return (
    <Suspense fallback={<div className="sticky top-0 z-40 h-[52px] border-b border-slate-200/60 bg-white/90 backdrop-blur-xl" />}>
      <DashboardHeaderInner />
    </Suspense>
  );
}

function DashboardHeaderInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isQuestionBank = pathname === "/ogrenci/soru-bankasi";
  const qFromUrl = isQuestionBank ? (searchParams.get("q") ?? "") : "";

  const setBankQuery = useCallback(
    (q: string) => {
      if (!isQuestionBank) return;
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = q.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [isQuestionBank, pathname, router, searchParams]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isQuestionBank) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isQuestionBank]);

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
  const accentIcon = isQuestionBank ? "text-indigo-600" : "text-teal-600";
  const breadcrumbHover = isQuestionBank ? "hover:text-indigo-600" : "hover:text-teal-600";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 px-4 py-3.5 backdrop-blur-xl lg:px-8">
      <div
        className={`flex items-center gap-3 ${isQuestionBank ? "justify-between" : "justify-between"}`}
      >
        <div className="flex min-w-0 shrink-0 items-center gap-2 lg:max-w-[min(280px,36vw)]">
          <Link
            href={dashboardHref}
            className={`hidden shrink-0 items-center gap-1.5 text-slate-400 transition-colors sm:flex ${breadcrumbHover}`}
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">Panel</span>
          </Link>
          {pathname !== dashboardHref && (
            <>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 sm:block" />
              <div className="flex min-w-0 items-center gap-1.5">
                <PageIcon className={`h-4 w-4 shrink-0 ${accentIcon}`} />
                <span className="truncate text-sm font-semibold text-slate-800">{currentPage.label}</span>
              </div>
            </>
          )}
          {pathname === dashboardHref && (
            <div className="flex items-center gap-1.5 sm:hidden">
              <PageIcon className={`h-4 w-4 shrink-0 ${accentIcon}`} />
              <span className="text-sm font-semibold text-slate-800">{currentPage.label}</span>
            </div>
          )}
        </div>

        {isQuestionBank && (
          <div className="mx-2 hidden min-w-0 flex-1 justify-center md:flex">
            <div className="relative w-full max-w-xl">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                ref={searchInputRef}
                type="search"
                value={qFromUrl}
                onChange={(e) => setBankQuery(e.target.value)}
                placeholder="Soru veya konu ara..."
                className="w-full rounded-full border border-slate-200/90 bg-slate-50/90 py-2.5 pl-10 pr-[4.5rem] text-sm text-slate-900 shadow-inner outline-none ring-indigo-500/0 transition-[box-shadow,border-color] placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                aria-label="Soru veya konu ara"
                autoComplete="off"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 sm:inline-block">
                Ctrl+K
              </kbd>
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <HeaderUserMenu
            profileSubtext={
              user.role === "student" &&
              user.grade != null &&
              String(user.grade).trim() !== ""
                ? `${String(user.grade)}. Sınıf`
                : undefined
            }
          />
        </div>
      </div>

      {isQuestionBank && (
        <div className="mt-3 border-t border-slate-100 pt-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={qFromUrl}
              onChange={(e) => setBankQuery(e.target.value)}
              placeholder="Soru veya konu ara..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Soru veya konu ara"
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </header>
  );
}
