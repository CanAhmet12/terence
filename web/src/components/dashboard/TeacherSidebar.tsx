"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const teacherNavGroups = [
  {
    label: "DERS YÖNETİMİ",
    items: [
      { href: "/ogretmen", icon: LayoutDashboard, label: "Ana Panel" },
      { href: "/ogretmen/dersler", icon: BookOpen, label: "Derslerim" },
      { href: "/ogretmen/siniflar", icon: Users, label: "Sınıflarım" },
      { href: "/ogretmen/canli-ders", icon: Video, label: "Canlı Ders" },
    ],
  },
  {
    label: "İÇERİK & ÖDEV",
    items: [
      { href: "/ogretmen/icerik", icon: Upload, label: "İçerik Yükleme" },
      { href: "/ogretmen/odev", icon: FileQuestion, label: "Ödev & Test" },
    ],
  },
  {
    label: "ANALİZ & İLETİŞİM",
    items: [
      { href: "/ogretmen/analiz", icon: BarChart3, label: "Analiz Merkezi" },
      { href: "/ogretmen/mesaj", icon: MessageSquare, label: "Mesaj & Duyuru" },
      { href: "/bildirimler", icon: Bell, label: "Bildirimler" },
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
  const { user } = useAuth();

  const isFreePlan = !user?.subscription_plan || user.subscription_plan === "free";

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

      {isFreePlan && (
        <div className="px-3 pb-3">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <span className="text-xs font-bold text-teal-800">Ücretsiz Plan</span>
            </div>
            <p className="text-[11px] text-teal-700 mb-2 leading-relaxed">
              AI soru üretimi ve gelişmiş analitik için yükseltin.
            </p>
            <Link
              href="/paketler"
              className="block w-full text-center text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 rounded-lg py-2 transition-all"
            >
              Pro&apos;ya Geç →
            </Link>
          </div>
        </div>
      )}

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
