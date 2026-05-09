"use client";

import Link from "next/link";
import Image from "next/image";
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
import { cn } from "@/lib/utils";

type PathMeta = { label: string; icon: React.ElementType; iconSrc?: string };

const PATH_MAP: Record<string, PathMeta> = {
  "/ogrenci": { label: "Ana Panel", icon: LayoutDashboard },
  "/ogrenci/hedef": { label: "Hedef & Net", icon: Target },
  "/ogrenci/plan": { label: "Günlük Plan", icon: Calendar },
  "/ogrenci/dersler": { label: "Derslerim", icon: BookOpen },
  "/ogrenci/deneme": { label: "Denemeler", icon: FileQuestion },
  "/ogrenci/soru-bankasi": { label: "Soru Bankası", icon: Library },
  "/ogrenci/canli-ders": { label: "Canlı Ders", icon: Video },
  "/ogrenci/mini-test": { label: "Mini Test", icon: Zap },
  "/ogrenci/video": { label: "Video & PDF", icon: Video },
  "/ogrenci/zayif-kazanim": { label: "Zayıf Kazanım", icon: RefreshCw },
  "/ogrenci/rapor": { label: "Performans", icon: BarChart3 },
  "/ogrenci/rozet": { label: "Rozetler", icon: Trophy },
  "/ogrenci/koc": { label: "Dijital Koç", icon: Bot, iconSrc: "/dijitalkocicon.png" },
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
    <Suspense fallback={<div className="sticky top-0 z-40 h-11 border-b border-slate-200 bg-white" />}>
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
  const isLiveLessons = pathname === "/ogrenci/canli-ders";
  const hasCenterSearch = isQuestionBank || isLiveLessons;

  const qFromUrl = hasCenterSearch ? (searchParams.get("q") ?? "") : "";

  const setHeaderSearchQuery = useCallback(
    (q: string) => {
      if (!hasCenterSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = q.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [hasCenterSearch, pathname, router, searchParams]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!hasCenterSearch) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasCenterSearch]);

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
  const coachIconSrc = currentPage.iconSrc;
  const accentIcon =
    hasCenterSearch ? "text-indigo-600" : "text-teal-600";
  const breadcrumbHover = hasCenterSearch ? "hover:text-indigo-600" : "hover:text-teal-600";

  const searchPlaceholder = isQuestionBank
    ? "Soru veya konu ara..."
    : "Ders veya konu ara...";
  const searchAria = isQuestionBank ? "Soru veya konu ara" : "Ders veya konu ara";

  return (
    <header
      className={`sticky top-0 z-40 border-b border-slate-200 bg-white ${
        hasCenterSearch ? "shadow-[0_1px_0_rgba(15,23,42,0.04)]" : "bg-white/95 backdrop-blur-xl"
      }`}
    >
      <div className="flex w-full flex-col gap-3 px-3 py-2.5 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3">
        <div
          className={cn(
            "grid w-full items-center gap-x-3 gap-y-2",
            /* Arama yokken 2 çocuk var; lg'de 3 sütun kullanırsak 2. çocuk orta (arama) sütununa düşer — sağda boşluk kalır */
            hasCenterSearch
              ? "grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,1fr)_minmax(220px,420px)_minmax(0,1fr)] lg:gap-x-6"
              : "grid-cols-[minmax(0,1fr)_auto]"
          )}
        >
          {/* Sol: breadcrumb */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 lg:justify-self-start">
            <Link
              href={dashboardHref}
              className={`flex shrink-0 items-center gap-1 text-slate-400 transition-colors ${breadcrumbHover}`}
            >
              <Home className="h-[15px] w-[15px] sm:h-4 sm:w-4" strokeWidth={2} />
              <span className="hidden text-[13px] font-medium sm:inline">Panel</span>
            </Link>
            {pathname !== dashboardHref && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
                <div className="flex min-w-0 items-center gap-1.5">
                  {!hasCenterSearch &&
                    (coachIconSrc ? (
                      <Image
                        src={coachIconSrc}
                        alt=""
                        width={16}
                        height={16}
                        className="h-3.5 w-3.5 shrink-0 object-contain sm:h-4 sm:w-4"
                        sizes="16px"
                      />
                    ) : (
                      <PageIcon className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${accentIcon}`} />
                    ))}
                  <span className="truncate text-[13px] font-semibold text-slate-800 sm:text-sm">
                    {currentPage.label}
                  </span>
                </div>
              </>
            )}
            {pathname === dashboardHref && (
              <div className="flex min-w-0 items-center gap-1.5 sm:hidden">
                {coachIconSrc ? (
                  <Image
                    src={coachIconSrc}
                    alt=""
                    width={16}
                    height={16}
                    className="h-3.5 w-3.5 shrink-0 object-contain sm:h-4 sm:w-4"
                    sizes="16px"
                  />
                ) : (
                  <PageIcon className={`h-3.5 w-3.5 shrink-0 ${accentIcon}`} />
                )}
                <span className="truncate text-[13px] font-semibold text-slate-800">{currentPage.label}</span>
              </div>
            )}
          </div>

          {/* Orta: arama (masaüstü — içerik genişliği ile hizalı) */}
          {hasCenterSearch && (
            <div className="relative hidden min-w-0 w-full lg:block lg:justify-self-center">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                ref={searchInputRef}
                type="search"
                value={qFromUrl}
                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-full border border-slate-200 bg-slate-50/90 py-2 pl-10 pr-[4.25rem] text-[13px] text-slate-900 shadow-inner outline-none ring-indigo-500/0 transition-[box-shadow,border-color] placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                aria-label={searchAria}
                autoComplete="off"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded-md border border-slate-200/90 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 sm:inline-block">
                Ctrl+K
              </kbd>
            </div>
          )}

          {/* Sağ: bildirim + profil — ana içerik ile aynı tam genişlikte sağ kenara hizalı */}
          <div className="flex min-w-0 shrink-0 items-center justify-end justify-self-end lg:min-w-0">
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

        {/* Mobil / küçük ekran: arama tam genişlik */}
        {hasCenterSearch && (
          <div className="relative lg:hidden">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={qFromUrl}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-[13px] outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
              aria-label={searchAria}
              autoComplete="off"
            />
          </div>
        )}
      </div>
    </header>
  );
}
