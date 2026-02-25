"use client";

import Link from "next/link";
import { mockExams } from "@/lib/mock-data";
import { Play, CheckCircle, Award, BarChart3 } from "lucide-react";

// web.MD: Online Sınav Modu, Türkiye Geneli Sıralama, Net Analizi, Konu analiz raporu
export default function DenemePage() {
  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Online Denemeler</h1>
        <p className="text-slate-600 mt-1">
          Gerçek ÖSYM formatı · Türkiye geneli sıralama · Konu analiz raporu
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full">
                {exam.type}
              </span>
              {exam.completed && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{exam.name}</h3>
            <div className="flex gap-4 text-sm text-slate-500 mb-4">
              <span>{exam.questionCount} soru</span>
              <span>{exam.duration} dk</span>
            </div>
            {exam.completed && exam.score !== undefined && (
              <div className="mb-4 space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  <span className="font-semibold text-slate-900">{exam.score} net</span>
                </div>
                {exam.rank && (
                  <div className="p-3 rounded-xl bg-amber-50 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="text-sm">Türkiye Geneli: <strong>#{exam.rank.toLocaleString("tr-TR")}</strong></span>
                  </div>
                )}
              </div>
            )}
            <Link
              href={`/ogrenci/deneme/${exam.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl"
            >
              <Play className="w-5 h-5" />
              {exam.completed ? "Sonuç & Konu Analizi" : "Başla"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
