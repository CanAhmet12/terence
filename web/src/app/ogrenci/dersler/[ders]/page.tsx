"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, FileText, CheckCircle, RefreshCw } from "lucide-react";

// web.MD: Ünite-Konu-Kazanım, %İlerleme Barları, Anladım/Tekrar Et butonları
const mockUnits = [
  { id: 1, name: "Üslü Sayılar", progress: 100, kazanım: "M.8.1.1 Üslü ifadeleri çözer", understood: true },
  { id: 2, name: "Köklü Sayılar", progress: 65, kazanım: "M.8.2.1 Köklü sayıları hesaplar", understood: false },
  { id: 3, name: "Cebirsel İfadeler", progress: 0, kazanım: "M.8.3.1 Cebirsel ifadeleri düzenler", understood: false },
];

export default function DersDetayPage() {
  const params = useParams();
  const ders = params.ders as string;

  return (
    <div className="p-8 lg:p-12">
      <Link href="/ogrenci/dersler" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Derslere dön
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 capitalize">{ders}</h1>
      <p className="text-slate-600 mt-1">Ünite-Konu-Kazanım yapısı · İlerleme takibi</p>

      <div className="mt-8 space-y-4">
        {mockUnits.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{u.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{u.kazanım}</p>
                <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">%{u.progress} tamamlandı</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700">
                  <Play className="w-4 h-4" />
                  Video
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700">
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                {u.progress > 0 && (
                  <>
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                      u.understood ? "bg-green-100 text-green-700" : "border border-green-200 hover:bg-green-50 text-green-700"
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      Anladım
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-200 hover:bg-amber-50 text-amber-700">
                      <RefreshCw className="w-4 h-4" />
                      Tekrar Et
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Anladım: Konuyu öğrendim. Tekrar Et: Günlük plana otomatik eklenir.
      </p>
    </div>
  );
}
