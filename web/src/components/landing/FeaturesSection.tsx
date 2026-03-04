"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Target,
  BookOpen,
  BarChart3,
  Brain,
  FileQuestion,
  Calendar,
  Video,
  Users,
  Trophy,
  ChevronRight,
  TrendingUp,
  Flame,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Hedef & Net Motoru",
    desc: "Hedef okul/bölüm seç, sistem gerekli neti hesaplasın. Her 5 günde +1 net planı otomatik oluşsun. Geride kalırsan uyarı + veli bildirimi.",
    color: "teal",
    preview: {
      title: "Hedef Takibi",
      items: [
        { label: "Hedef Okul", value: "Boğaziçi Üniversitesi — Mühendislik", badge: "🎯" },
        { label: "Gerekli Net", value: "94 TYT + 72 AYT", badge: "📊" },
        { label: "Mevcut Net", value: "76 TYT / +18 fark", badge: "📈" },
        { label: "Kalan Gün", value: "165 gün — Yetişirsin!", badge: "⏰" },
      ],
    },
  },
  {
    icon: Brain,
    title: "AI Dijital Koç",
    desc: "Zayıf kazanımlarını tespit eder, günlük plana otomatik ekler. Kişisel test üretimi ve sesli soru çözme ile öğrenmeni hızlandırır.",
    color: "violet",
    preview: {
      title: "AI Koç Konuşması",
      chat: [
        { role: "user", text: "Hangi konulara odaklanmalıyım?" },
        { role: "bot", text: "Analizine göre TYT Matematik'te 'Olasılık' ve 'Türev' konularında zorlanıyorsun. Bu hafta öncelikle bu konulara odaklanmanı öneririm. Sana özel 15 soruluk test hazırlayayım mı?" },
      ],
    },
  },
  {
    icon: BarChart3,
    title: "Gerçek Zamanlı Analiz",
    desc: "Haftalık net trendi, ders bazlı performans, Türkiye geneli sıralama. Zayıf kazanımları otomatik tespit et, hedefe kalan süreyi takip et.",
    color: "blue",
    preview: {
      title: "Performans Raporu",
      bars: [
        { label: "Matematik", val: 78, color: "bg-teal-500" },
        { label: "Türkçe", val: 65, color: "bg-blue-500" },
        { label: "Fen Bilimleri", val: 82, color: "bg-emerald-500" },
        { label: "Sosyal Bilgiler", val: 55, color: "bg-amber-500" },
      ],
    },
  },
  {
    icon: Calendar,
    title: "Akıllı Günlük Plan",
    desc: "Bugünkü görevler, bitirince tik. Sistem otomatik yeni görev ekler. Çalışmazsa veliye uyarı. Streak sistemi ile motivasyonunu canlı tut.",
    color: "emerald",
    preview: {
      title: "Bugünkü Plan",
      tasks: [
        { text: "Matematik — Üslü İfadeler (10 soru)", done: true },
        { text: "Fizik Hareket videosu izle", done: true },
        { text: "TYT Deneme (40 soru)", done: false },
        { text: "Türkçe — Paragraf analizi", done: false },
      ],
    },
  },
  {
    icon: FileQuestion,
    title: "1M+ Soru Bankası",
    desc: "Zorluk ve kazanım filtreleme. Benzer soru getir. Sesli soru çözme ve AI destekli kişisel test üretimi.",
    color: "amber",
    preview: {
      title: "Soru Çözüyorsun",
      question: "Bir trenin hızı 72 km/h'dir. Bu trenin 5 dakikada aldığı yol kaç metredir?",
      options: ["A) 5000 m", "B) 6000 m", "C) 7000 m", "D) 8000 m"],
      correct: 1,
    },
  },
  {
    icon: Users,
    title: "Öğretmen & Veli Paneli",
    desc: "Öğretmen: Sınıf yönetimi, ödev atama, başarı tahmini. Veli: Çalışma süresi, deneme sonuçları, net grafiği anlık takip.",
    color: "indigo",
    preview: {
      title: "Veli Takip",
      items: [
        { label: "Bugün Çalışma", value: "2 saat 35 dakika", badge: "⏱️" },
        { label: "Tamamlanan Görev", value: "3/4 görev", badge: "✅" },
        { label: "Net Artışı", value: "+6 bu hafta", badge: "📈" },
        { label: "Risk Durumu", value: "Hedefte İlerliyorsun", badge: "🟢" },
      ],
    },
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200", activeBg: "bg-teal-600" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", activeBg: "bg-violet-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", activeBg: "bg-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", activeBg: "bg-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", activeBg: "bg-amber-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", activeBg: "bg-indigo-600" },
};

