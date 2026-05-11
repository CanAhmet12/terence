"use client";

import Link from "next/link";
import { Clock, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OgretmenOnayBekleniyorPage() {
  const { user, logout } = useAuth();
  const rejected = user?.teacher_status === "rejected";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        {rejected ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ShieldAlert className="h-8 w-8" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Başvuru reddedildi</h1>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Öğretmen hesabınız yönetici tarafından onaylanmadı. Sorularınız için destek ekibiyle iletişime geçebilirsiniz.
            </p>
            {user?.rejection_reason ? (
              <p className="mt-4 text-sm text-slate-500 bg-slate-50 rounded-xl p-3">{user.rejection_reason}</p>
            ) : null}
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock className="h-8 w-8" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Onay bekleniyor</h1>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Öğretmen kaydınız alındı. Yönetici onayından sonra sınıf oluşturma, ders ve içerik özelliklerine erişebilirsiniz.
              Onaylanana kadar bu sayfadasınız; onaylandığında panele yönlendirileceksiniz.
            </p>
          </>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Çıkış yap
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
