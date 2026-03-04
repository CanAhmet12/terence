"use client";

import { useState, useEffect, useCallback } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote: "Hedef motoru sayesinde her gün ne yapacağımı biliyorum. Netim 42'den 58'e çıktı. Boğaziçi hedefime çok yaklaştım.",
    name: "Elif K.",
    role: "TYT Hazırlık Öğrencisi",
    badge: "TYT 2024 — +16 Net Artışı",
    avatar: "EK",
    rating: 5,
    color: "from-teal-400 to-emerald-500",
  },
  {
    quote: "Veli paneli mükemmel. Çocuğumun çalışma süresini, deneme sonuçlarını ve zayıf konuları görebiliyorum. Artık destek verirken nereye odaklanacağımı biliyorum.",
    name: "Ahmet Y.",
    role: "Veli",
    badge: "Veli Kullanıcısı",
    avatar: "AY",
    rating: 5,
    color: "from-blue-400 to-indigo-500",
  },
  {
    quote: "Sınıfımda riskteki öğrencileri hemen tespit edip veliye bildirim gönderebiliyorum. Başarı tahmin paneli gerçekten işe yarıyor.",
    name: "Zeynep Ö.",
    role: "Matematik Öğretmeni",
    badge: "Öğretmen Kullanıcısı",
    avatar: "ZÖ",
    rating: 5,
    color: "from-purple-400 to-violet-500",
  },
  {
    quote: "AI koç özelliği gerçekten fark yaratıyor. Zayıf kazanımlarım otomatik tespit edildi ve bana özel test oluşturuldu. LGS'de 487 net yaptım!",
    name: "Berk T.",
    role: "LGS Öğrencisi",
    badge: "LGS 2024 — 487 Net",
    avatar: "BT",
    rating: 5,
    color: "from-amber-400 to-orange-500",
  },
];

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => setActive((a) => (a + 1) % testimonials.length), []);
  const prev = () => setActive((a) => (a - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const t = testimonials[active];

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pattern-dots opacity-[0.06]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
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

        {/* Carousel */}
        <div
          className="max-w-3xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative p-8 md:p-12 rounded-3xl bg-slate-50/80 border border-slate-200/80 shadow-lg transition-all duration-300">
            <Quote className="absolute top-6 right-6 w-12 h-12 text-teal-100" />

            {/* Yıldız rating */}
            <div className="flex items-center gap-1 mb-5">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>

            <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-8 relative z-10 font-medium">
              &ldquo;{t.quote}&rdquo;
            </p>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
              {/* Achievement badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold">
                🏆 {t.badge}
              </span>
            </div>

            {/* Navigasyon */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === active ? "w-6 h-2.5 bg-teal-600" : "w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300"
                    }`}
                    aria-label={`${i + 1}. yorum`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  aria-label="Önceki"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={next}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  aria-label="Sonraki"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mini önizleme kartları */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {testimonials.map((item, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 ${
                  i === active
                    ? "border-teal-300 bg-teal-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xs font-bold mb-1.5`}>
                  {item.avatar}
                </div>
                <p className="text-[11px] font-semibold text-slate-700 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{item.role}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
