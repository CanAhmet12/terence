"use client";

import { useState } from "react";
import { MessageSquare, Users, User, Clock, Send } from "lucide-react";

// web.MD: Sınıfa Mesaj, Özel Öğrenci Mesajı, Otomatik Hatırlatıcı
const mockSiniflar = ["10-A Matematik", "10-B Matematik", "9-A Fizik"];
const mockOgrenciler = ["Elif K.", "Ahmet Y.", "Zeynep K.", "Can D."];

export default function MesajPage() {
  const [tip, setTip] = useState<"sinif" | "ozel">("sinif");
  const [mesaj, setMesaj] = useState("");
  const [seciliSinif, setSeciliSinif] = useState("");
  const [seciliOgrenci, setSeciliOgrenci] = useState("");

  return (
    <div className="p-8 lg:p-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Mesaj & Duyuru</h1>
      <p className="text-slate-600 mb-8">Sınıfa mesaj, özel öğrenci mesajı, otomatik hatırlatıcı</p>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTip("sinif")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${
                tip === "sinif" ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Sınıfa Mesaj
            </button>
            <button
              onClick={() => setTip("ozel")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${
                tip === "ozel" ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <User className="w-4 h-4" />
              Özel Öğrenci Mesajı
            </button>
          </div>

          {tip === "sinif" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sınıf Seç</label>
                <select
                  value={seciliSinif}
                  onChange={(e) => setSeciliSinif(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="">Seçin</option>
                  {mockSiniflar.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {tip === "ozel" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Öğrenci Seç</label>
                <select
                  value={seciliOgrenci}
                  onChange={(e) => setSeciliOgrenci(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="">Seçin</option>
                  {mockOgrenciler.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Mesaj</label>
            <textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Mesajınızı yazın..."
              rows={4}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl resize-none"
            />
          </div>
          <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">
            <Send className="w-4 h-4" />
            Gönder
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-teal-600" />
              Otomatik Hatırlatıcılar
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Sistem otomatik olarak ödev teslim, deneme ve çalışma hatırlatmaları gönderir.
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Ödev teslim tarihi yaklaşınca öğrenciye bildirim</li>
              <li>• 3 gün çalışmayan öğrenciye hatırlatma</li>
              <li>• Riskteki öğrencinin velisine SMS</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Son Gönderilen Mesajlar
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-sm font-medium">10-A Matematik</p>
                <p className="text-sm text-slate-600 mt-1">Matematik ödevin teslim tarihi yarın. Lütfen tamamlayın.</p>
                <p className="text-xs text-slate-400 mt-2">2 gün önce</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