export function FeaturesSection() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => setActive((a) => (a + 1) % features.length), []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const feat = features[active];
  const c = colorMap[feat.color] || colorMap.teal;

  return (
    <section id="ozellikler" className="py-20 lg:py-28 bg-slate-50/50 relative">
      <div className="absolute inset-0 pattern-dots opacity-[0.08]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-4">Özellikler</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
            Hedefine Ulaşmak İçin{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">
              İhtiyacın Olan Her Şey
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed">
            Konu ve kazanım tabanlı sistem, yapay zeka destekli öğrenme motoru ve veli takip sistemi ile hedef okuluna ulaşmanı sağlıyoruz.
          </p>
        </div>

        {/* Tab'lı showcase — masaüstü */}
        <div
          className="hidden lg:grid lg:grid-cols-5 gap-6 items-start"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Sol: özellik listesi */}
          <div className="lg:col-span-2 space-y-2">
            {features.map((f, i) => {
              const fc = colorMap[f.color] || colorMap.teal;
              const isAct = i === active;
              return (
                <button
                  key={f.title}
                  onClick={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 border ${
                    isAct
                      ? `${fc.bg} ${fc.border} shadow-sm border-l-4`
                      : "bg-white border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isAct ? fc.bg : "bg-slate-100"}`}>
                    <f.icon className={`w-5 h-5 ${isAct ? fc.text : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isAct ? "text-slate-900" : "text-slate-600"}`}>{f.title}</p>
                    {isAct && <p className="text-xs text-slate-500 mt-0.5 truncate">{f.desc.slice(0, 55)}...</p>}
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isAct ? `${c.text} translate-x-0.5` : "text-slate-300"}`} />
                </button>
              );
            })}
          </div>

          {/* Sağ: önizleme */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
              {/* Browser top bar */}
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4 bg-white rounded-lg px-3 py-1.5 text-xs text-slate-400">
                  terenceegitim.com/{feat.title.toLowerCase().replace(/ /g, "-")}
                </div>
              </div>

              <div className="p-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${c.bg} ${c.text} text-xs font-bold mb-4`}>
                  <feat.icon className="w-3.5 h-3.5" />
                  {feat.preview.title}
                </div>

                {/* Önizleme içeriği */}
                {"items" in feat.preview && feat.preview.items && (
                  <div className="space-y-3">
                    {feat.preview.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{item.badge}</span>
                          <span className="text-xs font-medium text-slate-500">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {"chat" in feat.preview && feat.preview.chat && (
                  <div className="space-y-3">
                    {feat.preview.chat.map((msg, i) => (
                      <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${msg.role === "bot" ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                          {msg.role === "bot" ? "AI" : "S"}
                        </div>
                        <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === "bot" ? "bg-white border border-slate-100 text-slate-700" : "bg-teal-600 text-white"}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 pl-9">
                      {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                    </div>
                  </div>
                )}

                {"bars" in feat.preview && feat.preview.bars && (
                  <div className="space-y-3">
                    {feat.preview.bars.map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-700">{bar.label}</span>
                          <span className="font-bold text-slate-900">%{bar.val}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className={`${bar.color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${bar.val}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-4 p-3 bg-teal-50 rounded-xl">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-semibold text-teal-700">Ortalama başarı: %70 — Türkiye top %15</span>
                    </div>
                  </div>
                )}

                {"tasks" in feat.preview && feat.preview.tasks && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-slate-700">15 günlük seri devam ediyor!</span>
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    {feat.preview.tasks.map((task, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${task.done ? "bg-teal-50 border-teal-100" : "bg-slate-50 border-slate-100"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${task.done ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                          {task.done ? "✓" : i + 1}
                        </div>
                        <span className={`text-xs ${task.done ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>{task.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {"question" in feat.preview && feat.preview.question && (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">{feat.preview.question}</p>
                    </div>
                    <div className="space-y-2">
                      {feat.preview.options?.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs font-medium ${i === feat.preview.correct ? "bg-teal-50 border-teal-300 text-teal-800" : "bg-white border-slate-200 text-slate-600"}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${i === feat.preview.correct ? "border-teal-500 bg-teal-500" : "border-slate-300"}`}>
                            {i === feat.preview.correct && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* İlerleme çubuğu */}
              <div className="px-6 pb-4">
                <div className="w-full bg-slate-100 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${c.activeBg} transition-all duration-300`}
                    style={{ width: `${((active + 1) / features.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobil: grid kartlar */}
        <div className="lg:hidden grid sm:grid-cols-2 gap-5">
          {features.map((feature) => {
            const fc = colorMap[feature.color] || colorMap.teal;
            return (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-teal-200/80 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className={`w-12 h-12 rounded-2xl ${fc.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${fc.text}`} strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
