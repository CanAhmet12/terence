import { Target, Brain, Users, BookOpen, Shield, Sparkles } from "lucide-react";

const reasons = [
  {
    icon: Target,
    title: "Hedef Odaklı Plan",
    desc: "Hedef okulunu seç, sistem gerekli neti hesaplasın. Her 5 günde +1 net hedefi ile otomatik çalışma planı oluşsun.",
  },
  {
    icon: Brain,
    title: "Yapay Zeka Destekli",
    desc: "Zayıf kazanımları tespit eder, kişiye özel soru ve video önerir. Öğrenme hızına göre plan güncellenir.",
  },
  {
    icon: Users,
    title: "Veli & Öğretmen Takibi",
    desc: "Veli panelinden çalışma süresi, deneme sonuçları ve net grafiği. Öğretmen: sınıf analizi, ödev atama, başarı tahmini.",
  },
];

const trust = [
  { icon: BookOpen, text: "MEB / ÖSYM kazanım yapısı" },
  { icon: Shield, text: "Güvenli ödeme, iptal her zaman" },
  { icon: Sparkles, text: "1M+ soru, gerçek sınav formatı" },
];

export function WhyTerenceSection() {
  return (
    <section id="neden-biz" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800/95 to-slate-900" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">
            Neden TERENCE?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
            Binlerce Öğrenci Hedefine{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              Ulaştı
            </span>
          </h2>
          <p className="mt-5 text-slate-300 text-lg">
            Bilimsel öğrenme metodolojisi, yapay zeka ve veli takibi ile hedef okuluna ulaşmana yardımcı oluyoruz.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {reasons.map((r, i) => (
            <div
              key={r.title}
              className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-teal-500/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 flex items-center justify-center mb-6 group-hover:bg-teal-500/30 transition-colors">
                <r.icon className="w-7 h-7 text-teal-400" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{r.title}</h3>
              <p className="text-slate-400 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-6 lg:gap-10">
          {trust.map((t) => (
            <div key={t.text} className="flex items-center gap-3 text-slate-400">
              <t.icon className="w-5 h-5 text-teal-400 shrink-0" />
              <span className="font-medium">{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
