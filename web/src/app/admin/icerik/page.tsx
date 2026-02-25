"use client";

import Link from "next/link";
import { ArrowLeft, Video, FileText, Trash2 } from "lucide-react";

// web.MD: İçerik ekleme/silme (Video, PDF, Soru)
const mockIcerik = [
  { id: 1, tip: "video", baslik: "Üslü Sayılar - Konu Anlatımı", ders: "Matematik", izlenme: 2341 },
  { id: 2, tip: "pdf", baslik: "Üslü Sayılar Ders Notu", ders: "Matematik", indirme: 456 },
  { id: 3, tip: "soru", baslik: "M.8.1.1 Soru Seti", ders: "Matematik", cozum: 1203 },
];

export default function AdminIcerikPage() {
  return (
    <div className="p-8 lg:p-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Panele dön
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">İçerik Yönetimi</h1>
      <p className="text-slate-600 mb-8">Video, PDF, soru ekleme ve silme</p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left py-4 px-6">Tür</th>
              <th className="text-left py-4 px-6">Başlık</th>
              <th className="text-left py-4 px-6">Ders</th>
              <th className="text-left py-4 px-6">İstatistik</th>
              <th className="text-right py-4 px-6">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {mockIcerik.map((i) => (
              <tr key={i.id} className="border-b border-slate-100">
                <td className="py-4 px-6">
                  <span className="flex items-center gap-2">
                    {i.tip === "video" && <Video className="w-4 h-4 text-teal-600" />}
                    {i.tip === "pdf" && <FileText className="w-4 h-4 text-amber-600" />}
                    {i.tip === "soru" && <span className="w-4 h-4 rounded bg-slate-400" />}
                    <span className="capitalize">{i.tip}</span>
                  </span>
                </td>
                <td className="py-4 px-6 font-medium">{i.baslik}</td>
                <td className="py-4 px-6">{i.ders}</td>
                <td className="py-4 px-6">
                  {"izlenme" in i ? `${i.izlenme} izlenme` : "indirme" in i ? `${i.indirme} indirme` : `${i.cozum} çözüm`}
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
