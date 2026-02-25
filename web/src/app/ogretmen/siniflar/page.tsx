"use client";

import { useState } from "react";
import { Search, Circle } from "lucide-react";

const mockClasses = [
  { id: 1, name: "10-A Matematik", studentCount: 24, avgNet: 48.5, status: "good" as const },
  { id: 2, name: "10-B Matematik", studentCount: 22, avgNet: 42.1, status: "warning" as const },
  { id: 3, name: "11-A Fizik", studentCount: 18, avgNet: 38.2, status: "risk" as const },
];

const mockStudents = [
  { name: "Ahmet Yılmaz", net: 52, status: "good" as const },
  { name: "Zeynep Kaya", net: 45, status: "warning" as const },
  { name: "Mehmet Demir", net: 35, status: "risk" as const },
];

const statusConfig = {
  good: { color: "text-green-500", bg: "bg-green-100", label: "İyi" },
  warning: { color: "text-amber-500", bg: "bg-amber-100", label: "Riskli" },
  risk: { color: "text-red-500", bg: "bg-red-100", label: "Çok Riskli" },
};

export default function SiniflarPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(1);
  const [search, setSearch] = useState("");

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sınıflarım</h1>
        <p className="text-slate-600 mt-1">Öğrenci bazlı durum ikonları (yeşil / sarı / kırmızı)</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sınıf ara..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {mockClasses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.id)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selectedClass === c.id
                  ? "bg-teal-50 border-teal-200"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{c.name}</span>
                <span className={`w-3 h-3 rounded-full ${statusConfig[c.status].bg}`} />
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {c.studentCount} öğrenci · Ort. {c.avgNet} net
              </p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <span className="font-medium text-slate-900">Öğrenci Listesi</span>
              <span className="text-sm text-slate-500">— Durum: Yeşil İyi, Sarı Riskli, Kırmızı Çok Riskli</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Öğrenci</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Net</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Durum</th>
                </tr>
              </thead>
              <tbody>
                {mockStudents.map((s) => (
                  <tr key={s.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{s.name}</td>
                    <td className="p-4">{s.net}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[s.status].bg} ${statusConfig[s.status].color}`}>
                        <Circle className="w-2.5 h-2.5 fill-current" />
                        {statusConfig[s.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
