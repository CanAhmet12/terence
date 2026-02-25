"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Video, FileQuestion } from "lucide-react";

// web.MD: Yanlış yapılan kazanımı tespit eder, "Bu konuyu tekrar et" der, günlük plana otomatik ekler
const mockZayif = [
  { kod: "M.8.1.1", konu: "Üslü İfadeleri Çözer", yanlis: 4, toplam: 10, öneri: "Üslü sayılar videosu izle, 10 soru çöz" },
  { kod: "F.9.2.1", konu: "Hareket Denklemleri", yanlis: 3, toplam: 8, öneri: "Hareket tekrar videosu + 5 soru" },
];

export default function ZayifKazanımPage() {
  return (
    <div className="p-8 lg:p-12">
      <Link href="/ogrenci" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Ana panele dön
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Zayıf Kazanımlar</h1>
      <p className="text-slate-600 mt-1">
        Yanlış yaptığın kazanımlar. Bunları tekrar et, günlük plana otomatik eklenir.
      </p>

      <div className="mt-8 space-y-4">
        {mockZayif.map((z) => (
          <div
            key={z.kod}
            className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-lg">
                  {z.kod}
                </span>
                <h3 className="font-semibold text-slate-900 mt-2">{z.konu}</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {z.yanlis}/{z.toplam} yanlış — Bu konuyu tekrar et
                </p>
                <p className="text-sm text-teal-700 mt-2 font-medium">{z.öneri}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100">
                  <Video className="w-4 h-4" />
                  Video
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100">
                  <FileQuestion className="w-4 h-4" />
                  Soru Çöz
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100">
                  <RefreshCw className="w-4 h-4" />
                  Planıma Ekle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
