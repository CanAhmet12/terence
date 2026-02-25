"use client";

import Link from "next/link";
import { ArrowLeft, Globe, Palette, Shield, Key } from "lucide-react";

// web.MD: Dil, tema, kullanım koşulları, API yönetimi, güvenlik logları
export default function AdminAyarlarPage() {
  return (
    <div className="p-8 lg:p-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Panele dön
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Sistem Ayarları</h1>
      <p className="text-slate-600 mb-8">Dil, tema, API, güvenlik logları</p>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-teal-600" />
            Dil Seçenekleri
          </h2>
          <select className="w-full px-4 py-2 border border-slate-200 rounded-xl">
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-teal-600" />
            Tema Ayarları
          </h2>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tema" defaultChecked className="w-4 h-4 text-teal-600" />
              <span className="text-sm">Açık</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tema" className="w-4 h-4 text-teal-600" />
              <span className="text-sm">Koyu</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-teal-600" />
            API Yönetimi
          </h2>
          <p className="text-sm text-slate-600 mb-4">API anahtarları ve versiyon kontrolü</p>
          <div className="p-4 bg-slate-50 rounded-xl font-mono text-sm">API_URL: https://api.terenceegitim.com</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-teal-600" />
            Güvenlik Logları
          </h2>
          <p className="text-sm text-slate-600 mb-4">Kim giriş yaptı, hangi işlemler yapıldı</p>
          <div className="space-y-2">
            {[
              { user: "admin@terence.com", action: "Giriş yaptı", time: "25 Şub 14:32" },
              { user: "admin@terence.com", action: "Kullanıcı düzenlendi", time: "25 Şub 14:15" },
              { user: "admin@terence.com", action: "İçerik silindi", time: "25 Şub 13:45" },
            ].map((log, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span>{log.user} — {log.action}</span>
                <span className="text-slate-500">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl">
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );
}
