"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Camera,
  CheckCircle,
  AlertCircle,
  Target,
  School,
  BookOpen,
  Star,
  Shield,
  Bell,
  ChevronRight,
  GraduationCap,
  TrendingUp,
  Award,
} from "lucide-react";

const SINIFLAR = Array.from({ length: 12 }, (_, i) => i + 1);
const SINAVLAR = [
  { value: "LGS", label: "LGS (Lise Giriş Sınavı)", desc: "8. sınıf" },
  { value: "TYT", label: "TYT (Temel Yetenek Testi)", desc: "Ön lisans / 2 yıllık" },
  { value: "AYT", label: "AYT (Alan Yetenek Testi)", desc: "Lisans / 4 yıllık" },
  { value: "TYT-AYT", label: "TYT + AYT (Her ikisi)", desc: "4 yıllık üniversite" },
  { value: "KPSS", label: "KPSS (Kamu Personel)", desc: "Devlet memurluğu" },
];
const BRANSLAR = [
  "Matematik","Türkçe","Fizik","Kimya","Biyoloji","Tarih","Coğrafya",
  "İngilizce","Edebiyat","Felsefe","Geometri","TYT Matematik","Diğer",
];

type Tab = "profil" | "hedef" | "bildirimler" | "guvenlik";
type SaveState = "idle" | "saving" | "success" | "error";

