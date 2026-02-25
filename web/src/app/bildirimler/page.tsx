"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Bell, ArrowLeft, Clock, FileCheck, AlertTriangle, Check } from "lucide-react";

const mockNotifications = [
  { id: 1, tip: "calisma", title: "Çalışma Hatırlatması", body: "Bugün 2 saat çalışma hedefin var. 45 dk tamamladın, devam et!", time: "1 saat önce", read: false },
  { id: 2, tip: "calisma", title: "Günlük görevlerin bekliyor", body: "3 görev kaldı: M.8.1.1 tekrar, Fizik video, TYT deneme", time: "3 saat önce", read: false },
  { id: 3, tip: "deneme", title: "Deneme Uyarısı", body: "Bu hafta TYT Deneme 2'yi çözmen gerekiyor. Son tarih: Cuma", time: "5 saat önce", read: false },
  { id: 4, tip: "hedef", title: "Hedef Risk Uyarısı", body: "Bu hızla devam edersen hedef bölüm risk altında. Pro pakete geçersen net artış ihtimalin %43 artar.", time: "1 gün önce", read: true },
  { id: 5, tip: "deneme", title: "Deneme sonucun hazır", body: "TYT Deneme 1 - 42 net, Türkiye #12.500", time: "2 gün önce", read: true },
];

function getGeriLink(role: string | undefined) {
  if (role === "student") return "/ogrenci";
  if (role === "teacher") return "/ogretmen";
  if (role === "parent") return "/veli";
  if (role === "admin") return "/admin";
  return "/";
}

export default function BildirimlerPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    router.replace("/giris");
    return null;
  }

  const tipConfig = (tip: string) => {
    if (tip === "calisma") return { icon: Clock, bg: "bg-teal-50", border: "border-teal-100", iconColor: "text-teal-600", label: "Çalışma" };
    if (tip === "deneme") return { icon: FileCheck, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-600", label: "Deneme" };
    if (tip === "hedef") return { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-100", iconColor: "text-red-600", label: "Hedef Risk" };
    return { icon: Bell, bg: "bg-slate-50", border: "border-slate-100", iconColor: "text-slate-500", label: "Genel" };
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-slate-50/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link
            href={getGeriLink(user.role)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri dön
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-teal-600" />
              </div>
              Bildirimler
            </h1>
            <p className="text-slate-600 mt-2">
              Çalışma hatırlatmaları, deneme uyarıları, hedef risk bildirimleri
            </p>
            {unreadCount > 0 && (
              <p className="mt-2 text-sm font-semibold text-teal-600">
                {unreadCount} okunmamış bildirim
              </p>
            )}
          </div>

          <div className="space-y-3">
            {mockNotifications.map((n) => {
              const config = tipConfig(n.tip);
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 ${
                    n.read
                      ? "bg-white border-slate-200/80 hover:border-slate-300"
                      : `bg-white border-teal-200/60 shadow-sm ${n.tip === "hedef" ? "border-l-4 border-l-red-400" : ""}`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bg} ${config.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {config.label}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                        )}
                      </div>
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">{n.time}</p>
                    </div>
                    {!n.read && (
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-teal-600" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
