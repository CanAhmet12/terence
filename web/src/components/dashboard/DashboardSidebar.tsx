"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Target,
  Calendar,
  BookOpen,
  FileQuestion,
  Library,
  Video,
  BarChart3,
  Trophy,
  ChevronLeft,
  RefreshCw,
  Zap,
  UserCircle,
  Bot,
  MessageSquare,
  Bell,
  Users,
  ClipboardList,
  TrendingUp,
  Settings,
  GraduationCap,
  Heart,
  PieChart,
  Baby,
  Crown,
  Gem,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Navigasyon tanımları ───────────────────────────────────────────────────

const studentNavGroups = [
  {
    label: "ANA MENÜ",
    items: [
      { href: "/ogrenci", icon: LayoutDashboard, label: "Ana Panel", exact: true },
      { href: "/ogrenci/hedef", icon: Target, label: "Hedef & Net" },
      { href: "/ogrenci/plan", icon: Calendar, label: "Günlük Plan" },
      { href: "/ogrenci/dersler", icon: BookOpen, label: "Derslerim" },
      { href: "/ogrenci/video", icon: Video, label: "Video & PDF" },
      { href: "/ogrenci/soru-bankasi", icon: Library, label: "Soru Bankası" },
      { href: "/ogrenci/canli-ders", icon: GraduationCap, label: "Canlı Ders" },
    ],
  },
  {
    label: "GELİŞİM",
    items: [
      { href: "/ogrenci/deneme", icon: FileQuestion, label: "Denemeler" },
      { href: "/ogrenci/mini-test", icon: Zap, label: "Mini Test" },
      { href: "/ogrenci/zayif-kazanim", icon: RefreshCw, label: "Zayıf Kazanım" },
      { href: "/ogrenci/rapor", icon: BarChart3, label: "Performans" },
      { href: "/ogrenci/rozet", icon: Trophy, label: "Rozetler" },
      { href: "/ogrenci/koc", icon: Bot, label: "Dijital Koç", iconSrc: "/dijitalkocicon.png" },
    ],
  },
  {
    label: "İLETİŞİM",
    items: [
      { href: "/ogrenci/forum", icon: MessageSquare, label: "Forum" },
      { href: "/ogrenci/bildirimler", icon: Bell, label: "Bildirimler" },
    ],
  },
  {
    label: "HESAP",
    items: [
      { href: "/ogrenci/profil", icon: UserCircle, label: "Profil & Ayarlar" },
    ],
  },
];

const teacherNavGroups = [
  {
    label: "PANEL",
    items: [
      { href: "/ogretmen", icon: LayoutDashboard, label: "Ana Panel", exact: true },
      { href: "/ogretmen/dersler", icon: BookOpen, label: "Derslerim" },
      { href: "/ogretmen/icerik", icon: ClipboardList, label: "İçerik Yönetimi" },
    ],
  },
  {
    label: "ÖĞRENCİLER",
    items: [
      { href: "/ogretmen/siniflar", icon: Users, label: "Sınıflarım" },
      { href: "/ogretmen/analiz", icon: TrendingUp, label: "Analiz Merkezi" },
      { href: "/ogretmen/odev", icon: FileQuestion, label: "Ödev & Test" },
      { href: "/ogretmen/canli-ders", icon: GraduationCap, label: "Canlı Ders" }, // Bug fix: öğretmen doğru URL
    ],
  },
  {
    label: "İLETİŞİM",
    items: [
      { href: "/ogretmen/mesaj", icon: MessageSquare, label: "Mesajlar" },
      { href: "/ogretmen/bildirimler", icon: Bell, label: "Bildirimler" },
    ],
  },
  {
    label: "HESAP",
    items: [
      { href: "/ogretmen/profil", icon: UserCircle, label: "Profil & Ayarlar" },
    ],
  },
];

const parentNavGroups = [
  {
    label: "TAKİP",
    items: [
      { href: "/veli", icon: LayoutDashboard, label: "Ana Panel", exact: true },
      { href: "/veli/canli-dersler", icon: Video, label: "Canlı Dersler" },
      { href: "/veli/rapor", icon: PieChart, label: "Çocuğumun Raporu" },
      { href: "/veli/profil", icon: Baby, label: "Çocuk Profili" },
    ],
  },
  {
    label: "İLETİŞİM",
    items: [
      { href: "/veli/bildirim", icon: Settings, label: "Bildirim Ayarları" },
      { href: "/veli/bildirimler", icon: Bell, label: "Bildirimler" },
    ],
  },
  {
    label: "HESAP",
    items: [
      { href: "/profil", icon: UserCircle, label: "Profilim" },
    ],
  },
];

const adminNavGroups = [
  {
    label: "YÖNETİM",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Ana Panel", exact: true },
      { href: "/admin/kullanicilar", icon: Users, label: "Kullanıcılar" },
      { href: "/admin/ogretmen-onay", icon: GraduationCap, label: "Öğretmen Onayı" },
    ],
  },
  {
    label: "İÇERİK",
    items: [
      { href: "/admin/icerik-merkezi", icon: Layers, label: "İçerik merkezi" },
      { href: "/admin/sorular", icon: FileQuestion, label: "Soru Havuzu" },
      { href: "/admin/kupon", icon: Heart, label: "Kuponlar" },
    ],
  },
  {
    label: "RAPORLAR",
    items: [
      { href: "/admin/raporlar", icon: BarChart3, label: "Raporlar" },
    ],
  },
  {
    label: "HESAP",
    items: [
      { href: "/admin/ayarlar", icon: Settings, label: "Ayarlar" },
      { href: "/admin/profil", icon: UserCircle, label: "Profil" },
    ],
  },
];

