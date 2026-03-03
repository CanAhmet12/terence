"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, CheckCircle, RefreshCw, Play, FileText } from "lucide-react";

const dersler = [
  {
    id: 1, slug: "matematik", name: "Matematik", sinif: "10-A & 10-B",
    uniteler: [
      {
        id: 1, name: "Sayılar ve Cebir",
        konular: [
          { id: 1, name: "Üslü İfadeler", kazanim: "M.10.1.1", video: true, pdf: true, ilerleme: 90 },
          { id: 2, name: "Köklü İfadeler", kazanim: "M.10.1.2", video: true, pdf: true, ilerleme: 75 },
          { id: 3, name: "Denklemler", kazanim: "M.10.1.3", video: false, pdf: true, ilerleme: 40 },
        ]
      },
      {
        id: 2, name: "Fonksiyonlar",
        konular: [
          { id: 4, name: "Fonksiyon Tanımı", kazanim: "M.10.2.1", video: true, pdf: false, ilerleme: 60 },
          { id: 5, name: "Bileşke Fonksiyon", kazanim: "M.10.2.2", video: false, pdf: false, ilerleme: 20 },
        ]
      },
    ]
  },
  {
    id: 2, slug: "fizik", name: "Fizik", sinif: "11-A",
    uniteler: [
      {
        id: 3, name: "Kuvvet ve Hareket",
        konular: [
          { id: 6, name: "Newton Yasaları", kazanim: "F.11.1.1", video: true, pdf: true, ilerleme: 85 },
          { id: 7, name: "Sürtünme Kuvveti", kazanim: "F.11.1.2", video: true, pdf: false, ilerleme: 55 },
        ]
      }
    ]
  }
];

export default function OgretmenDerslerPage() {
  const [acikDers, setAcikDers] = useState<number | null>(1);
  const [acikUnite, setAcikUnite] = useState<number | null>(1);

  const seciliDers = dersler.find((d) => d.id === acikDers);

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Derslerim</h1>
        <p className="text-slate-600 mt-1">Ünite → Konu → Kazanım yapısı · İlerleme barları · Video & PDF yönetimi</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Ders listesi */}
        <div className="lg:col-span-1 space-y-2">
          {dersler.map((d) => (
            <button
              key={d.id}
              onClick={() => { setAcikDers(d.id); setAcikUnite(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                acikDers === d.id ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.sinif}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Ünite-Konu-Kazanım */}
        <div className="lg:col-span-3 space-y-4">
          {seciliDers?.uniteler.map((unite) => (
            <div key={unite.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setAcikUnite(acikUnite === unite.id ? null : unite.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    {acikUnite === unite.id
                      ? <ChevronDown className="w-5 h-5 text-slate-600" />
                      : <ChevronRight className="w-5 h-5 text-slate-600" />
                    }
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{unite.name}</p>
                    <p className="text-xs text-slate-500">{unite.konular.length} konu</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Genel ilerleme */}
                  <div className="hidden sm:block w-32">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{
                          width: `${Math.round(unite.konular.reduce((a, k) => a + k.ilerleme, 0) / unite.konular.length)}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-right">
                      %{Math.round(unite.konular.reduce((a, k) => a + k.ilerleme, 0) / unite.konular.length)} ort.
                    </p>
                  </div>
                </div>
              </button>

              {acikUnite === unite.id && (
                <div className="border-t border-slate-100">
                  {unite.konular.map((konu) => (
                    <div key={konu.id} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-900">{konu.name}</span>
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-mono rounded-md">{konu.kazanim}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                konu.ilerleme >= 75 ? "bg-green-500" :
                                konu.ilerleme >= 40 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${konu.ilerleme}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600 w-10 text-right">%{konu.ilerleme}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {konu.video ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-600 rounded-lg text-xs font-medium">
                            <Play className="w-3 h-3" /> Video
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs">
                            Video Yok
                          </span>
                        )}
                        {konu.pdf ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                            <FileText className="w-3 h-3" /> PDF
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs">
                            PDF Yok
                          </span>
                        )}
                        <div className="flex gap-1 ml-2">
                          <button className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
                            <CheckCircle className="w-3.5 h-3.5" /> Anladım
                          </button>
                          <button className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100">
                            <RefreshCw className="w-3.5 h-3.5" /> Tekrar Et
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {!seciliDers && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Soldaki listeden bir ders seçin</p>
            </div>
          )}

          <Link
            href="/ogretmen/icerik"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-lg shadow-teal-500/20"
          >
            + Yeni İçerik Ekle (Video / PDF / Soru)
          </Link>
        </div>
      </div>
    </div>
  );
}
