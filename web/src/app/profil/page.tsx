"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  User,
  Mail,
  Lock,
  Save,
  Briefcase,
  Bell,
  ChevronRight,
  Camera,
  CheckCircle,
  AlertCircle,
  Phone,
} from "lucide-react";

const SINIFLAR = Array.from({ length: 12 }, (_, i) => i + 1);
const ALANLAR = [
  { value: "LGS", label: "LGS" },
  { value: "TYT", label: "TYT" },
  { value: "AYT", label: "AYT" },
  { value: "TYT-AYT", label: "TYT-AYT" },
  { value: "KPSS", label: "KPSS" },
];

type SaveState = "idle" | "saving" | "success" | "error";

export default function ProfilPage() {
  const { user, token, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sinif, setSinif] = useState("");
  const [alan, setAlan] = useState("TYT-AYT");
  const [hedefOkul, setHedefOkul] = useState("");
  const [hedefBolum, setHedefBolum] = useState("");
  const [brans, setBrans] = useState("");
  const [ozgecmis, setOzgecmis] = useState("");
  const [bildirimCalisma, setBildirimCalisma] = useState(true);
  const [bildirimDeneme, setBildirimDeneme] = useState(true);
  const [bildirimHedef, setBildirimHedef] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);



  useEffect(() => {
    if (!user) {
      router.replace("/giris");
      return;
    }
    setName(user.name);
    setPhone(user.phone || "");
    setPhotoPreview(user.profile_photo_url || null);

    if (user.role === "student" && user.goal) {
      setSinif(String(user.goal.grade ?? ""));
      setAlan(user.goal.exam_type || "TYT-AYT");
      setHedefOkul(user.goal.target_school || "");
      setHedefBolum(user.goal.target_department || "");
    }
  }, [user, router]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setPhotoUploading(true);

    try {
      const res = await api.uploadProfilePhoto(token, file);
      const updated = await api.updateProfile(token, { profile_photo_url: res.url });
      updateUser(updated);
    } catch {
      setPhotoPreview(user?.profile_photo_url || null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaveState("saving");
    setSaveError("");
    try {
      const updated = await api.updateProfile(token, { name, phone: phone || undefined });
      updateUser(updated);

      if (user?.role === "student") {
        await api.updateGoal(token, {
          exam_type: alan as "TYT" | "AYT" | "LGS" | "KPSS",
          grade: sinif ? Number(sinif) : undefined,
          target_school: hedefOkul || undefined,
          target_department: hedefBolum || undefined,
        });
      }

      await api.updateNotificationPreferences(token, {
        daily_reminders: bildirimCalisma,
        risk_alerts: bildirimHedef,
        email_notifications: bildirimDeneme,
      });

      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Kayıt başarısız");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 5000);
    }
  };

  if (!user) return null;

  const isStudent = user.role === "student";
  const isTeacher = user.role === "teacher";
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-slate-50/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900">Profil Düzenle</h1>
            <p className="text-slate-600 mt-1">Hesap bilgilerinizi ve tercihlerinizi güncelleyin</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Avatar */}
            <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
                    {photoPreview ? (
                      photoPreview.startsWith("blob:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoPreview} alt="Profil önizleme" className="w-full h-full object-cover" />
                      ) : (
                        <Image src={photoPreview} alt="Profil fotoğrafı" width={96} height={96} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <span className="text-white font-bold text-2xl">{initials}</span>
                    )}
                    {photoUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-slate-900 text-lg">{user.name}</p>
                  <p className="text-slate-500">
                    {user.role === "student" ? "Öğrenci" : user.role === "teacher" ? "Öğretmen" : user.role === "parent" ? "Veli" : "Admin"}
                  </p>
                  {user.subscription_plan && (
                    <span className="inline-flex items-center mt-1 px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full capitalize">
                      {user.subscription_plan} paketi
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Geri bildirim */}
              {saveState === "success" && (
                <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-700 text-sm font-medium">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  Profil bilgileriniz başarıyla güncellendi.
                </div>
              )}
              {saveState === "error" && saveError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {saveError}
                </div>
              )}

              {/* Temel Bilgiler */}
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
                      required
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
                      value={user.email}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">E-posta değişikliği için destek ile iletişime geçin.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Telefon <span className="text-slate-400 font-normal">(opsiyonel)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Öğrenci alanları */}
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
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Sınav</label>
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

              {/* Öğretmen alanları */}
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

              {/* Bildirimler */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-teal-600" />
                  Bildirim Tercihleri
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                    <span className="text-slate-700 font-medium">Çalışma hatırlatmaları</span>
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
                disabled={saveState === "saving"}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
              >
                {saveState === "saving" ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Değişiklikleri Kaydet
                  </>
                )}
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




