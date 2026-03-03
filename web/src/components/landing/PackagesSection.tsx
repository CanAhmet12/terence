import Link from "next/link";
import { Check, Zap, Video, FileText, Crown } from "lucide-react";

const packages = [
  {
    name: "Free",
    subtitle: "Tanışma Paketi",
    price: "Ücretsiz",
    period: "",
    popular: false,
    features: [
      "Her dersten 1 ünite",
      "Günlük 10 soru",
      "1 deneme sınavı",
      "7 gün akıllı plan",
      "Hedef & net tahmin ekranı",
    ],
    cta: "Ücretsiz Başla",
    href: "/kayit",
    icon: Zap,
  },
  {
    name: "Bronze",
    subtitle: "Tüm Videolar",
    price: "99₺",
    period: "/ay",
    popular: false,
    features: [
      "Tüm konu anlatım videoları",
      "Hız ayarlı izleme",
      "PDF ders notları",
      "Sınırsız video erişimi",
    ],
    cta: "Bronze'a Geç",
    href: "/paketler",
    icon: Video,
  },
  {
    name: "Plus",
    subtitle: "Deneme + Soru Bankası",
    price: "199₺",
    period: "/ay",
    popular: true,
    features: [
      "Bronze paket dahil",
      "Sınırsız online deneme",
      "1M+ soru bankası",
      "Türkiye geneli sıralama",
      "Kazanım analiz raporu",
    ],
    cta: "Plus'a Geç",
    href: "/paketler",
    icon: FileText,
  },
  {
    name: "Pro",
    subtitle: "Canlı Ders + Koçluk",
    price: "349₺",
    period: "/ay",
    popular: false,
    features: [
      "Plus paket dahil",
      "Canlı ders katılımı",
      "Kişiye özel koçluk",
      "Öncelikli destek",
      "Haftalık rapor PDF",
      "Veli SMS bildirimleri",
    ],
    cta: "Pro'ya Geç",
    href: "/paketler",
    icon: Crown,
  },
];

export function PackagesSection() {
  return (
    <section id="paketler" className="py-24 lg:py-32 bg-slate-50/80 relative">
      <div className="absolute inset-0 pattern-dots opacity-15 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">
            Paketler
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
            Hedefine Uygun{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">
              Paket Seç
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            7 gün ücretsiz deneyerek başla. Hedefine ulaşmak için ihtiyacın olan paketi seç.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-2xl border-2 p-8 bg-white transition-all duration-300 ${
                pkg.popular
                  ? "border-teal-500 shadow-2xl shadow-teal-500/15 scale-[1.02] lg:scale-[1.03] ring-2 ring-teal-500/20"
                  : "border-slate-200 hover:border-teal-300 hover:shadow-xl"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm font-bold rounded-full shadow-lg shadow-teal-500/30">
                  En Popüler
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    pkg.popular ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <pkg.icon className="w-7 h-7" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">{pkg.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{pkg.subtitle}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-slate-900">{pkg.price}</span>
                {pkg.period && (
                  <span className="text-slate-500 font-medium">{pkg.period}</span>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-slate-600 text-[15px]">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={pkg.href}
                className={`block w-full py-4 text-center font-semibold rounded-xl transition-all duration-300 ${
                  pkg.popular
                    ? "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/35 hover:-translate-y-0.5"
                    : "border-2 border-slate-200 hover:border-teal-500 text-slate-700 hover:text-teal-600 hover:bg-teal-50/50"
                }`}
              >
                {pkg.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
