"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { User, Mail, Lock, Save, Briefcase, Bell, ChevronRight } from "lucide-react";

const SINIFLAR = Array.from({ length: 12 }, (_, i) => i + 1);
const ALANLAR = [
  { value: "lgs", label: "LGS" },
  { value: "tyt", label: "TYT" },
  { value: "ayt", label: "AYT" },
  { value: "tyt-ayt", label: "TYT-AYT" },
  { value: "kpss", label: "KPSS" },
];

export default function ProfilPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [sinif, setSinif] = useState("");
  const [alan, setAlan] = useState("");
  const [hedefOkul, setHedefOkul] = useState("");
  const [hedefBolum, setHedefBolum] = useState("");
  const [brans, setBrans] = useState("");
  const [ozgecmis, setOzgecmis] = useState("");
  const [bildirimCalisma, setBildirimCalisma] = useState(true);
  const [bildirimDeneme, setBildirimDeneme] = useState(true);
  const [bildirimHedef, setBildirimHedef] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/giris");
      return;
    }
    setName(user.name);
    setEmail(user.email);
    if (user.role === "student") {
      setSinif("10");
      setAlan("tyt-ayt");
      setHedefOkul("İstanbul Üniversitesi");
      setHedefBolum("Hukuk");
    }
    if (user.role === "teacher") {
      setBrans("Matematik");
      setOzgecmis("10 yıllık deneyim, LGS-TYT-AYT uzmanı");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  if (!user) return null;

  const isStudent = user.role === "student";
  const isTeacher = user.role === "teacher";

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-slate-50/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900">Profil Düzenle</h1>
            <p className="text-slate-600 mt-1">Hesap bilgilerinizi ve tercihlerinizi güncelleyin</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Avatar alanı */}
            <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <User className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-slate-900 text-lg">{user.name}</p>
                  <p className="text-slate-500 capitalize">{user.role === "student" ? "Öğrenci" : user.role === "teacher" ? "Öğretmen" : user.role === "parent" ? "Veli" : "Admin"}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  Temel Bilgiler
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">E-posta değişikliği için destek ile iletişime geçin.</p>
                </div>
              </div>

              {isStudent && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900">Hedef Bilgileri</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Sınıf</label>
                      <select
                        value={sinif}
                        onChange={(e) => setSinif(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      >
                        <option value="">Seçin</option>
                        {SINIFLAR.map((s) => (
                          <option key={s} value={s}>{s}. Sınıf</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Sınav / Alan</label>
                      <select
                        value={alan}
                        onChange={(e) => setAlan(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      >
                        {ALANLAR.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Okul</label>
                    <input
                      type="text"
                      value={hedefOkul}
                      onChange={(e) => setHedefOkul(e.target.value)}
                      placeholder="Örn: İstanbul Üniversitesi"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Bölüm</label>
                    <input
                      type="text"
                      value={hedefBolum}
                      onChange={(e) => setHedefBolum(e.target.value)}
                      placeholder="Örn: Hukuk"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {isTeacher && (
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-teal-600" />
                    Öğretmen Bilgileri
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Branş / Uzmanlık</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={brans}
                        onChange={(e) => setBrans(e.target.value)}
                        placeholder="Örn: Matematik, Fizik"
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Kısa Özgeçmiş</label>
                    <textarea
                      value={ozgecmis}
                      onChange={(e) => setOzgecmis(e.target.value)}
                      placeholder="Öğrenciler için görünür kısa tanıtım"
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-teal-600" />
                  Bildirim Tercihleri
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                    <span className="text-slate-700 font-medium">{isTeacher ? "Ödev & çalışma hatırlatmaları" : "Çalışma hatırlatmaları"}</span>
                    <input type="checkbox" checked={bildirimCalisma} onChange={(e) => setBildirimCalisma(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  </label>
                  <label className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                    <span className="text-slate-700 font-medium">Deneme uyarıları</span>
                    <input type="checkbox" checked={bildirimDeneme} onChange={(e) => setBildirimDeneme(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  </label>
                  {isStudent && (
                    <label className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                      <span className="text-slate-700 font-medium">Hedef risk uyarısı</span>
                      <input type="checkbox" checked={bildirimHedef} onChange={(e) => setBildirimHedef(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
              >
                <Save className="w-5 h-5" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </form>
          </div>

          <div className="mt-6 space-y-2">
            <Link
              href="/sifre-degistir"
              className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/80 hover:border-teal-200 transition-colors group"
            >
              <span className="flex items-center gap-3 text-slate-700 font-medium">
                <Lock className="w-5 h-5 text-teal-600" />
                Şifre değiştir
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600" />
            </Link>
            <Link
              href="/bildirimler"
              className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/80 hover:border-teal-200 transition-colors group"
            >
              <span className="flex items-center gap-3 text-slate-700 font-medium">
                <Bell className="w-5 h-5 text-teal-600" />
                Bildirimler
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
