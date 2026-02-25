"use client";

import Link from "next/link";
import { Users, BookOpen, TrendingUp, DollarSign, Upload, BarChart3, Video } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Yönetim Paneli</h1>
        <p className="text-slate-600 mt-1 text-lg">Platform özeti, içerik, satış, trafik analizi</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <span className="font-semibold text-slate-700">Toplam Öğrenci</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">1.247</p>
          <p className="text-sm font-medium text-emerald-600 mt-1">+12 bu hafta</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="font-semibold text-slate-700">Öğretmen</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">84</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-semibold text-slate-700">En Çok İzlenen</span>
          </div>
          <p className="text-xl font-bold text-slate-900">Matematik - Üslü Sayılar</p>
          <p className="text-sm text-slate-500 mt-1">2.341 izlenme</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-semibold text-slate-700">Bu Ay Gelir</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">₺124.500</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            İçerik Yönetimi
          </h2>
          <p className="text-sm text-slate-600 mb-6">Video, PDF, soru ekleme ve silme</p>
          <Link
            href="/admin/icerik"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-teal-600 transition-all shadow-lg shadow-teal-500/25"
          >
            İçerik Yönet
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Satış Raporları
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-4 px-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Free → Bronze</span>
              <span className="font-bold text-slate-900">45 dönüşüm</span>
            </div>
            <div className="flex justify-between py-4 px-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Bronze → Plus</span>
              <span className="font-bold text-slate-900">28 dönüşüm</span>
            </div>
            <div className="flex justify-between py-4 px-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Plus → Pro</span>
              <span className="font-bold text-slate-900">12 dönüşüm</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          Trafik Analizi · Hangi Ders Daha Çok İzleniyor
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { ders: "Matematik - Üslü Sayılar", izlenme: 2341 },
            { ders: "Fizik - Hareket", izlenme: 1856 },
            { ders: "Türkçe - Paragraf", izlenme: 1623 },
            { ders: "Kimya - Mol", izlenme: 1245 },
          ].map((item) => (
            <div key={item.ders} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{item.ders}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.izlenme} izlenme</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
