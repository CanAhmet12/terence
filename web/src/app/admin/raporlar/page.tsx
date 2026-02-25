"use client";

import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, DollarSign, Video } from "lucide-react";

// web.MD: Öğrenci katılım, En çok izlenen dersler, Kullanıcı artışı, Gelir-gider
const mockHaftalikKullanici = [120, 135, 128, 142, 155, 168, 180];
const mockAylikGelir = [98000, 105000, 112000, 124500];

export default function AdminRaporlarPage() {
  return (
    <div className="p-8 lg:p-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Panele dön
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Raporlar</h1>
      <p className="text-slate-600 mb-8">Öğrenci katılımı, gelir-gider, kullanıcı artışı</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium">Günlük Aktif Öğrenci</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">847</p>
          <p className="text-sm text-green-600 mt-1">%12 artış</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Video className="w-5 h-5" />
            <span className="font-medium">Bu Hafta Video İzlenme</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">12.456</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Yeni Kayıt (30 gün)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">234</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="font-medium">Bu Ay Gelir</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">₺124.500</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Haftalık Aktif Kullanıcı</h2>
          <div className="flex items-end gap-1 h-40">
            {mockHaftalikKullanici.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-teal-500 min-h-[4px]"
                  style={{ height: `${(val / 200) * 100}%` }}
                />
                <span className="text-xs text-slate-500">{["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Aylık Gelir</h2>
          <div className="flex items-end gap-2 h-40">
            {mockAylikGelir.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-teal-500 min-h-[4px]"
                  style={{ height: `${(val / 130000) * 100}%` }}
                />
                <span className="text-xs text-slate-500">Ay {i + 1}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">Son 4 ay</p>
        </div>
      </div>
    </div>
  );
}
