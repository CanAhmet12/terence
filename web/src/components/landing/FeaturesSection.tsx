import {
  Target,
  BookOpen,
  BarChart3,
  Users,
  Video,
  FileQuestion,
  Calendar,
  Trophy,
  Brain,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Hedef & Net Motoru",
    desc: "Hedef okul/bölüm seç, sistem gerekli neti hesaplasın. Her 5 günde +1 net planı otomatik oluşsun. Geride kalırsan uyarı + veli bildirimi.",
    color: "teal",
  },
  {
    icon: BookOpen,
    title: "Kazanım Tabanlı İçerik",
    desc: "MEB/ÖSYM kazanım yapısı. Her konu için video, PDF, mini test. Anladım/Tekrar Et butonları ile ilerleme takibi.",
    color: "emerald",
  },
  {
    icon: Brain,
    title: "Akıllı Öğrenme Motoru",
    desc: "Yanlış yaptığın kazanımı tespit eder, günlük plana otomatik ekler. Zayıf kazanımlara özel soru ve video önerisi.",
    color: "violet",
  },
  {
    icon: FileQuestion,
    title: "1M+ Soru Bankası",
    desc: "Zorluk ve kazanım filtreleme. Benzer soru getir. Öğrenciye özel dinamik test üretimi (AI).",
    color: "blue",
  },
  {
    icon: BarChart3,
    title: "Online Deneme & Sıralama",
    desc: "LGS, TYT, AYT, KPSS gerçek ÖSYM formatı. Türkiye geneli sıralama. Konu analiz raporu ve net artış önerileri.",
    color: "amber",
  },
  {
    icon: Calendar,
    title: "Günlük Akıllı Plan",
    desc: "Bugünkü görevler, bitirince tik. Sistem otomatik yeni görev ekler. Çalışmazsa veliye uyarı.",
    color: "teal",
  },
  {
    icon: Video,
    title: "Canlı Ders & Video",
    desc: "Zoom benzeri canlı ders. Hız ayarlı video, kaldığın yerden devam. Soru sor butonu, canlı anket.",
    color: "rose",
  },
  {
    icon: Users,
    title: "Öğretmen & Veli Paneli",
    desc: "Öğretmen: Sınıf yönetimi, ödev atama, başarı tahmini. Veli: Çalışma süresi, deneme sonuçları, net grafiği.",
    color: "indigo",
  },
  {
    icon: Trophy,
    title: "Rozet & Motivasyon",
    desc: "Rozet sistemi, haftanın çalışkanı, sıralama tabloları. Soru sor - cevap al topluluk alanı.",
    color: "amber",
  },
];

const colorClasses: Record<string, string> = {
  teal: "bg-teal-50 border-teal-100 text-teal-600 group-hover:bg-teal-100 group-hover:border-teal-200",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-100 group-hover:border-emerald-200",
  violet: "bg-violet-50 border-violet-100 text-violet-600 group-hover:bg-violet-100 group-hover:border-violet-200",
  blue: "bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-100 group-hover:border-blue-200",
  amber: "bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-100 group-hover:border-amber-200",
  rose: "bg-rose-50 border-rose-100 text-rose-600 group-hover:bg-rose-100 group-hover:border-rose-200",
  indigo: "bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-100 group-hover:border-indigo-200",
};

export function FeaturesSection() {
  return (
    <section id="ozellikler" className="py-20 lg:py-28 bg-slate-50/50 relative">
      <div className="absolute inset-0 pattern-dots opacity-[0.08]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-4">
            Özellikler
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
            Hedefine Ulaşmak İçin{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">
              İhtiyacın Olan Her Şey
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed">
            Konu ve kazanım tabanlı sistem, yapay zeka destekli öğrenme motoru ve veli takip sistemi ile
            hedef okuluna ulaşmana yardımcı oluyoruz.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-200/80 transition-all duration-300 hover:-translate-y-1 card-elevated"
            >
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 transition-colors ${colorClasses[feature.color] || colorClasses.teal}`}>
                <feature.icon className="w-8 h-8" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
