"use client";

import { AlertTriangle, Users, FileCheck, TrendingDown, Bell, CheckCircle } from "lucide-react";

const basariTahmin = [
  { name: "Elif K.", durum: "yesil", tahmin: 78, net: "+8" },
  { name: "Can D.", durum: "yesil", tahmin: 72, net: "+5" },
  { name: "Zeynep K.", durum: "sari", tahmin: 52, net: "-2" },
  { name: "Ahmet Y.", durum: "kirmizi", tahmin: 38, net: "-5" },
];

export default function TeacherDashboardPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Öğretmen Paneli</h1>
        <p className="text-slate-600 mt-1 text-lg">Bugün ödev bekleyen sınıflar, riskteki öğrenciler, başarı tahmini</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-semibold text-slate-700">Ödev Bekleyen</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">3 Sınıf</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-semibold text-slate-700">Teslimi Geciken</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">7 Öğrenci</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-semibold text-slate-700">Riskteki Öğrenci</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">2</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <span className="font-semibold text-slate-700">Ortalama Sınıf Neti</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">48.5</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-5 text-lg">Teslimi Geciken Öğrenciler</h2>
          <ul className="space-y-3">
            {["Ahmet Y.", "Zeynep K.", "Mehmet A."].map((name) => (
              <li
                key={name}
                className="flex items-center justify-between py-4 px-4 rounded-xl border border-slate-100 last:border-0 bg-slate-50/50"
              >
                <span className="font-medium text-slate-900">{name}</span>
                <span className="text-sm text-amber-600 font-semibold">2 gün gecikme</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-5 text-lg">Risk & Uyarı Merkezi</h2>
          <ul className="space-y-3">
            <li className="flex items-center justify-between py-4 px-4 rounded-xl bg-slate-50/50">
              <span className="text-slate-700">3 gün çalışmayan</span>
              <span className="text-red-600 font-semibold">2 öğrenci</span>
            </li>
            <li className="flex items-center justify-between py-4 px-4 rounded-xl bg-slate-50/50">
              <span className="text-slate-700">Neti düşen</span>
              <span className="text-amber-600 font-semibold">1 öğrenci</span>
            </li>
            <li className="flex items-center justify-between py-4 px-4 rounded-xl bg-slate-50/50">
              <span className="text-slate-700">Deneme sıçrayan</span>
              <span className="text-amber-600 font-semibold">1 öğrenci</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
        <h2 className="font-bold text-slate-900 mb-2 text-lg">Başarı Tahmin Paneli</h2>
        <p className="text-sm text-slate-600 mb-6">
          Tahmini sınav neti · Yeşil: Hedefte · Sarı: Sınırda · Kırmızı: Hedef risk altında
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {basariTahmin.map((o) => (
            <div
              key={o.name}
              className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                o.durum === "yesil"
                  ? "bg-emerald-50 border-emerald-200"
                  : o.durum === "sari"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900">{o.name}</span>
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    o.durum === "yesil" ? "bg-emerald-500" : o.durum === "sari" ? "bg-amber-500" : "bg-red-500"
                  }`}
                />
              </div>
              <p className="text-2xl font-bold text-slate-900">{o.tahmin} net</p>
              <p className={`text-sm font-medium ${o.net.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>
                {o.net} haftalık
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="font-bold text-slate-900 mb-2 text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          Veli Bildirimi
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Riskteki öğrencilerin velilerine SMS/E-posta ile otomatik veya manuel bildirim gönder.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:from-teal-700 hover:to-teal-600 transition-all shadow-lg shadow-teal-500/25">
            <CheckCircle className="w-5 h-5" />
            Toplu Veli Bildirimi (Risktekiler)
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium text-slate-700 transition-all">
            Tekli Veli Bildirimi
          </button>
        </div>
      </div>
    </div>
  );
}
