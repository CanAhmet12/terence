"use client";

import { useEffect, useRef, useState } from "react";
import { Users, FileQuestion, ThumbsUp, GraduationCap } from "lucide-react";

const stats = [
  { value: 50000, suffix: "+", label: "Aktif Öğrenci", icon: Users },
  { value: 1, suffix: "M+ Soru", label: "Soru Bankası", icon: FileQuestion },
  { value: 94, suffix: "%", label: "Veli Memnuniyeti", icon: ThumbsUp },
  { value: 4, suffix: " Sınav Türü", label: "LGS · TYT · AYT · KPSS", icon: GraduationCap },
];

const achievements = [
  "🏆 Ayşe T. — LGS'de 487 net",
  "🎯 Mehmet K. — TYT'de +32 net artışı",
  "⭐ Zeynep A. — Boğaziçi Tıp kazandı",
  "🔥 Emre Y. — 21 günlük seri rekoru",
  "📈 Selin Ö. — AYT Matematik 37 net",
  "🏅 Burak Ç. — KPSS'de 82 puan",
  "✨ Arda M. — İTÜ Makine kazandı",
  "💪 Hande K. — 2 ayda 18 net artışı",
  "🎉 Can D. — LGS'de tam puan",
  "🚀 Dila Y. — YKS'de hedef okul kazandı",
];

function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatItem({ stat }: { stat: (typeof stats)[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(stat.value, 1500, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-center gap-4 lg:gap-5">
      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center shrink-0">
        <stat.icon className="w-6 h-6 lg:w-7 lg:h-7 text-teal-600" strokeWidth={2} />
      </div>
      <div>
        <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
          {stat.suffix.startsWith("M") ? `${count === stat.value ? "1" : "0"}${stat.suffix}` : `${count.toLocaleString("tr-TR")}${stat.suffix}`}
        </p>
        <p className="text-sm lg:text-base text-slate-600 font-medium">{stat.label}</p>
      </div>
    </div>
  );
}

export function StatsBar() {
  const doubled = [...achievements, ...achievements];

  return (
    <section className="border-y border-slate-200/80 bg-white overflow-hidden">
      {/* Stats grid */}
      <div className="relative py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat) => (
              <StatItem key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </div>

      {/* Marquee sosyal kanıt bandı */}
      <div className="border-t border-slate-100 py-3 bg-slate-50/60 overflow-hidden">
        <div className="flex items-center gap-0 animate-marquee whitespace-nowrap">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 font-medium px-8"
            >
              {item}
              <span className="text-slate-300 ml-6">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
