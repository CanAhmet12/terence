"use client";

import { mockWeeklyNets } from "@/lib/mock-data";
import { Clock, FileQuestion, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

// web.MD: Haftalık performans raporu - Çalışma süresi, Çözülen soru, Net artışı, Geri kalınan hedefler
const mockHaftalik = {
  calismaSure: "12s 45dk",
  soruSayisi: 156,
  netArtis: 3,
  hedefNet: 5,
  geriKalan: ["Her 5 günde +1 net hedefine 2 net eksik", "Matematik M.8.1.1 tekrar bekliyor"],
};

export default function RaporPage() {
  return (
    <div className="p-8 lg:p-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Performans Raporu</h1>
      <p className="text-slate-600 mb-8">Haftalık çalışma süresi, soru sayısı, net artışı, geri kalınan hedefler</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-teal-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Çalışma Süresi</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{mockHaftalik.calismaSure}</p>
          <p className="text-sm text-slate-500 mt-1">Bu hafta</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-teal-600 mb-2">
            <FileQuestion className="w-5 h-5" />
            <span className="font-medium">Çözülen Soru</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{mockHaftalik.soruSayisi}</p>
          <p className="text-sm text-slate-500 mt-1">Bu hafta</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-teal-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Net Artışı</span>
          </div>
          <p className="text-2xl font-bold text-teal-600">+{mockHaftalik.netArtis}</p>
          <p className="text-sm text-slate-500 mt-1">Hedef: +{mockHaftalik.hedefNet}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Geri Kalınan</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{mockHaftalik.geriKalan.length}</p>
          <p className="text-sm text-slate-500 mt-1">Hedef</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Haftalık Net Artışı
          </h2>
          <div className="flex items-end gap-2 h-48">
            {mockWeeklyNets.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-teal-500 min-h-[4px] transition-all"
                  style={{ height: `${Math.max((val / 60) * 100, 10)}%` }}
                />
                <span className="text-xs text-slate-500">
                  {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Geri Kalınan Hedefler</h2>
          <p className="text-sm text-slate-600 mb-4">Bu hafta tamamlanması gereken ancak eksik kalan hedefler</p>
          <ul className="space-y-3">
            {mockHaftalik.geriKalan.map((h, i) => (
              <li key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
