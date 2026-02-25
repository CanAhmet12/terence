"use client";

import { BarChart3, AlertCircle, Clock, TrendingDown } from "lucide-react";

// web.MD: Öğrenci bazlı net, Kazanım bazlı hata, En zor konular, En çok zaman alan sorular
const mockOgrenciNet = [
  { name: "Elif K.", net: 52, hedef: 55, durum: "yesil" },
  { name: "Can D.", net: 48, hedef: 50, durum: "yesil" },
  { name: "Zeynep K.", net: 42, hedef: 50, durum: "sari" },
  { name: "Ahmet Y.", net: 35, hedef: 50, durum: "kirmizi" },
];

const mockKazanimHata = [
  { kod: "M.8.1.1", konu: "Üslü İfadeler", hataSayisi: 24, ogrenciSayisi: 8 },
  { kod: "F.9.1.1", konu: "Hareket", hataSayisi: 18, ogrenciSayisi: 6 },
  { kod: "T.9.2.1", konu: "Paragraf", hataSayisi: 12, ogrenciSayisi: 5 },
];

const mockZorKonular = [
  { konu: "Üslü Sayılar", yanlisOran: 68 },
  { konu: "Hareket Denklemleri", yanlisOran: 62 },
  { konu: "Paragraf Yorumu", yanlisOran: 55 },
];

const mockZamanAlan = [
  { konu: "Limit-Türev", ortalamaSure: 4.2, birim: "dk/soru" },
  { konu: "Paragraf", ortalamaSure: 3.8, birim: "dk/soru" },
  { konu: "Üslü İfadeler", ortalamaSure: 2.1, birim: "dk/soru" },
];

export default function AnalizPage() {
  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Analiz Merkezi</h1>
        <p className="text-slate-600 mt-1">
          Öğrenci bazlı net, kazanım bazlı hata, en zor konular, en çok zaman alan sorular
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Öğrenci Bazlı Net
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3">Öğrenci</th>
                  <th className="text-right py-3">Net</th>
                  <th className="text-right py-3">Hedef</th>
                  <th className="text-right py-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {mockOgrenciNet.map((o) => (
                  <tr key={o.name} className="border-b border-slate-100">
                    <td className="py-3 font-medium">{o.name}</td>
                    <td className="text-right py-3">{o.net}</td>
                    <td className="text-right py-3 text-slate-500">{o.hedef}</td>
                    <td className="text-right py-3">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          o.durum === "yesil"
                            ? "bg-green-500"
                            : o.durum === "sari"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        title={o.durum === "yesil" ? "Hedefte" : o.durum === "sari" ? "Sınırda" : "Riskte"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Kazanım Bazlı Hata
          </h2>
          <p className="text-sm text-slate-600 mb-4">Hangi kazanımda en çok hata yapılıyor — tekrar anlatım önerisi</p>
          <div className="space-y-3">
            {mockKazanimHata.map((k) => (
              <div key={k.kod} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="font-medium text-slate-900">{k.kod}</span>
                  <span className="text-slate-600 ml-2">{k.konu}</span>
                </div>
                <div className="text-right">
                  <span className="text-red-600 font-medium">{k.hataSayisi}</span> hata
                  <span className="text-slate-500 text-sm ml-1">({k.ogrenciSayisi} öğr.)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600" />
            En Zor Konular
          </h2>
          <p className="text-sm text-slate-600 mb-4">Yanlış oranı %65+ = Türkiye geneli zor kazanım</p>
          <div className="space-y-3">
            {mockZorKonular.map((z) => (
              <div key={z.konu} className="flex justify-between items-center">
                <span className="text-slate-800">{z.konu}</span>
                <span className={`font-medium ${z.yanlisOran >= 65 ? "text-red-600" : "text-amber-600"}`}>
                  %{z.yanlisOran} yanlış
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-teal-600" />
            En Çok Zaman Alan Sorular
          </h2>
          <p className="text-sm text-slate-600 mb-4">Ortalama çözüm süresi (dk/soru)</p>
          <div className="space-y-3">
            {mockZamanAlan.map((z) => (
              <div key={z.konu} className="flex justify-between items-center">
                <span className="text-slate-800">{z.konu}</span>
                <span className="font-medium text-teal-600">{z.ortalamaSure} {z.birim}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
