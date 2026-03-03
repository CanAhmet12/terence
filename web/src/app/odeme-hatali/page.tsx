"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw, MessageSquare, ArrowLeft } from "lucide-react";

const ERROR_MESSAGES: Record<string, { title: string; desc: string }> = {
  cancelled: {
    title: "Ödeme İptal Edildi",
    desc: "Ödeme işlemini tamamlamadan çıktın. Dilediğin zaman tekrar deneyebilirsin.",
  },
  failed: {
    title: "Ödeme Başarısız",
    desc: "Kart bilgilerini veya bakiyeni kontrol et. Sorun devam ederse bankanla iletişime geç.",
  },
  timeout: {
    title: "İşlem Zaman Aşımına Uğradı",
    desc: "Bağlantı zaman aşımına uğradı. Lütfen tekrar dene.",
  },
};

function OdemeHataliContent() {
  const params = useSearchParams();
  const errCode = params.get("error") ?? "failed";
  const plan = params.get("plan") ?? "";

  const errorInfo = ERROR_MESSAGES[errCode] ?? ERROR_MESSAGES.failed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="w-28 h-28 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-14 h-14 text-red-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">{errorInfo.title}</h1>
        <p className="text-slate-600 mb-10 max-w-sm mx-auto leading-relaxed">{errorInfo.desc}</p>

        {/* Sık sorulan nedenleri */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 text-left">
          <h3 className="font-bold text-slate-900 mb-4">Olası Nedenler</h3>
          <ul className="space-y-2.5 text-sm text-slate-600">
            {[
              "Kart limiti yetersiz olabilir",
              "İnternet bağlantısı kesilmiş olabilir",
              "Kart bilgileri hatalı girilmiş olabilir",
              "Banka 3D Secure doğrulaması başarısız olmuş olabilir",
            ].map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={plan ? `/paketler?plan=${plan}` : "/paketler"}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-teal-500/25"
          >
            <RefreshCw className="w-5 h-5" />
            Tekrar Dene
          </Link>
          <Link
            href="/iletisim"
            className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-2xl transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Destek Al
          </Link>
        </div>

        <Link
          href="/paketler"
          className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Paketlere dön
        </Link>
      </div>
    </div>
  );
}

export default function OdemeHataliPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <OdemeHataliContent />
    </Suspense>
  );
}
