"use client";

import Link from "next/link";
import { mockCategories } from "@/lib/mock-data";
import { ChevronRight } from "lucide-react";

export default function OgrenciDerslerPage() {
  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Derslerim</h1>
        <p className="text-slate-600 mt-1">
          Konu anlatım videoları, PDF notlar, Anladım/Tekrar Et ile ilerleme
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/ogrenci/dersler/${cat.slug}`}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-teal-600">{cat.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{cat.unitCount} ünite</p>
            <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${cat.progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 mt-2">%{cat.progress} tamamlandı</p>
            <div className="mt-4 flex items-center text-teal-600 font-medium">
              Devam et
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
