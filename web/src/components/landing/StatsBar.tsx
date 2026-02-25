import { Users, FileQuestion, ThumbsUp, GraduationCap } from "lucide-react";

const stats = [
  { value: "50.000+", label: "Aktif Öğrenci", icon: Users },
  { value: "1M+", label: "Soru Bankası", icon: FileQuestion },
  { value: "%94", label: "Veli Memnuniyeti", icon: ThumbsUp },
  { value: "4", label: "Sınav Türü (LGS, TYT, AYT, KPSS)", icon: GraduationCap },
];

export function StatsBar() {
  return (
    <section className="relative py-8 lg:py-12 border-y border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 lg:gap-5"
            >
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center shrink-0">
                <stat.icon className="w-6 h-6 lg:w-7 lg:h-7 text-teal-600" strokeWidth={2} />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm lg:text-base text-slate-600 font-medium">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
