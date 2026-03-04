"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Users, BarChart3, TrendingUp, Flame, Star } from "lucide-react";

const exams = ["LGS", "TYT", "AYT", "KPSS"];
const roles = [
  { label: "Öğrenciyim", desc: "Hedefime ulaş", href: "/kayit", icon: BookOpen, color: "teal" },
  { label: "Öğretmenim", desc: "Sınıfımı yönet", href: "/kayit", icon: Users, color: "indigo" },
  { label: "Veliyim", desc: "Takip et", href: "/kayit", icon: BarChart3, color: "purple" },
];

const floatingCards = [
  {
    icon: "🎉",
    text: "Elif K. doğru cevapladı!",
    sub: "Matematik · 8. Sınıf",
    pos: "top-4 right-0 lg:-right-8",
    delay: "0s",
  },
  {
    icon: "🔥",
    text: "15 günlük çalışma serisi",
    sub: "Devam et harika gidiyorsun!",
    pos: "bottom-16 left-0 lg:-left-8",
    delay: "1.5s",
  },
  {
    icon: "📈",
    text: "Net: +8 bu hafta",
    sub: "TYT Matematik",
    pos: "bottom-4 right-4 lg:right-0",
    delay: "3s",
  },
];

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Arka plan dekoratörleri */}
      <div className="absolute inset-0 gradient-hero-mesh" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-teal-300/10 blur-3xl -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-amber-300/8 blur-3xl translate-y-1/3 -translate-x-1/4" />
      <div className="absolute inset-0 pattern-dots opacity-[0.07]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Sol: Metin içerik */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 text-slate-700 text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Hedefine Özel Akıllı Öğrenme Platformu
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight">
              Hedef Okulunu{" "}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500">
                  Kazanmak
                </span>
                <span className="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full opacity-90" />
              </span>{" "}
              İçin Akıllı Plan
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              LGS, TYT, AYT, KPSS hazırlığında hedef okulunu seç. Sistem gerekli neti hesaplasın,
              kalan günlere bölsün. AI koçun ile zayıf noktalarını hızla kapat.
            </p>

            {/* Sınav rozetleri */}
            <div className="mt-7 flex flex-wrap justify-center lg:justify-start gap-2">
              {exams.map((exam) => (
                <span
                  key={exam}
                  className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 font-semibold text-sm shadow-sm hover:bg-teal-50 hover:border-teal-200/80 transition-colors"
                >
                  {exam}
                </span>
              ))}
            </div>

            {/* Rol bazlı CTA'lar */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              {roles.map((role) => (
                <Link
                  key={role.label}
                  href={role.href}
                  className="group flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/50 font-semibold text-slate-800 hover:text-teal-800 transition-all duration-300 shadow-sm hover:shadow-lg text-sm"
                >
                  <role.icon className="w-4 h-4 text-teal-600" />
                  {role.label}
                  <span className="text-slate-400 font-normal">— {role.desc}</span>
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/kayit"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-teal-500/30 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:scale-95"
              >
                7 Gün Ücretsiz Başla
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/#nasil-calisir"
                className="inline-flex items-center justify-center px-8 py-4 text-teal-700 font-semibold hover:text-teal-800 underline underline-offset-4 decoration-2"
              >
                Nasıl çalışır?
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500 flex items-center gap-1.5 justify-center lg:justify-start">
              <span className="text-green-500">✓</span> Kredi kartı gerekmez &nbsp;·&nbsp;
              <span className="text-green-500">✓</span> İstediğin zaman iptal et
            </p>

            {/* Sosyal kanıt mini bar */}
            <div className="mt-6 flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {["AK", "MK", "EY", "ZÖ", "BT"].map((initials, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-slate-600 font-medium">50.000+ öğrenci bu hafta çalıştı</p>
              </div>
            </div>
          </div>

          {/* Sağ: Dashboard mockup (browser frame) */}
          <div className="relative hidden lg:block">
            {/* Browser frame */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-400/30 border border-slate-200/80">
              {/* Browser top bar */}
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4 bg-white rounded-lg px-3 py-1.5 text-xs text-slate-400 font-medium">
                  terenceegitim.com/ogrenci
                </div>
              </div>
              {/* Dashboard içeriği */}
              <div className="bg-slate-50 p-5 space-y-3">
                {/* KPI kartlar */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-medium">Bugün Net</p>
                    <p className="text-xl font-extrabold text-teal-600">+6</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-600 font-semibold">Hedefin %85'i</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-medium">Seri</p>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <p className="text-xl font-extrabold text-slate-800">15</p>
                    </div>
                    <p className="text-[10px] text-orange-600 font-semibold mt-1">gün üst üste</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-medium">XP Puanı</p>
                    <p className="text-xl font-extrabold text-amber-600">1.240</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Top %12</p>
                  </div>
                </div>
                {/* Günlük plan mini */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-800">Günlük Plan</p>
                    <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">2/4 tamamlandı</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                    <div className="bg-teal-500 h-1.5 rounded-full w-1/2" />
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { text: "Matematik — Üslü İfadeler (10 soru)", done: true },
                      { text: "Fizik Hareket videosu izle", done: true },
                      { text: "TYT Deneme (40 soru)", done: false },
                    ].map((task, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${task.done ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {task.done ? '✓' : i + 1}
                        </div>
                        <span className={`text-[11px] ${task.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>{task.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Net bar chart mini */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-800 mb-2">Haftalık Net</p>
                  <div className="flex items-end gap-1.5 h-12">
                    {[4, 6, 3, 7, 8, 6, 5].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full rounded-sm bg-teal-500" style={{ height: `${(h / 8) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(d => (
                      <span key={d} className="text-[9px] text-slate-400 flex-1 text-center">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating achievement kartları */}
            {floatingCards.map((card, i) => (
              <div
                key={i}
                className={`absolute ${card.pos} bg-white rounded-2xl shadow-xl border border-slate-200/80 px-3.5 py-2.5 flex items-center gap-2.5 z-10`}
                style={{ animation: `heroFloat 4s ease-in-out ${card.delay} infinite` }}
              >
                <span className="text-xl">{card.icon}</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 whitespace-nowrap">{card.text}</p>
                  <p className="text-[10px] text-slate-500">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}
