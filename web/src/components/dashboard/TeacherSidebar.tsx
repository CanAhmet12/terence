"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileQuestion,
  BarChart3,
  MessageSquare,
  Upload,
  Video,
  ChevronLeft,
  UserCircle,
  Bell,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const teacherNavGroups = [
  {
    label: "DERS YÖNETİMİ",
    items: [
      { href: "/ogretmen", icon: LayoutDashboard, label: "Ana Panel" },
      { href: "/ogretmen/dersler", icon: BookOpen, label: "Derslerim" },
      { href: "/ogretmen/siniflar", icon: Users, label: "Sınıflarım" },
      { href: "/ogretmen/plan-atama", icon: CalendarDays, label: "Günlük plan" },
      { href: "/ogretmen/canli-ders", icon: Video, label: "Canlı Ders" },
    ],
  },
  {
    label: "İÇERİK & ÖDEV",
    items: [
      { href: "/ogretmen/icerik", icon: Upload, label: "Müfredat medyası" },
      { href: "/ogretmen/odev", icon: FileQuestion, label: "Ödev & Test" },
    ],
  },
  {
    label: "ANALİZ & İLETİŞİM",
    items: [
      { href: "/ogretmen/analiz", icon: BarChart3, label: "Analiz Merkezi" },
      { href: "/ogretmen/mesaj", icon: MessageSquare, label: "Mesaj & Duyuru" },
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

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200/80 flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md">
            <Image src="/logo.png" alt="Terence Eğitim" width={40} height={40} />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-sm">
            TERENCE <span className="text-teal-600">EĞİTİM</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {teacherNavGroups.map((group, gi) => (
          <div key={group.label} className={cn("mb-1", gi > 0 && "pt-2 mt-1 border-t border-slate-100")}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 py-1.5 mb-0.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/ogretmen" && pathname.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm",
                      isActive
                        ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-100/80 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-2">
        <p className="text-center text-[10px] leading-relaxed text-slate-500">
          Öğretmen hesapları için ek abonelik yok; tüm öğretmen araçları hesabınıza dahildir.
        </p>
      </div>

      <div className="p-3 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50/50 rounded-xl text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Siteye Dön
        </Link>
      </div>
    </aside>
  );
}
