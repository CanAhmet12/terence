"use client";

import { useState } from "react";
import { Search, RefreshCw } from "lucide-react";

// web.MD: Zorluk seviyesine göre filtre, Kazanım bazlı filtre, Benzer soru getir
const mockSorular = [
  { id: 1, metin: "2³ · 2⁴ işleminin sonucu kaçtır?", kazanım: "M.8.1.1", zorluk: "kolay", ders: "Matematik" },
  { id: 2, metin: "Hareket denklemlerinde ivme–zaman grafiği...", kazanım: "F.9.1.1", zorluk: "orta", ders: "Fizik" },
  { id: 3, metin: "Aşağıdaki paragrafta ana düşünce nedir?", kazanım: "T.9.2.1", zorluk: "zor", ders: "Türkçe" },
];

export default function SoruBankasiPage() {
  const [ders, setDers] = useState("");
  const [zorluk, setZorluk] = useState("");
  const [kazanimAra, setKazanimAra] = useState("");

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Soru Bankası</h1>
        <p className="text-slate-600 mt-1">
          1M+ soru · Zorluk & kazanım filtre · Benzer soru getir
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Kazanım kodu veya konu ara (örn: M.8.1.1)"
            value={kazanimAra}
            onChange={(e) => setKazanimAra(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <select
          value={ders}
          onChange={(e) => setDers(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Tüm Dersler</option>
          <option value="matematik">Matematik</option>
          <option value="fizik">Fizik</option>
          <option value="turkce">Türkçe</option>
        </select>
        <select
          value={zorluk}
          onChange={(e) => setZorluk(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Tüm Zorluklar</option>
          <option value="kolay">Kolay</option>
          <option value="orta">Orta</option>
          <option value="zor">Zor</option>
        </select>
      </div>

      <div className="space-y-4">
        {mockSorular.map((soru) => (
          <div
            key={soru.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-lg">
                    {soru.kazanım}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                    soru.zorluk === "kolay" ? "bg-green-100 text-green-700" :
                    soru.zorluk === "orta" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {soru.zorluk}
                  </span>
                  <span className="text-xs text-slate-500">{soru.ders}</span>
                </div>
                <p className="text-slate-800">{soru.metin}</p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium shrink-0"
                title="Bu soruya benzer yeni soru getir"
              >
                <RefreshCw className="w-4 h-4" />
                Benzer Soru Getir
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Benzer soru getir: Sistem zayıf kazanımlarına göre benzer sorular önerir. Filtreleri kullanarak aramayı daraltabilirsin.
      </p>
    </div>
  );
}
