"use client";

import { TrendingUp, Clock, BookOpen, AlertCircle, BarChart3, Download } from "lucide-react";

const haftaNetData = [
  { hafta: "1. Hft", net: 38 },
  { hafta: "2. Hft", net: 41 },
  { hafta: "3. Hft", net: 39 },
  { hafta: "4. Hft", net: 44 },
  { hafta: "5. Hft", net: 46 },
  { hafta: "6. Hft", net: 42 },
  { hafta: "7. Hft", net: 48 },
];

const denemeler = [
  { tarih: "22 Şub 2025", tur: "TYT Denemesi", matematik: 18, turkce: 22, fen: 14, toplam: 54 },
  { tarih: "15 Şub 2025", tur: "TYT Denemesi", matematik: 16, turkce: 20, fen: 12, toplam: 48 },
  { tarih: "8 Şub 2025", tur: "TYT Denemesi", matematik: 14, turkce: 19, fen: 11, toplam: 44 },
];

const zayifDersler = [
  { ders: "Matematik", tamamlama: 62, durum: "warning" },
  { ders: "Fizik", tamamlama: 71, durum: "warning" },
  { ders: "Türkçe", tamamlama: 85, durum: "good" },
  { ders: "Kimya", tamamlama: 45, durum: "risk" },
];

const maxNet = Math.max(...haftaNetData.map((d) => d.net));

export default function VeliRaporPage() {
  return (
    <div className="p-8 lg:p-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detaylı Performans Raporu</h1>
          <p className="text-slate-600 mt-1">Ahmet'in haftalık ve aylık gelişim özeti</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm">
          <Download className="w-4 h-4" />
          PDF İndir
        </button>
      </div>

      {/* Özet KPI */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Bu Hafta Çalışma", value: "12s 34dk", icon: Clock, color: "teal" },
          { label: "Haftalık Net Artış", value: "+6", icon: TrendingUp, color: "green" },
          { label: "Çözülen Soru", value: "248", icon: BookOpen, color: "blue" },
          { label: "Hedef Sapması", value: "-7 net", icon: AlertCircle, color: "amber" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              kpi.color === "teal" ? "bg-teal-100" :
              kpi.color === "green" ? "bg-green-100" :
              kpi.color === "blue" ? "bg-blue-100" : "bg-amber-100"
            }`}>
              <kpi.icon className={`w-5 h-5 ${
                kpi.color === "teal" ? "text-teal-600" :
                kpi.color === "green" ? "text-green-600" :
                kpi.color === "blue" ? "text-blue-600" : "text-amber-600"
              }`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
            <p className="text-sm text-slate-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Net Gelişim Grafiği */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            7 Haftalık Net Gelişimi (TYT)
          </h2>
          <div className="flex items-end gap-2 h-40">
            {haftaNetData.map((d) => (
              <div key={d.hafta} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-teal-700">{d.net}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 transition-all"
                  style={{ height: `${(d.net / maxNet) * 100}%` }}
                />
                <span className="text-[10px] text-slate-500 text-center">{d.hafta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ders Bazlı Durum */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-6">Ders Bazlı Tamamlanma</h2>
          <div className="space-y-4">
            {zayifDersler.map((d) => (
              <div key={d.ders}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-800">{d.ders}</span>
                  <span className={`text-sm font-semibold ${
                    d.durum === "good" ? "text-green-600" :
                    d.durum === "warning" ? "text-amber-600" : "text-red-600"
                  }`}>%{d.tamamlama}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      d.durum === "good" ? "bg-green-500" :
                      d.durum === "warning" ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${d.tamamlama}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> İyi (%80+)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Dikkat</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Risk</span>
          </div>
        </div>
      </div>

      {/* Deneme Sonuçları */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Son Deneme Sonuçları</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left p-4 font-semibold text-slate-700">Tarih</th>
                <th className="text-left p-4 font-semibold text-slate-700">Deneme</th>
                <th className="text-right p-4 font-semibold text-slate-700">Mat.</th>
                <th className="text-right p-4 font-semibold text-slate-700">Türkçe</th>
                <th className="text-right p-4 font-semibold text-slate-700">Fen</th>
                <th className="text-right p-4 font-semibold text-slate-700 text-teal-700">Toplam Net</th>
              </tr>
            </thead>
            <tbody>
              {denemeler.map((d, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600">{d.tarih}</td>
                  <td className="p-4 font-medium text-slate-900">{d.tur}</td>
                  <td className="text-right p-4">{d.matematik}</td>
                  <td className="text-right p-4">{d.turkce}</td>
                  <td className="text-right p-4">{d.fen}</td>
                  <td className="text-right p-4 font-bold text-teal-600">{d.toplam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hedef Risk Uyarısı */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Hedef Riski Uyarısı</h3>
            <p className="text-sm text-amber-800 mt-1">
              Mevcut hızla devam ederse Ahmet'in İstanbul Üniversitesi Hukuk hedefini
              karşılama ihtimali %38. Her hafta +2 net artış gerekiyor.
            </p>
            <button className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 underline">
              Destek Paketi İncele →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
