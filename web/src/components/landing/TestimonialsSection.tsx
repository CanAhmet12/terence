import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Hedef motoru sayesinde her gün ne yapacağımı biliyorum. Netim 42'den 58'e çıktı. Boğaziçi hedefime çok yaklaştım.",
    name: "Elif K.",
    role: "TYT Hazırlık Öğrencisi",
    avatar: "EK",
  },
  {
    quote: "Veli paneli mükemmel. Çocuğumun çalışma süresini, deneme sonuçlarını ve zayıf konuları görebiliyorum. Artık destek verirken nereye odaklanacağımı biliyorum.",
    name: "Ahmet Y.",
    role: "Veli",
    avatar: "AY",
  },
  {
    quote: "Sınıfımda riskteki öğrencileri hemen tespit edip veliye bildirim gönderebiliyorum. Başarı tahmin paneli gerçekten işe yarıyor.",
    name: "Zeynep Ö.",
    role: "Matematik Öğretmeni",
    avatar: "ZÖ",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white relative">
      <div className="absolute inset-0 pattern-dots opacity-[0.06]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">
            Öğrenci & Veli Yorumları
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
            Binlerce Kişi{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">
              Hedefine Ulaştı
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative p-8 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-200/80 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-teal-200" />
              <p className="text-slate-700 leading-relaxed mb-6 relative z-10">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
