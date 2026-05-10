import Link from "next/link";
import { Construction } from "lucide-react";

export default function BakimPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 px-6 py-16 text-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Construction className="h-9 w-9" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Bakımdayız</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Platform şu anda planlı bakımda. Kısa süre içinde tekrar hizmetinizde olacağız. Anlayışınız için teşekkürler.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Yöneticiyseniz giriş yaparak panelden işlemlerinize devam edebilirsiniz.
        </p>
        <Link
          href="/giris"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}
