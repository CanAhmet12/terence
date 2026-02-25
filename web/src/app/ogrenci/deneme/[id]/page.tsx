"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Clock, BarChart3, Lightbulb } from "lucide-react";
import { mockExams, mockKonuAnaliz } from "@/lib/mock-data";

// web.MD: Gerçek ÖSYM formatı, Süre Sayacı, Türkiye geneli sıralama, Konu analiz raporu, Net arttırma önerileri
export default function DenemeDetayPage() {
  const params = useParams();
  const id = params.id as string;
  const exam = mockExams.find((e) => e.id === Number(id));
  const [view, setView] = useState<"basla" | "sinav" | "sonuc">(
    exam?.completed ? "sonuc" : "basla"
  );
  const [timeLeft, setTimeLeft] = useState(exam ? exam.duration * 60 : 0); // saniye

  if (!exam) {
    return (
      <div className="p-8">
        <Link href="/ogrenci/deneme" className="text-teal-600">← Denemelere dön</Link>
        <p className="mt-4">Deneme bulunamadı.</p>
      </div>
    );
  }

  // Tamamlanmış deneme: Sonuç + Konu Analizi
  if (view === "sonuc" && exam.completed) {
    return (
      <div className="p-8 lg:p-12">
        <Link
          href="/ogrenci/deneme"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Denemelere dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{exam.name}</h1>
        <p className="text-slate-600 mb-8">Sonuç özeti · Konu analiz raporu · Net arttırma önerileri</p>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Toplam Net</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">{exam.score}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Türkiye Geneli Sıralama</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">#{exam.rank?.toLocaleString("tr-TR")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Deneme Türü</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{exam.type}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-10">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Konu Analiz Raporu
          </h2>
          <p className="text-sm text-slate-600 mb-4">Hangi kazanımda kaç yanlış yaptın, hangi kazanım netini düşürüyor</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3">Kazanım</th>
                  <th className="text-left py-3">Konu</th>
                  <th className="text-right py-3">Doğru</th>
                  <th className="text-right py-3">Yanlış</th>
                  <th className="text-right py-3">Başarı %</th>
                </tr>
              </thead>
              <tbody>
                {mockKonuAnaliz.map((k) => (
                  <tr key={k.kod} className="border-b border-slate-100">
                    <td className="py-3 font-medium">{k.kod}</td>
                    <td className="py-3">{k.konu}</td>
                    <td className="text-right py-3 text-green-600">{k.dogru}</td>
                    <td className="text-right py-3 text-red-600">{k.yanlis}</td>
                    <td className="text-right py-3">
                      <span className={k.yuzde < 60 ? "text-amber-600 font-medium" : "text-slate-900"}>
                        %{k.yuzde}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-teal-50 rounded-2xl border border-teal-200 p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-teal-600" />
            Net Arttırma Önerileri
          </h2>
          <ul className="space-y-2 text-slate-700">
            <li>• F.9.1.1 Hareket konusunda %40 başarı — Bu konuyu tekrar et, video izle</li>
            <li>• M.8.1.1 Üslü İfadeler zayıf — Günlük planına otomatik tekrar eklendi</li>
            <li>• Hedef net için haftada +1 net artış hedefle</li>
          </ul>
        </div>
      </div>
    );
  }

  // Başlatılmamış deneme
  if (view === "basla") {
    return (
      <div className="p-8 lg:p-12">
        <Link
          href="/ogrenci/deneme"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Denemelere dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{exam.name}</h1>
        <p className="text-slate-600 mb-6">Gerçek ÖSYM formatı · {exam.questionCount} soru · {exam.duration} dakika</p>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md">
          <ul className="space-y-2 text-sm text-slate-600 mb-6">
            <li>• Süre sayacı ile gerçek sınav deneyimi</li>
            <li>• Soru navigasyonu, atlayıp sonra dönebilirsin</li>
            <li>• Bitirince Türkiye geneli sıralama ve konu analizi</li>
          </ul>
          <button
            onClick={() => {
              setView("sinav");
              setTimeLeft(exam.duration * 60);
            }}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl"
          >
            Denemeyi Başlat
          </button>
        </div>
      </div>
    );
  }

  // Sınav modu - Süre sayacı, soru simülasyonu
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          <span className="font-mono font-semibold text-slate-900">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
        <span className="text-slate-600">{exam.name}</span>
      </div>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-6">
          <p className="text-slate-500 mb-4">Soru 1 / {exam.questionCount}</p>
          <p className="text-slate-800 leading-relaxed mb-6">
            Gerçek ÖSYM formatında sorular burada gösterilir. Backend entegrasyonu ile soru metni yüklenecek.
            Şimdilik sınav arayüzü (süre sayacı, soru navigasyonu) simüle ediliyor.
          </p>
          <div className="space-y-3">
            {["A", "B", "C", "D", "E"].map((opt) => (
              <label key={opt} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input type="radio" name="cevap" className="w-4 h-4 text-teal-600" />
                <span>{opt}) Seçenek metni</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: Math.min(exam.questionCount, 20) }).map((_, i) => (
            <button
              key={i}
              className="w-10 h-10 rounded-lg border border-slate-200 hover:bg-teal-50 hover:border-teal-200 text-sm font-medium"
            >
              {i + 1}
            </button>
          ))}
          {exam.questionCount > 20 && <span className="py-2">...</span>}
        </div>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setView("basla")}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            Çıkış
          </button>
          <button className="px-6 py-2 bg-teal-600 text-white rounded-xl font-medium">
            Teslim Et
          </button>
        </div>
      </div>
    </div>
  );
}
