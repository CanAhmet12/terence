"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "7 gün ücretsiz denemede ne var?",
    a: "Her dersten 1 ünite, günlük 10 soru, 1 deneme sınavı, 7 gün akıllı plan ve hedef/net tahmin ekranına tam erişim. Kredi kartı gerekmez.",
  },
  {
    q: "Hedef motoru nasıl çalışır?",
    a: "Hedef sınav, okul ve bölümünü seçiyorsun. Sistem gerekli neti hesaplıyor. Kalan güne bölerek her 5 günde +1 net hedefi oluşturuyor.",
  },
  {
    q: "Veli takip nasıl yapılır?",
    a: "Veli panelinde çocuğunun çalışma süresi, deneme sonuçları ve net gelişim grafiklerini görebilirsin. Risk varsa SMS/e-posta bildirimi gider.",
  },
  {
    q: "Paket değiştirebilir miyim?",
    a: "Evet, istediğin zaman yükseltebilir veya düşürebilirsin. Ücretlendirme dönemsel yapılır.",
  },
  {
    q: "LGS, TYT, AYT, KPSS hepsinde var mı?",
    a: "Evet. Tüm sınav türlerinde MEB/ÖSYM kazanım yapısına uygun içerik, soru bankası ve deneme sınavları mevcuttur.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="sss" className="py-24 lg:py-32 bg-white relative">
      <div className="absolute inset-0 pattern-dots opacity-[0.05]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 mb-6">
            <HelpCircle className="w-7 h-7 text-teal-600" />
          </div>
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-4">
            SSS
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Sık Sorulan Sorular
          </h2>
          <p className="mt-4 text-slate-600">
            Merak ettiklerinize hızlı cevaplar
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-teal-200/60 transition-all duration-300"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors"
              >
                <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-teal-500 shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-100 mt-0 pt-4 animate-fade-in">
                  <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
