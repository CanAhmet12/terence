"use client";

import { Trophy, Award, TrendingUp } from "lucide-react";

// web.MD: Rozet sistemi, Sıralama, Haftanın Çalışkanı, Seviye Atlama
const badges = [
  { name: "İlk Adım", desc: "İlk görevi tamamla", earned: true, emoji: "🎯" },
  { name: "5 Gün Üst Üste", desc: "5 gün arka arkaya çalış", earned: true, emoji: "🔥" },
  { name: "Net Artırıcı", desc: "Haftada +5 net artış", earned: false, emoji: "📈" },
];

const siralama = [
  { sira: 1, name: "Elif K.", studyMin: 420, net: "+8" },
  { sira: 2, name: "Ahmet Y.", studyMin: 380, net: "+6" },
  { sira: 3, name: "Sen (Örnek)", studyMin: 320, net: "+5" },
  { sira: 4, name: "Zeynep M.", studyMin: 290, net: "+4" },
  { sira: 5, name: "Can D.", studyMin: 250, net: "+3" },
];

export default function RozetPage() {
  return (
    <div className="p-8 lg:p-12 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Motivasyon</h1>
        <p className="text-slate-600">Rozetler, sıralama, haftanın çalışkanı</p>
      </div>

      {/* Haftanın Çalışkanı */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-600" />
          Haftanın Çalışkanı
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center text-3xl">🏆</div>
          <div>
            <p className="font-bold text-slate-900">Elif K.</p>
            <p className="text-sm text-slate-600">420 dk çalışma · +8 net artış</p>
          </div>
        </div>
      </div>

      {/* Sıralama Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          Haftalık Sıralama
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2">#</th>
                <th className="text-left py-3 px-2">Öğrenci</th>
                <th className="text-right py-3 px-2">Çalışma (dk)</th>
                <th className="text-right py-3 px-2">Net Artış</th>
              </tr>
            </thead>
            <tbody>
              {siralama.map((s) => (
                <tr
                  key={s.sira}
                  className={`border-b border-slate-100 last:border-0 ${
                    s.name.includes("Sen") ? "bg-teal-50 font-medium" : ""
                  }`}
                >
                  <td className="py-3 px-2">{s.sira}</td>
                  <td className="py-3 px-2">{s.name}</td>
                  <td className="text-right py-3 px-2">{s.studyMin}</td>
                  <td className="text-right py-3 px-2 text-teal-600">+{s.net.replace("+", "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seviye Bar (öğrenci panelindeki ile tutarlı) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-2">Seviye</h2>
        <div className="flex items-center gap-4">
          <div className="text-3xl">⭐</div>
          <div className="flex-1">
            <p className="text-sm text-slate-600">Seviye 3 — 240 XP</p>
            <div className="mt-2 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: "60%" }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Bir sonraki seviyeye 160 XP</p>
          </div>
        </div>
      </div>

      {/* Rozetler */}
      <div>
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-600" />
          Rozetler
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((b) => (
            <div
              key={b.name}
              className={`p-6 rounded-2xl border ${
                b.earned ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200 opacity-60"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center text-2xl mb-4">
                {b.earned ? b.emoji : "🔒"}
              </div>
              <h3 className="font-semibold text-slate-900">{b.name}</h3>
              <p className="text-sm text-slate-600 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
