import { UserPlus, Target, FileCheck, Trophy } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Kayıt Ol",
    desc: "E-posta veya telefon ile ücretsiz hesap oluştur. 7 gün boyunca tüm özellikleri dene.",
  },
  {
    step: 2,
    icon: Target,
    title: "Hedefini Belirle",
    desc: "Hedef sınav (LGS, TYT, AYT, KPSS), hedef okul ve bölümünü seç. Sistem gerekli neti hesaplasın.",
  },
  {
    step: 3,
    icon: FileCheck,
    title: "Planını Takip Et",
    desc: "Günlük görevler otomatik oluşsun. Video izle, soru çöz, deneme yap. Bitirince tik at.",
  },
  {
    step: 4,
    icon: Trophy,
    title: "Hedefine Ulaş",
    desc: "Net artışını izle. Risk varsa veliye bildirim gitsin. Hedef okuluna bir adım daha yaklaş.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="nasil-calisir" className="py-24 lg:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-4">
            Nasıl Çalışır?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
            4 Adımda{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">
              Hedefine Başla
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            4 adımda hedefine özel akıllı öğrenme planına başla.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {steps.map((item, i) => (
            <div key={item.step} className="relative">
              {/* Connector line - desktop */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-14 left-[55%] w-[90%] h-0.5">
                  <div className="h-full bg-gradient-to-r from-teal-300/60 to-teal-200/40 rounded-full" />
                </div>
              )}

              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-teal-50 border-2 border-teal-100 mb-6 relative group hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/10 transition-all">
                  <item.icon className="w-14 h-14 text-teal-600" strokeWidth={2} />
                  <div className="absolute -top-1 -right-1 w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-teal-500/30">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