// ─── Rol renk temaları ───────────────────────────────────────────────────────

const ROLE_THEMES = {
  teacher: {
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    label: "Öğretmen Paneli",
    activeItem: "bg-indigo-50 text-indigo-700",
    activeBorder: "border-l-2 border-indigo-500",
    activeIcon: "text-indigo-600",
    activeDot: "bg-indigo-500",
  },
  parent: {
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    label: "Veli Paneli",
    activeItem: "bg-purple-50 text-purple-700",
    activeBorder: "border-l-2 border-purple-500",
    activeIcon: "text-purple-600",
    activeDot: "bg-purple-500",
  },
  admin: {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    label: "Admin Paneli",
    activeItem: "bg-rose-50 text-rose-700",
    activeBorder: "border-l-2 border-rose-500",
    activeIcon: "text-rose-600",
    activeDot: "bg-rose-500",
  },
  student: {
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-800 border-violet-200",
    label: "Öğrenci Paneli",
    activeItem: "bg-violet-50 text-violet-900",
    activeBorder: "border-l-[3px] border-violet-600",
    activeIcon: "text-violet-600",
    activeDot: "bg-violet-500",
  },
} as const;

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = (user?.role ?? "student") as keyof typeof ROLE_THEMES;
  const theme = ROLE_THEMES[role] ?? ROLE_THEMES.student;
  const isTeacher = role === "teacher";
  const isFreePlan = !user?.subscription_plan || user.subscription_plan === "free";
  const isPro = !isFreePlan;

  const navGroups =
    role === "teacher" ? teacherNavGroups :
    role === "parent"  ? parentNavGroups :
    role === "admin"   ? adminNavGroups :
    studentNavGroups;

  const rootHref =
    role === "teacher" ? "/ogretmen" :
    role === "parent"  ? "/veli" :
    role === "admin"   ? "/admin" :
    "/ogrenci";

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-white">

      {/* ── Logo + Rol badge ── */}
      <div className="px-4 py-4 border-b border-slate-100">
        <Link href={rootHref} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200 shrink-0 group-hover:ring-indigo-300 transition-all">
            <Image
              src="/logo.png"
              alt="Terence"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-slate-900 text-[13px] tracking-tight leading-none">
              TERENCE <span className="text-indigo-600">EĞİTİM</span>
            </p>
            <div className={cn(
              "inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              theme.badge
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", theme.dot)} />
              {theme.label}
            </div>
          </div>
        </Link>
      </div>

      {/* ── Navigasyon ── */}
      <nav className="flex-1 px-3 py-4 lg:overflow-visible">
        {navGroups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && "mt-5")}>
            {/* Grup etiketi */}
            <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase px-3 mb-1.5">
              {group.label}
            </p>

            {/* Menü öğeleri */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = (item as { exact?: boolean }).exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                      isActive
                        ? cn(theme.activeItem, theme.activeBorder)
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {(item as { iconSrc?: string }).iconSrc ? (
                      <span className="relative flex h-[17px] w-[17px] shrink-0 items-center justify-center overflow-hidden rounded-md">
                        <Image
                          src={(item as { iconSrc?: string }).iconSrc!}
                          alt=""
                          width={17}
                          height={17}
                          className="object-contain object-center"
                          sizes="17px"
                        />
                      </span>
                    ) : (
                      <item.icon
                        className={cn(
                          "w-[17px] h-[17px] shrink-0 transition-colors",
                          isActive
                            ? theme.activeIcon
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    )}
                    <span className="truncate flex-1">{item.label}</span>
                    {isActive && (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          theme.activeDot
                        )}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Öğretmen: abonelik satışı yok ── */}
      {isTeacher && role !== "admin" && (
        <div className="px-3 pb-3">
          <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50/90 p-4">
            <p className="text-xs font-bold text-teal-900 leading-snug">Öğretmen hesabı</p>
            <p className="mt-1 text-[10px] leading-relaxed text-teal-800/90">
              Ders ve sınıf araçları için ek abonelik ücreti alınmaz. Ücretli paketler yalnızca öğrenci hesapları içindir.
            </p>
            <Link
              href="/ogretmen"
              className="mt-2.5 flex w-full items-center justify-center rounded-xl border border-teal-200 bg-white py-2 text-[11px] font-semibold text-teal-800 transition-colors hover:bg-teal-50"
            >
              Öğretmen paneli
            </Link>
          </div>
        </div>
      )}

      {/* ── Ücretsiz plan upsell (öğrenci / veli) ── */}
      {isFreePlan && role !== "admin" && !isTeacher && (
        <div className="px-3 pb-3">
          <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-indigo-50/80 to-purple-50 p-4">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-violet-300/20 blur-xl pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-2.5 flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-violet-100">
                  <Gem className="h-4 w-4 text-violet-600" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-bold leading-none text-slate-800">Ücretsiz Plan</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">Özellikler kısıtlı</p>
                </div>
              </div>
              <Link
                href="/paketler"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98]"
              >
                Tüm özellikleri keşfet!
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Pro plan badge (öğrenci / veli; öğretmende abonelik rozeti gösterme) ── */}
      {isPro && !isTeacher && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800 leading-none">
                {(user?.subscription_plan ?? "pro").toUpperCase()} Plan
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">Tüm özellikler aktif</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Siteye Dön ── */}
      <div className="px-3 pb-4 pt-2 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-sm font-medium transition-all group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform shrink-0" />
          Siteye Dön
        </Link>
      </div>
    </aside>
  );
}
