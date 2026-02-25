"use client";

import { useState } from "react";
import { Calendar, FileQuestion, BookOpen } from "lucide-react";

export default function OdevPage() {
  const [form, setForm] = useState({
    sinif: "",
    ders: "",
    konu: "",
    zorluk: "orta",
    soruSayisi: "10",
    teslimTarihi: "",
    zorunlu: true,
    mesaj: "",
  });

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Ödev & Test Atama</h1>
        <p className="text-slate-600 mt-1">Kazanıma göre ödev atar, son tarih koyar</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-teal-600" />
              Yeni Ödev Oluştur
            </h2>
            <form className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sınıf / Grup</label>
                  <select
                    value={form.sinif}
                    onChange={(e) => setForm({ ...form, sinif: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Seçin</option>
                    <option value="10a">10-A Matematik</option>
                    <option value="10b">10-B Matematik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ders</label>
                  <select
                    value={form.ders}
                    onChange={(e) => setForm({ ...form, ders: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Seçin</option>
                    <option value="mat">Matematik</option>
                    <option value="fiz">Fizik</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Konu</label>
                <input
                  type="text"
                  value={form.konu}
                  onChange={(e) => setForm({ ...form, konu: e.target.value })}
                  placeholder="Örn: Üslü Sayılar"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Zorluk</label>
                  <select
                    value={form.zorluk}
                    onChange={(e) => setForm({ ...form, zorluk: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Soru Sayısı</label>
                  <input
                    type="number"
                    value={form.soruSayisi}
                    onChange={(e) => setForm({ ...form, soruSayisi: e.target.value })}
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teslim Tarihi</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={form.teslimTarihi}
                    onChange={(e) => setForm({ ...form, teslimTarihi: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="zorunlu"
                  checked={form.zorunlu}
                  onChange={(e) => setForm({ ...form, zorunlu: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <label htmlFor="zorunlu" className="text-sm text-slate-700">Zorunlu</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mesaj (opsiyonel)</label>
                <textarea
                  value={form.mesaj}
                  onChange={(e) => setForm({ ...form, mesaj: e.target.value })}
                  placeholder="Öğrencilere not..."
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => alert("Ödev atandı (API entegrasyonu ile)")}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl"
              >
                Ödevi Ata
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Son Atanan Ödevler</h3>
            <ul className="space-y-3">
              <li className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span>Üslü Sayılar - 10 soru</span>
                <span className="text-slate-500">10-A</span>
              </li>
              <li className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span>Hareket - 5 soru</span>
                <span className="text-slate-500">11-A</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
