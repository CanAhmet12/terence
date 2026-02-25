"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Bell } from "lucide-react";

// web.MD: SMS / Mail bildirimleri - Çalışma hatırlatması, Deneme uyarısı, Hedef risk
const ayarlar = [
  { key: "calisma", label: "Çalışma Hatırlatmaları", desc: "Çocuğunuz çalışmadığında veya günlük hedefe ulaşmadığında" },
  { key: "deneme", label: "Deneme Uyarıları", desc: "Yaklaşan deneme sınavları, sonuç bildirimleri" },
  { key: "hedef", label: "Hedef Risk Uyarısı", desc: "Hedef bölüme ulaşma riski olduğunda" },
];

export default function VeliBildirimPage() {
  const [sms, setSms] = useState<Record<string, boolean>>({ calisma: true, deneme: true, hedef: true });
  const [mail, setMail] = useState<Record<string, boolean>>({ calisma: true, deneme: true, hedef: true });

  return (
    <div className="p-8 lg:p-12">
      <Link href="/veli" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Panele dön
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Bildirim Ayarları</h1>
      <p className="text-slate-600 mb-8">SMS ve e-posta ile çocuğunuzun çalışma durumunu takip edin</p>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl">
        {ayarlar.map((a) => (
          <div key={a.key} className="py-6 border-b border-slate-100 last:border-0">
            <h3 className="font-semibold text-slate-900">{a.label}</h3>
            <p className="text-sm text-slate-600 mt-1">{a.desc}</p>
            <div className="mt-4 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sms[a.key] ?? false}
                  onChange={(e) => setSms((p) => ({ ...p, [a.key]: e.target.checked }))}
                  className="w-4 h-4 rounded text-teal-600"
                />
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mail[a.key] ?? false}
                  onChange={(e) => setMail((p) => ({ ...p, [a.key]: e.target.checked }))}
                  className="w-4 h-4 rounded text-teal-600"
                />
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">E-posta</span>
              </label>
            </div>
          </div>
        ))}
        <button className="mt-6 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl">
          Kaydet
        </button>
      </div>
    </div>
  );
}