export default function OgrenciProfilPage() {
  const { user, token, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profil");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Temel bilgiler
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [brans, setBrans] = useState("");

  // Hedef bilgileri
  const [sinif, setSinif] = useState("");
  const [hedefSinav, setHedefSinav] = useState("TYT-AYT");
  const [hedefOkul, setHedefOkul] = useState("");
  const [hedefBolum, setHedefBolum] = useState("");
  const [hedefNet, setHedefNet] = useState("");

  // Bildirimler
  const [bildirimCalisma, setBildirimCalisma] = useState(true);
  const [bildirimDeneme, setBildirimDeneme] = useState(true);
  const [bildirimHedef, setBildirimHedef] = useState(true);

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const isParent = user?.role === "parent";

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setPhotoPreview(user.profile_photo_url ?? null);

    if (isStudent && user.goal) {
      setSinif(user.goal.grade ? String(user.goal.grade) : "");
      setHedefSinav(user.goal.exam_type ?? "TYT-AYT");
      setHedefOkul(user.goal.target_school ?? "");
      setHedefBolum(user.goal.target_department ?? "");
      setHedefNet(user.goal.target_net ? String(user.goal.target_net) : "");
    }
    if (isTeacher) {
      setBrans(user.subject ?? "");
    }
  }, [user, isStudent, isTeacher]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const res = await api.uploadProfilePhoto(token, file);
      const updated = await api.updateProfile(token, { profile_photo_url: res.url });
      updateUser(updated);
    } catch {
      setPhotoPreview(user?.profile_photo_url ?? null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveState("saving"); setSaveError("");
    try {
      const profileData: Record<string, string | undefined> = { name, phone: phone || undefined };
      if (isTeacher) {
        profileData.bio = bio || undefined;
        profileData.subject = brans || undefined;
      }
      const updated = await api.updateProfile(token, profileData);
      updateUser(updated);
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Kayıt başarısız");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 5000);
    }
  };

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveState("saving"); setSaveError("");
    try {
      await api.updateGoal(token, {
        exam_type: hedefSinav as "TYT" | "AYT" | "LGS" | "KPSS",
        grade: sinif ? Number(sinif) : undefined,
        target_school: hedefOkul || undefined,
        target_department: hedefBolum || undefined,
        target_net: hedefNet ? Number(hedefNet) : undefined,
      });
      // Re-fetch user to get updated goal
      const meRes = await api.getMe(token);
      updateUser(meRes);
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Kayıt başarısız");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 5000);
    }
  };

  const saveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveState("saving"); setSaveError("");
    try {
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

  const initials = user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const roleLabel = isStudent ? "Öğrenci" : isTeacher ? "Öğretmen" : isParent ? "Veli" : "Kullanıcı";
  const roleColor = isStudent ? "teal" : isTeacher ? "blue" : isParent ? "purple" : "slate";

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profil", label: "Profil Bilgileri", icon: User },
    ...(isStudent ? [{ id: "hedef" as Tab, label: "Hedef & Sınav", icon: Target }] : []),
    ...(isTeacher ? [{ id: "hedef" as Tab, label: "Öğretmen Bilgileri", icon: BookOpen }] : []),
    { id: "bildirimler", label: "Bildirimler", icon: Bell },
    { id: "guvenlik", label: "Güvenlik", icon: Shield },
  ];

  const Feedback = () => (
    <>
      {saveState === "success" && (
        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-700 text-sm font-medium mb-6">
          <CheckCircle className="w-5 h-5 shrink-0" /> Değişiklikler başarıyla kaydedildi.
        </div>
      )}
      {saveState === "error" && saveError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" /> {saveError}
        </div>
      )}
    </>
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      {/* Sayfa başlığı */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Profilim</h1>
        <p className="text-slate-600 mt-1">Hesap bilgilerinizi ve tercihlerinizi yönetin</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sol: Profil kartı */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className={`p-6 bg-gradient-to-br from-${roleColor}-500 to-${roleColor}-600`}>
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center shadow-lg">
                    {photoPreview ? (
                      photoPreview.startsWith("blob:")
                        ? <img src={photoPreview} alt="Profil" className="w-full h-full object-cover" />
                        : <Image src={photoPreview} alt="Profil" width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">{initials}</span>
                    )}
                    {photoUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-white text-slate-700 rounded-xl flex items-center justify-center shadow-md hover:bg-slate-50 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-base leading-tight">{user.name}</p>
                  <p className="text-white/80 text-sm">{roleLabel}</p>
                </div>
              </div>
            </div>

            {/* Kayıt bilgileri özeti */}
            <div className="p-4 space-y-2.5">
              {isStudent && user.goal && (
                <>
                  {user.goal.grade && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600">{user.goal.grade}. Sınıf</span>
                    </div>
                  )}
                  {user.goal.exam_type && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Target className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600">{user.goal.exam_type} Hedefi</span>
                    </div>
                  )}
                  {user.goal.target_school && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <School className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600 truncate">{user.goal.target_school}</span>
                    </div>
                  )}
                  {user.goal.target_net && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600">Hedef: {user.goal.target_net} net</span>
                    </div>
                  )}
                </>
              )}
              {isTeacher && (
                <>
                  {user.subject && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600">{user.subject}</span>
                    </div>
                  )}
                </>
              )}
              {user.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{user.phone}</span>
                </div>
              )}
              {user.subscription_plan && (
                <div className="flex items-center gap-2.5 text-sm pt-2 border-t border-slate-100">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-amber-700 font-semibold capitalize">{user.subscription_plan} Paketi</span>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav className="border-t border-slate-100 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSaveState("idle"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Sağ: Tab içeriği */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 lg:p-8">
            {/* ─── Profil Bilgileri ─── */}
            {activeTab === "profil" && (
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <User className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-slate-900">Profil Bilgileri</h2>
                </div>
                <Feedback />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ad Soyad</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text" value={name} onChange={(e) => setName(e.target.value)} required
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta <span className="text-slate-400 font-normal">(değiştirilemez)</span></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" value={user.email} readOnly
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed text-sm"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">E-posta değişikliği için destek ile iletişime geçin.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Telefon <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX"
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={saveState === "saving"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
                >
                  {saveState === "saving" ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Kaydediliyor...</> : <><Save className="w-4 h-4"/>Değişiklikleri Kaydet</>}
                </button>
              </form>
            )}

            {/* ─── Hedef & Sınav (Öğrenci) ─── */}
            {activeTab === "hedef" && isStudent && (
              <form onSubmit={saveGoal} className="space-y-5">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <Target className="w-5 h-5 text-teal-600" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Hedef & Sınav Bilgileri</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Kayıt sırasında girdiğiniz bilgiler. Dilediğiniz zaman güncelleyebilirsiniz.</p>
                  </div>
                </div>
                <Feedback />

                {/* Mevcut hedef özeti */}
                {user.goal?.exam_type && (
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 flex flex-wrap gap-4 mb-2">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Hedef Sınav</p>
                      <p className="font-bold text-teal-700">{user.goal.exam_type}</p>
                    </div>
                    {user.goal.grade && (
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Sınıf</p>
                        <p className="font-bold text-teal-700">{user.goal.grade}. Sınıf</p>
                      </div>
                    )}
                    {user.goal.target_net && (
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Hedef Net</p>
                        <p className="font-bold text-teal-700">{user.goal.target_net}</p>
                      </div>
                    )}
                    {user.goal.target_school && (
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Hedef Okul</p>
                        <p className="font-bold text-teal-700 text-sm">{user.goal.target_school}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sınıf</label>
                    <select value={sinif} onChange={(e) => setSinif(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                    >
                      <option value="">Sınıfınızı seçin</option>
                      {SINIFLAR.map((s) => <option key={s} value={s}>{s}. Sınıf</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Sınav</label>
                    <select value={hedefSinav} onChange={(e) => setHedefSinav(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                    >
                      {SINAVLAR.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {hedefSinav && <p className="text-xs text-slate-400 mt-1">{SINAVLAR.find(s => s.value === hedefSinav)?.desc}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {hedefSinav === "LGS" ? "Hedef Lise" : "Hedef Üniversite"}
                    </label>
                    <input type="text" value={hedefOkul} onChange={(e) => setHedefOkul(e.target.value)}
                      placeholder={hedefSinav === "LGS" ? "Örn: İstanbul Anadolu Lisesi" : "Örn: ODTÜ, Boğaziçi..."}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                    />
                  </div>
                  {hedefSinav !== "LGS" && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Bölüm</label>
                      <input type="text" value={hedefBolum} onChange={(e) => setHedefBolum(e.target.value)}
                        placeholder="Örn: Tıp, Hukuk, Mühendislik..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Net <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
                    <div className="relative">
                      <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="number" value={hedefNet} onChange={(e) => setHedefNet(e.target.value)}
                        min={0} max={200} step={0.5} placeholder="Örn: 85.5"
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={saveState === "saving"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
                >
                  {saveState === "saving" ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Kaydediliyor...</> : <><Save className="w-4 h-4"/>Hedefleri Kaydet</>}
                </button>
              </form>
            )}

            {/* ─── Öğretmen Bilgileri ─── */}
            {activeTab === "hedef" && isTeacher && (
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Öğretmen Bilgileri</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Kayıt sırasında girdiğiniz bilgiler</p>
                  </div>
                </div>
                <Feedback />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Branş / Uzmanlık Alanı</label>
                  <select value={brans} onChange={(e) => setBrans(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                  >
                    <option value="">Seçin</option>
                    {BRANSLAR.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Kısa Özgeçmiş <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Öğrenciler için görünür tanıtım metni..."
                    rows={4} maxLength={500}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none transition-all text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/500</p>
                </div>
                <button type="submit" disabled={saveState === "saving"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
                >
                  {saveState === "saving" ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Kaydediliyor...</> : <><Save className="w-4 h-4"/>Kaydet</>}
                </button>
              </form>
            )}

            {/* ─── Bildirimler ─── */}
            {activeTab === "bildirimler" && (
              <form onSubmit={saveNotifications} className="space-y-5">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <Bell className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-slate-900">Bildirim Tercihleri</h2>
                </div>
                <Feedback />
                <div className="space-y-3">
                  {[
                    { label: "Çalışma hatırlatmaları", desc: "Günlük çalışma planı hatırlatmaları", checked: bildirimCalisma, set: setBildirimCalisma },
                    { label: "Deneme sınavı uyarıları", desc: "Yaklaşan denemeler hakkında bildirim", checked: bildirimDeneme, set: setBildirimDeneme },
                    ...(isStudent ? [{ label: "Hedef risk uyarısı", desc: "Net hedefinizin altına düştüğünüzde", checked: bildirimHedef, set: setBildirimHedef }] : []),
                  ].map((item) => (
                    <label key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                      <div>
                        <p className="text-slate-800 font-semibold text-sm">{item.label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative ${item.checked ? "bg-teal-500" : "bg-slate-300"}`} onClick={() => item.set(!item.checked)}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.checked ? "translate-x-6" : "translate-x-1"}`} />
                      </div>
                    </label>
                  ))}
                </div>
                <button type="submit" disabled={saveState === "saving"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
                >
                  {saveState === "saving" ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Kaydediliyor...</> : <><Save className="w-4 h-4"/>Bildirimleri Kaydet</>}
                </button>
              </form>
            )}

            {/* ─── Güvenlik ─── */}
            {activeTab === "guvenlik" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-slate-900">Güvenlik</h2>
                </div>
                <Link href="/sifre-degistir"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 transition-colors group"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Şifre Değiştir</p>
                      <p className="text-xs text-slate-500 mt-0.5">Hesap güvenliğiniz için düzenli değiştirin</p>
                    </div>
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </Link>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs text-slate-500 font-medium">Hesap bilgileri</p>
                  <p className="text-sm text-slate-700 mt-1">Kayıt tarihi: <span className="font-medium">{user.created_at ? new Date(user.created_at).toLocaleDateString("tr-TR") : "—"}</span></p>
                  {user.last_login_at && <p className="text-sm text-slate-700">Son giriş: <span className="font-medium">{new Date(user.last_login_at).toLocaleString("tr-TR")}</span></p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
