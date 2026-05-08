"use client";

import { HelpCircle } from "lucide-react";

export function StudentLiveHelpBanner() {
  return (
    <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
      <div className="flex flex-wrap items-start gap-3">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
        <div>
          <p className="font-semibold text-slate-800">Canlı ders nasıl çalışır?</p>
          <p className="mt-1 leading-relaxed">
            Ders saatinde veya 15 dakika öncesinde <strong>Derse Katıl</strong> ile odaya bağlanırsınız. Kamera ve mikrofon
            izinlerini tarayıcıda onaylamayı unutmayın. Sorun yaşarsanız sayfayı yenileyin veya farklı bir tarayıcı (Chrome
            önerilir) deneyin.
          </p>
        </div>
      </div>
    </div>
  );
}
