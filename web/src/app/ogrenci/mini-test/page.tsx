"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

// web.MD: Anında doğru - yanlış, Süre Sayacı, Yanlış Sorulara Otomatik Tekrar
const mockSorular = [
  { id: 1, metin: "2³ · 2⁴ işleminin sonucu kaçtır?", secenekler: ["16", "32", "64", "128"], dogru: 3 },
  { id: 2, metin: "√16 + √9 işleminin sonucu kaçtır?", secenekler: ["5", "6", "7", "8"], dogru: 2 },
  { id: 3, metin: "3x + 5 = 20 ise x kaçtır?", secenekler: ["3", "4", "5", "6"], dogru: 2 },
];

export default function MiniTestPage() {
  const [basladi, setBasladi] = useState(false);
  const [soruIndex, setSoruIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Record<number, number | null>>({});
  const [sonuc, setSonuc] = useState<Record<number, boolean> | null>(null);
  const [sure, setSure] = useState(300); // 5 dk süre sayacı

  const tumCevaplanmis = Object.keys(cevaplar).length === mockSorular.length;
  const secilen = cevaplar[soruIndex];
  const mevcutSoru = mockSorular[soruIndex];
  const dogruSayisi = Object.entries(sonuc || {}).filter(([, v]) => v).length;

  // Süre sayacı
  useEffect(() => {
    if (!basladi || tumCevaplanmis) return;
    const t = setInterval(() => setSure((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [basladi, tumCevaplanmis]);

  const cevapVer = (secim: number) => {
    if (sonuc !== null) return;
    const dogruMu = secim === mevcutSoru.dogru;
    setCevaplar((p) => ({ ...p, [soruIndex]: secim }));
    setSonuc((p) => ({ ...(p || {}), [soruIndex]: dogruMu }));
  };

  const sonrakiSoru = () => {
    if (soruIndex < mockSorular.length - 1) {
      setSoruIndex((i) => i + 1);
      setSonuc(null);
    }
  };

  const yanlisTekrar = () => {
    const yanlisIndeksler = Object.entries(sonuc || {})
      .filter(([, v]) => !v)
      .map(([k]) => parseInt(k, 10));
    if (yanlisIndeksler.length > 0) {
      setSoruIndex(yanlisIndeksler[0]);
      setSonuc(null);
      setCevaplar((p) => {
        const n = { ...p };
        delete n[yanlisIndeksler[0]];
        return n;
      });
    }
  };

  if (!basladi) {
    return (
      <div className="p-8 lg:p-12">
        <Link href="/ogrenci" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Ana panele dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Mini Test</h1>
        <p className="text-slate-600 mb-6">
          Anında doğru/yanlış · Süre sayacı · Yanlış sorulara otomatik tekrar
        </p>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md">
          <ul className="space-y-2 text-sm text-slate-600 mb-6">
            <li>• 5 dakika süre</li>
            <li>• Her soruda anında doğru/yanlış gösterilir</li>
            <li>• Yanlış yaptıkların otomatik tekrar edilir</li>
          </ul>
          <button
            onClick={() => setBasladi(true)}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl"
          >
            Testi Başlat
          </button>
        </div>
      </div>
    );
  }

  if (tumCevaplanmis && !Object.values(cevaplar).some((v) => v === null)) {
    return (
      <div className="p-8 lg:p-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Test Tamamlandı</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <p className="text-3xl font-bold text-teal-600">{dogruSayisi} / {mockSorular.length}</p>
          <p className="text-slate-600 mt-1">Doğru cevap</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={yanlisTekrar}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Yanlışları Tekrarla
          </button>
          <Link href="/ogrenci" className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50">
            Panele Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-center justify-between mb-6">
        <Link href="/ogrenci" className="text-slate-600 hover:text-teal-600">← Çıkış</Link>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          <span className="font-mono font-semibold">{Math.floor(sure / 60)}:{(sure % 60).toString().padStart(2, "0")}</span>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <p className="text-sm text-slate-500 mb-2">Soru {soruIndex + 1} / {mockSorular.length}</p>
        <p className="text-lg text-slate-800 mb-6">{mevcutSoru.metin}</p>
        <div className="space-y-3">
          {mevcutSoru.secenekler.map((sec, i) => {
            const secildi = secilen === i;
            const dogruCevap = i === mevcutSoru.dogru;
            const goster = sonuc !== null;
            const dogruGoster = goster && secildi && dogruCevap;
            const yanlisGoster = goster && secildi && !dogruCevap;
            return (
              <button
                key={i}
                onClick={() => cevapVer(i)}
                disabled={sonuc !== null}
                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                  dogruGoster ? "border-green-500 bg-green-50" :
                  yanlisGoster ? "border-red-500 bg-red-50" :
                  secildi ? "border-teal-300 bg-teal-50" :
                  "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{String.fromCharCode(65 + i)}) {sec}</span>
                {dogruGoster && <CheckCircle className="w-5 h-5 text-green-600" />}
                {yanlisGoster && <XCircle className="w-5 h-5 text-red-600" />}
              </button>
            );
          })}
        </div>
        {sonuc !== null && (
          <div className="mt-6 flex justify-between">
            <p className="text-sm font-medium">
              {sonuc[soruIndex] ? (
                <span className="text-green-600">✓ Doğru!</span>
              ) : (
                <span className="text-red-600">✗ Yanlış. Doğru cevap: {String.fromCharCode(65 + mevcutSoru.dogru)}</span>
              )}
            </p>
            <button
              onClick={sonrakiSoru}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700"
            >
              {soruIndex < mockSorular.length - 1 ? "Sonraki Soru" : "Bitir"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
