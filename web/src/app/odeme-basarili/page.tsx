"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

function OdemeBasariliContent() {
  const { token, updateUser, user } = useAuth();
  const params = useSearchParams();
  const plan = params.get("plan") ?? "plus";
  const [verified, setVerified] = useState(false);

  // Ödeme başarılıysa kullanıcı profilini güncelle
  useEffect(() => {
    if (!token) return;
    api.getMe(token)
      .then((updatedUser) => { updateUser(updatedUser); setVerified(true); })
      .catch(() => setVerified(true));
  }, [token, updateUser]);

  const planLabels: Record<string, string> = {
    free: "Free",
    bronze: "Bronze",
    plus: "Plus",
    pro: "Pro",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Animasyonlu onay ikonu */}
        <div className="relative mb-8 inline-block">
          <div className="w-28 h-28 rounded-full bg-teal-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-14 h-14 text-teal-600" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
          Ödeme Başarılı! 🎉
        </h1>
        <p className="text-lg text-slate-600 mb-2">
          <span className="font-bold text-teal-600">{planLabels[plan] ?? plan} Paketi</span>{" "}
          aboneliğin aktif edildi.
        </p>
        <p className="text-slate-500 mb-10">
          Hesabın anında güncellendi. Tüm içeriklere erişim sağlandı.
        </p>

        {/* Özellikler */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 text-left">
          <h3 className="font-bold text-slate-900 mb-4 text-center">Artık erişebileceklerin</h3>
          <ul className="space-y-3">
            {[
              plan === "bronze" && "Tüm konu anlatım videoları ve PDF notlar",
              (plan === "plus" || plan === "pro") && "Sınırsız online deneme sınavı",
              (plan === "plus" || plan === "pro") && "1M+ soru bankası + kazanım analizi",
              plan === "pro" && "Canlı ders katılımı ve koçluk",
              plan === "pro" && "Veli SMS bildirimleri",
            ].filter(Boolean).map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" strokeWidth={2} />
                {f}
              </li>
            ))}
            <li className="flex items-center gap-3 text-slate-700">
              <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" strokeWidth={2} />
              Akıllı günlük çalışma planı
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={user?.role === "teacher" ? "/ogretmen" : "/ogrenci"}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-teal-500/25"
          >
            <GraduationCap className="w-5 h-5" />
            Panele Git
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/ogrenci/video"
            className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-600 font-bold rounded-2xl transition-colors"
          >
            Hemen İzlemeye Başla
          </Link>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Fatura ve abonelik bilgilerin{" "}
          <Link href="/profil" className="text-teal-600 hover:underline">
            profil sayfanda
          </Link>{" "}
          görünür.
        </p>
      </div>
    </div>
  );
}

export default function OdemeBasariliPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <OdemeBasariliContent />
    </Suspense>
  );
}
