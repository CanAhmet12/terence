"use client";

import { Target, Building2, TrendingUp } from "lucide-react";

export default function HedefPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Hedef & Net Motoru</h1>
        <p className="text-slate-600 mt-1 text-lg">
          Hedef okulunu ve bölümünü seç. Sistem gerekli neti hesaplasın.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Mevcut hedef özeti */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-teal-600" />
            </div>
            Mevcut Hedefim
          </h2>
          <div className="space-y-4">
            {[
              { label: "Hedef Sınav", value: "TYT-AYT" },
              { label: "Hedef Okul", value: "İstanbul Üniversitesi" },
              { label: "Hedef Bölüm", value: "Hukuk" },
              { label: "Taban Puan", value: "425" },
              { label: "Sınava Kalan Gün", value: "165", highlight: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-4 px-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">{row.label}</span>
                <span className={`font-bold ${row.highlight ? "text-teal-600" : "text-slate-900"}`}>{row.value}</span>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25">
            Hedefi Güncelle
          </button>
        </div>

        {/* Net karşılaştırma */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-lg transition-shadow">
            <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              Net Karşılaştırma
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100">
                <p className="text-sm text-slate-600 font-medium">TYT Gerekli Net</p>
                <p className="text-2xl font-bold text-teal-600 mt-0.5">75</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-600 font-medium">Mevcut Net</p>
                <p className="text-2xl font-bold text-slate-700 mt-0.5">42</p>
              </div>
              <div className="col-span-2 p-5 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-sm text-slate-600 font-medium">Artması Gereken Net</p>
                <p className="text-2xl font-bold text-amber-700 mt-0.5">+33</p>
                <p className="text-sm text-slate-600 mt-2">
                  Her 5 günde +1 net hedefi ile çalışma planı oluşturuluyor.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              Hedef Belirle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Sınav</label>
                <select defaultValue="tyt-ayt" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all">
                  <option value="lgs">LGS</option>
                  <option value="tyt-ayt">TYT-AYT</option>
                  <option value="kpss">KPSS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Okul</label>
                <input
                  type="text"
                  placeholder="İstanbul Üniversitesi"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Bölüm</label>
                <input
                  type="text"
                  placeholder="Hukuk"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
