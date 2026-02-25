import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Users, BarChart3 } from "lucide-react";

const exams = ["LGS", "TYT", "AYT", "KPSS"];
const roles = [
  { label: "Öğrenciyim", desc: "Hedefime ulaş", href: "/kayit", icon: BookOpen },
  { label: "Öğretmenim", desc: "Sınıfımı yönet", href: "/kayit", icon: Users },
  { label: "Veliyim", desc: "Takip et", href: "/kayit", icon: BarChart3 },
];

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
      <div className="absolute inset-0 gradient-hero-mesh" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-teal-300/10 blur-3xl -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-amber-300/8 blur-3xl translate-y-1/3 -translate-x-1/4" />
      <div className="absolute inset-0 pattern-dots opacity-[0.07]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 text-slate-700 text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Hedefine Özel Akıllı Öğrenme Platformu
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 leading-[1.08] tracking-tight">
            Hedef Okulunu{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500">
                Kazanmak
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full opacity-90" />
            </span>{" "}
            İçin Akıllı Plan
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            LGS, TYT, AYT, KPSS hazırlığında hedef okulunu seç. Sistem gerekli neti hesaplasın, 
            kalan günlere bölsün. Her 5 günde +1 net hedefi ile çalışma planın otomatik oluşsun.
          </p>

          {/* Sınav rozetleri - Coursera kategori tarzı */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {exams.map((exam) => (
              <span
                key={exam}
                className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 font-semibold text-sm shadow-sm hover:bg-teal-50 hover:border-teal-200/80 transition-colors"
              >
                {exam}
              </span>
            ))}
          </div>

          {/* Role-based CTAs - Khan Academy tarzı */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            {roles.map((role) => (
              <Link
                key={role.label}
                href={role.href}
                className="group flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/50 font-semibold text-slate-800 hover:text-teal-800 transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <role.icon className="w-5 h-5 text-teal-600" />
                {role.label} - {role.desc}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kayit"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-teal-500/30 hover:shadow-teal-500/40 hover:-translate-y-1"
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

          <p className="mt-6 text-sm text-slate-500">
            Kredi kartı gerekmez · İstediğin zaman iptal et · Binlerce öğrenci hedefe ulaştı
          </p>
        </div>

        {/* Dashboard mockup - daha kompakt, aşağıda */}
        <div className="mt-16 lg:mt-24 max-w-4xl mx-auto">
          <div className="relative rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl shadow-slate-300/60 border border-slate-200/80 p-6 lg:p-8 overflow-hidden hover-lift">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-teal-500/8 to-transparent rounded-bl-full" />
            <div className="relative grid sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50/80 border border-teal-100">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-sm">✓</div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">M.8.1.1 Üslü İfadeler</p>
                  <p className="text-sm font-semibold text-slate-900">10 soru tamamlandı</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50/80 border border-teal-100">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-sm">✓</div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Fizik Hareket</p>
                  <p className="text-sm font-semibold text-slate-900">Video izlendi</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">TYT Deneme</p>
                  <p className="text-sm font-semibold text-slate-900">40 soru bekliyor</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                <p className="text-xs text-slate-500 font-medium">Hedef Net</p>
                <p className="text-2xl font-bold text-teal-600">75</p>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Kalan Gün</p>
                <p className="text-2xl font-bold text-slate-900">165</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
