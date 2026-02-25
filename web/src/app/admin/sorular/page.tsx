"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Search, Plus } from "lucide-react";

// web.MD: Soru bankası - konu, zorluk, tür bazlı
const mockSorular = [
  { id: 1, kazanım: "M.8.1.1", ders: "Matematik", zorluk: "orta", tip: "Yeni Nesil", kullanım: 1203 },
  { id: 2, kazanım: "F.9.1.1", ders: "Fizik", zorluk: "zor", tip: "Klasik", kullanım: 856 },
  { id: 3, kazanım: "T.9.2.1", ders: "Türkçe", zorluk: "kolay", tip: "Paragraf", kullanım: 2156 },
];

export default function AdminSorularPage() {
  const [search, setSearch] = useState("");
  const [ders, setDers] = useState("");
  const [zorluk, setZorluk] = useState("");

  return (
    <div className="p-8 lg:p-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Panele dön
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Soru Havuzu</h1>
          <p className="text-slate-600 mt-1">Konu, zorluk ve tür bazlı soru yönetimi</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">
          <Plus className="w-5 h-5" />
          Soru Ekle
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kazanım veya soru ara..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <select
          value={ders}
          onChange={(e) => setDers(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl"
        >
          <option value="">Tüm Dersler</option>
          <option value="matematik">Matematik</option>
          <option value="fizik">Fizik</option>
          <option value="turkce">Türkçe</option>
        </select>
        <select
          value={zorluk}
          onChange={(e) => setZorluk(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl"
        >
          <option value="">Tüm Zorluklar</option>
          <option value="kolay">Kolay</option>
          <option value="orta">Orta</option>
          <option value="zor">Zor</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left p-4 font-semibold text-slate-700">Kazanım</th>
              <th className="text-left p-4 font-semibold text-slate-700">Ders</th>
              <th className="text-left p-4 font-semibold text-slate-700">Zorluk</th>
              <th className="text-left p-4 font-semibold text-slate-700">Tip</th>
              <th className="text-left p-4 font-semibold text-slate-700">Kullanım</th>
            </tr>
          </thead>
          <tbody>
            {mockSorular.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-medium">{s.kazanım}</td>
                <td className="p-4">{s.ders}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    s.zorluk === "kolay" ? "bg-green-100 text-green-700" :
                    s.zorluk === "orta" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {s.zorluk}
                  </span>
                </td>
                <td className="p-4">{s.tip}</td>
                <td className="p-4">{s.kullanım} çözüm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
