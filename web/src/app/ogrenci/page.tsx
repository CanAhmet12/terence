"use client";

import { useState } from "react";
import { Check, Clock, Target } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const initialTasks = [
  { id: 1, text: "M.8.1.1 Üslü İfadeler - 10 soru", done: true },
  { id: 2, text: "Fizik Hareket - Video izle", done: true },
  { id: 3, text: "TYT Deneme - 40 soru", done: false },
  { id: 4, text: "M.8.1.2 Tekrar - 5 soru", done: false },
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Merhaba, {user?.name || "Öğrenci"}
        </h1>
        <p className="text-slate-600 mt-1 text-lg">Bugünkü hedeflerini takip et</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900 text-lg">Bugünkü Görevler</h2>
            <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">
              {doneCount}/{tasks.length} tamamlandı
            </span>
          </div>
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  task.done
                    ? "bg-teal-50/80 border-teal-100 hover:bg-teal-50"
                    : "bg-slate-50/80 border-slate-100 hover:bg-slate-100/80"
                }`}
                onClick={() => toggleTask(task.id)}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    task.done ? "bg-teal-500 text-white" : "bg-slate-200 hover:bg-slate-300"
                  }`}
                >
                  {task.done ? <Check className="w-4 h-4" strokeWidth={2.5} /> : null}
                </div>
                <span
                  className={`font-medium ${task.done ? "text-slate-600 line-through" : "text-slate-900"}`}
                >
                  {task.text}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-slate-500">
            Görev bitirince tikla. Sistem otomatik yeni görev ekler.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="font-bold text-slate-900 mb-5">Kalan Hedef</h2>
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                <p className="text-sm text-slate-500 font-medium">Hedef Net (TYT)</p>
                <p className="text-2xl font-bold text-teal-600 mt-0.5">75</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Sınava Kalan Gün</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">165</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-sm text-slate-500 font-medium">Bu Hafta Hedef Net</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">+1</p>
              </div>
            </div>
            <Link
              href="/ogrenci/hedef"
              className="mt-5 block text-center py-3 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors"
            >
              Hedefi Düzenle
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="font-bold text-slate-900">Çalışma Süresi</h2>
            </div>
            <p className="text-3xl font-bold text-slate-900">2s 34dk</p>
            <p className="text-sm text-slate-500 mt-1">Bugün</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="font-bold text-slate-900">Seviye</h2>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all"
                style={{ width: "65%" }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">Seviye 12 - %65</p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 hover:shadow-md transition-shadow">
          <p className="font-bold text-amber-900">⚠️ Hedef Riski</p>
          <p className="text-sm text-amber-800 mt-1 leading-relaxed">Bu hızla devam edersen hedef bölüm risk altında. Veliye bildirim gönderildi.</p>
          <Link href="/ogrenci/hedef" className="text-sm font-semibold text-amber-700 mt-3 inline-flex items-center gap-1 hover:underline">
            Hedefimi kontrol et →
          </Link>
        </div>
        <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200/80 hover:shadow-md transition-shadow">
          <p className="font-bold text-teal-900">🚀 Paket Önerisi</p>
          <p className="text-sm text-teal-800 mt-1 leading-relaxed">Bu hedef için Pro pakete geçersen net artış ihtimalin %43 artar.</p>
          <Link href="/#paketler" className="text-sm font-semibold text-teal-700 mt-3 inline-flex items-center gap-1 hover:underline">
            Paketleri incele →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-slate-900 text-lg">Haftalık Net Artışı</h2>
          <Link href="/ogrenci/rapor" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Detaylı Rapor →
          </Link>
        </div>
        <div className="flex items-end gap-2 h-36">
          {[42, 45, 43, 48, 47, 49, 52].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-teal-600 to-teal-400 transition-all hover:from-teal-700 min-h-[20px]"
                style={{ height: `${(val / 60) * 100}%` }}
              />
              <span className="text-xs font-medium text-slate-500">
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][i]}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-slate-500">Bu hafta +3 net artış. Hedefine doğru ilerliyorsun.</p>
      </div>
    </div>
  );
}
