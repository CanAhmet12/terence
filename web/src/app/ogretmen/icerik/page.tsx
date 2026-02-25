"use client";

import { useState } from "react";
import { Video, FileText, FileQuestion, Upload } from "lucide-react";

// web.MD: Video/PDF/Soru ekleme - Alan, Sınıf, Ders, Ünite, Konu, Kazanım kodu - İçerik yayına almadan doldurulmalı
export default function IcerikYuklemePage() {
  const [secim, setSecim] = useState<"video" | "pdf" | "soru">("video");

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">İçerik Yükleme</h1>
        <p className="text-slate-600 mt-1">
          Video, PDF ve soru ekleme · Alan, sınıf, ders, ünite, konu, kazanım seçimi zorunlu
        </p>
      </div>

      <div className="flex gap-3 mb-8">
        {(["video", "pdf", "soru"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSecim(t)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              secim === t ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t === "video" && <Video className="w-5 h-5" />}
            {t === "pdf" && <FileText className="w-5 h-5" />}
            {t === "soru" && <FileQuestion className="w-5 h-5" />}
            {t === "video" && "Video"}
            {t === "pdf" && "PDF Ders Notu"}
            {t === "soru" && "Soru"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-2xl">
        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl mb-6">
          Bu alanlar doldurulmadan içerik yayına alınamaz.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alan</label>
            <select className="w-full px-4 py-2 border border-slate-200 rounded-xl">
              <option value="">Seçin</option>
              <option>LGS</option>
              <option>TYT</option>
              <option>AYT</option>
              <option>KPSS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf</label>
            <select className="w-full px-4 py-2 border border-slate-200 rounded-xl">
              <option value="">Seçin</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>{i + 1}. Sınıf</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ders</label>
            <select className="w-full px-4 py-2 border border-slate-200 rounded-xl">
              <option value="">Seçin</option>
              <option>Matematik</option>
              <option>Fizik</option>
              <option>Türkçe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ünite / Konu</label>
            <input type="text" placeholder="Örn: Sayılar, Üslü Sayılar" className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kazanım Kodu</label>
            <input type="text" placeholder="Örn: M.8.1.1 (Üslü İfadeleri çözer)" className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
          </div>
          {secim === "video" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Video Yükle</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
                <Upload className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                Video dosyası sürükle veya tıkla
              </div>
            </div>
          )}
          {secim === "pdf" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PDF Yükle</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
                <Upload className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                PDF dosyası sürükle veya tıkla
              </div>
            </div>
          )}
          {secim === "soru" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Soru Görseli / PDF</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500">
                  Soru görseli veya PDF yükle
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Soru Tipi</label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                  <option>Klasik</option>
                  <option>Yeni Nesil</option>
                  <option>Paragraf</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zorluk</label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                  <option>Kolay</option>
                  <option>Orta</option>
                  <option>Zor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Çözüm Videosu (opsiyonel)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-500 text-sm">
                  Çözüm videosu ekle
                </div>
              </div>
            </>
          )}
        </div>
        <button className="mt-8 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl">
          İçeriği Yükle
        </button>
      </div>
    </div>
  );
}
