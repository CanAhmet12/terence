"use client";

import Link from "next/link";
import { Clock, TrendingUp, AlertTriangle, BarChart3, Mail, FileText } from "lucide-react";

const mockNetGrafik = [38, 40, 42, 45, 43, 47, 49];
const mockDenemeler = [
  { name: "TYT Deneme 1", tarih: "15.02.2025", net: 42 },
  { name: "TYT Deneme 2", tarih: "20.02.2025", net: 47 },
];

export default function VeliDashboardPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Veli Paneli</h1>
        <p className="text-slate-600 mt-1 text-lg">Çocuğunuzun çalışma süresi, zayıf dersler, deneme sonuçları, net gelişimi</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-6 text-lg">Ahmet - 10. Sınıf</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-teal-50 border border-teal-100">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Bugün Çalışma</p>
                <p className="text-xl font-bold text-slate-900">2s 34dk</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-teal-50 border border-teal-100">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Haftalık Net</p>
                <p className="text-xl font-bold text-slate-900">+3</p>
              </div>
            </div>
          </div>
          <Link
            href="/veli/rapor"
            className="mt-6 block text-center py-3 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors"
          >
            Detaylı Rapor →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-4 text-lg">Zayıf Dersler</h2>
          <p className="text-sm text-slate-600 mb-5">Hangi derslerde zayıf olduğu, tekrar edilmesi gereken konular</p>
          <ul className="space-y-3">
            <li className="flex justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-900">Matematik</span>
              <span className="text-amber-600 font-semibold">%65 tamamlama</span>
            </li>
            <li className="flex justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-900">Fizik</span>
              <span className="text-amber-600 font-semibold">%72 tamamlama</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-2 text-lg">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          Net Gelişim Grafiği
        </h2>
        <p className="text-sm text-slate-600 mb-6">Son 7 hafta net değişimi</p>
        <div className="flex items-end gap-2 h-40">
          {mockNetGrafik.map((net, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-teal-600 to-teal-400 min-h-[20px] transition-all hover:from-teal-700"
                style={{ height: `${(net / 60) * 100}%` }}
              />
              <span className="text-xs font-medium text-slate-500">{net}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">Hafta 1 → Hafta 7</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-lg">
          <FileText className="w-5 h-5 text-teal-600" />
          Deneme Sonuçları
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left py-4 px-4 font-semibold text-slate-700">Deneme</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-700">Tarih</th>
                <th className="text-right py-4 px-4 font-semibold text-slate-700">Net</th>
              </tr>
            </thead>
            <tbody>
              {mockDenemeler.map((d) => (
                <tr key={d.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-medium text-slate-900">{d.name}</td>
                  <td className="py-4 px-4 text-slate-600">{d.tarih}</td>
                  <td className="text-right py-4 px-4 font-bold text-teal-600">{d.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-lg">
          <Mail className="w-5 h-5 text-teal-600" />
          Bildirim Tercihleri
        </h2>
        <p className="text-sm text-slate-600 mb-6">SMS ve e-posta ile çalışma hatırlatmaları, deneme uyarıları, hedef risk bildirimleri</p>
        <Link
          href="/veli/bildirim"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold transition-colors"
        >
          Bildirim Ayarları →
        </Link>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">Hedef Riski Uyarısı</h3>
            <p className="text-amber-800 text-sm mt-1 leading-relaxed">
              Bu hızla devam ederse hedef bölüm risk altında. Pro pakete geçiş net artış ihtimalini %43 artırır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
