"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  GraduationCap,
  ChevronLeft,
  RefreshCw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/ogrenci", icon: LayoutDashboard, label: "Ana Panel" },
  { href: "/ogrenci/hedef", icon: Target, label: "Hedef & Net" },
  { href: "/ogrenci/plan", icon: Calendar, label: "Günlük Plan" },
  { href: "/ogrenci/dersler", icon: BookOpen, label: "Derslerim" },
  { href: "/ogrenci/deneme", icon: FileQuestion, label: "Denemeler" },
  { href: "/ogrenci/soru-bankasi", icon: Library, label: "Soru Bankası" },
  { href: "/ogrenci/mini-test", icon: Zap, label: "Mini Test" },
  { href: "/ogrenci/video", icon: Video, label: "Video & PDF" },
  { href: "/ogrenci/zayif-kazanım", icon: RefreshCw, label: "Zayıf Kazanım" },
  { href: "/ogrenci/rapor", icon: BarChart3, label: "Performans" },
  { href: "/ogrenci/rozet", icon: Trophy, label: "Rozetler" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200/80 flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow">
            <GraduationCap className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">
            TERENCE <span className="text-teal-600">EĞİTİM</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {studentNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-100/80 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50/50 rounded-xl text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Siteye Dön
        </Link>
      </div>
    </aside>
  );
}
