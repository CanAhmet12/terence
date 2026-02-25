"use client";

import { useState } from "react";
import { Video, Users, Link2, Copy } from "lucide-react";

// web.MD: Tarih/saat, sınıf seçimi, ders süresi, tek seferlik/tekrarlayan, canlı link, kamera/mikrofon/ekran paylaşımı
export default function CanliDersPage() {
  const [tekrarli, setTekrarli] = useState(false);
  const olusturulanLink = "https://meet.terence.com/abc-xyz-123";

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Canlı Ders Aç</h1>
        <p className="text-slate-600 mt-1">
          Tarih/saat belirle · Sınıf seç · Link oluştur · Kamera, mikrofon, ekran paylaşımı
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-teal-600" />
            Yeni Ders Oluştur
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarih ve Saat</label>
              <input type="datetime-local" className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf / Grup</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                <option value="">Seçin</option>
                <option>10-A Matematik</option>
                <option>10-B Matematik</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ders Süresi (dk)</label>
              <input type="number" defaultValue={45} min={15} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tekrar"
                checked={tekrarli}
                onChange={(e) => setTekrarli(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <label htmlFor="tekrar" className="text-sm text-slate-700">Tekrar eden ders (haftalık vb.)</label>
            </div>
          </div>
          <button className="mt-6 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl">
            Canlı Ders Linki Oluştur
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-teal-50 rounded-2xl border border-teal-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5 text-teal-600" />
              Ders Linki
            </h3>
            <p className="text-sm text-slate-600 mb-2">Öğrencilerle paylaş</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={olusturulanLink}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
              <button className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 flex items-center gap-1">
                <Copy className="w-4 h-4" />
                Kopyala
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Özellikler</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Kamera, mikrofon, ekran paylaşımı</li>
              <li>• Soru sor butonu</li>
              <li>• Canlı anket & mini quiz</li>
              <li>• Ders sonrası otomatik kayıt arşivi</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-teal-600" />
              Yaklaşan Dersler
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span>Matematik - 10-A</span>
                <span className="text-sm text-slate-500">26 Şub 14:00</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span>Fizik - 10-B</span>
                <span className="text-sm text-slate-500">27 Şub 10:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
