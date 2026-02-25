"use client";

import { Calendar, Check, Plus } from "lucide-react";

export default function PlanPage() {
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const todayTasks = [
    { id: 1, text: "M.8.1.1 Üslü İfadeler - 10 soru", done: true },
    { id: 2, text: "Fizik Hareket - Video izle", done: true },
    { id: 3, text: "TYT Deneme - 40 soru", done: false },
  ];

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Günlük Çalışma Takvimi</h1>
        <p className="text-slate-600 mt-1">
          Bugünkü görevler. Bitirince tik at. Sistem otomatik yeni görev ekler.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                Bugün - 25 Şubat 2025
              </h2>
              <span className="text-sm text-teal-600 font-medium">
                {todayTasks.filter((t) => t.done).length}/{todayTasks.length} tamamlandı
              </span>
            </div>
            <ul className="space-y-3">
              {todayTasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    task.done ? "bg-teal-50 border-teal-100" : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-pointer ${
                      task.done ? "bg-teal-500 text-white" : "bg-slate-200 hover:bg-slate-300"
                    }`}
                  >
                    {task.done ? <Check className="w-5 h-5" /> : null}
                  </div>
                  <span
                    className={
                      task.done ? "text-slate-600 line-through" : "text-slate-900 font-medium"
                    }
                  >
                    {task.text}
                  </span>
                </li>
              ))}
            </ul>
            <button className="mt-4 flex items-center gap-2 text-teal-600 font-medium hover:text-teal-700">
              <Plus className="w-4 h-4" />
              Yeni görev ekle
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Haftalık Özet</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Tamamlanan görev</span>
                <span className="font-semibold">18/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Çalışma süresi</span>
                <span className="font-semibold">12s 45dk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Çözülen soru</span>
                <span className="font-semibold">156</span>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
            <p className="text-sm text-amber-800">
              Bu hızla devam edersen hedef bölüm risk altında. Veliye bildirim gönderildi.
            </p>
            <button className="mt-4 text-sm font-medium text-amber-700 hover:underline">
              Paket yükseltme önerisi →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
