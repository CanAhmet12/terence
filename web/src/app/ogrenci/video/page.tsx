"use client";

import Link from "next/link";
import { mockCategories } from "@/lib/mock-data";
import { Play, FileDown, Clock } from "lucide-react";

// web.MD: Hız Ayarı, Kaldığın Yerden Devam, PDF not indirme
const mockVideos = [
  { id: 1, title: "Üslü Sayılar", ders: "Matematik", duration: "12:34", lastWatch: "8:22", progress: 67, pdfUrl: "#" },
  { id: 2, title: "Hareket Denklemleri", ders: "Fizik", duration: "18:10", lastWatch: null, progress: 0, pdfUrl: "#" },
];

export default function VideoPage() {
  return (
    <div className="p-8 lg:p-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Video & PDF</h1>
      <p className="text-slate-600 mb-8">
        Hız ayarlı izleme · Kaldığın yerden devam · PDF not indirme
      </p>

      <div className="mb-8 p-4 rounded-xl bg-teal-50 border border-teal-200">
        <p className="text-sm text-teal-800">
          <strong>Hız ayarı:</strong> Videoyu izlerken 0.5x, 1x, 1.25x, 1.5x, 2x hızlarında izleyebilirsin.
        </p>
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-4">Kaldığın Yerden Devam Et</h2>
      <div className="space-y-4 mb-10">
        {mockVideos.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{v.title}</h3>
              <p className="text-sm text-slate-500">{v.ders} · {v.duration}</p>
              {v.lastWatch && (
                <p className="text-sm text-teal-600 mt-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Kaldığın yer: {v.lastWatch} — Devam et
                </p>
              )}
              {v.progress > 0 && (
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden w-full max-w-xs">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${v.progress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/ogrenci/dersler/${v.ders.toLowerCase()}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white hover:bg-teal-600"
              >
                <Play className="w-4 h-4" />
                {v.lastWatch ? "Devam Et" : "İzle"}
              </Link>
              <a
                href={v.pdfUrl}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                <FileDown className="w-4 h-4" />
                PDF İndir
              </a>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-4">Derslere Göre Videolar</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/ogrenci/dersler/${cat.slug}`}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
          >
            <h3 className="font-semibold text-slate-900">{cat.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{cat.unitCount} ünite</p>
            <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${cat.progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 mt-2">%{cat.progress} tamamlandı</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
