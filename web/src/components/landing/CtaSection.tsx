import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const benefits = [
  "7 gün ücretsiz deneme",
  "Kredi kartı gerekmez",
  "İstediğin zaman iptal et",
  "1M+ soru bankasına erişim",
];

export function CtaSection() {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-transparent to-slate-900/20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                Hedefine Doğru İlk Adımı At
              </h2>
              <p className="mt-4 text-lg text-white/90 max-w-xl">
                Binlerce öğrenci gibi sen de 7 gün ücretsiz deneyerek başla.
              </p>
              <ul className="mt-6 flex flex-wrap justify-center lg:justify-start gap-4">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-white/95 text-sm font-medium">
                    <Check className="w-5 h-5 text-teal-300 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/kayit"
              className="shrink-0 inline-flex items-center gap-2 px-10 py-4 bg-white text-teal-700 font-bold rounded-2xl hover:bg-slate-50 transition-all duration-300 shadow-2xl shadow-black/20 hover:shadow-xl hover:-translate-y-1"
            >
              7 Gün Ücretsiz Başla
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
