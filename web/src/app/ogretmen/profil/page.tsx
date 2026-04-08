"use client";

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  User, Lock, Save, Camera, CheckCircle, AlertCircle,
  BookOpen, Shield, Bell, ChevronRight,
  Loader2, Edit3, GraduationCap
} from "lucide-react";

const BRANSLAR = [
  "Matematik","Türkçe","Fizik","Kimya","Biyoloji","Tarih","Coğrafya",
  "İngilizce","Edebiyat","Felsefe","Geometri","TYT Matematik","Diğer",
];

type Tab = "profil" | "bilgiler" | "bildirimler" | "guvenlik";
type SaveState = "idle" | "saving" | "success" | "error";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-200"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function FormInput({ label, value, onChange, type = "text", placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all disabled:bg-slate-50 disabled:text-slate-400" />
    </div>
  );
}

export default function OgretmenProfilPage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profil");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [brans, setBrans] = useState("");
  const [bio, setBio] = useState("");
  const [bildirimCalisma, setBildirimCalisma] = useState(true);
  const [bildirimDeneme, setBildirimDeneme] = useState(true);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setBrans(user.subject ?? "");
    setPhotoPreview(user.profile_photo_url ?? null);
  }, [user]);

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const res = await api.uploadProfilePhoto(file);
      const updated = await api.updateProfile({ profile_photo_url: res.url });
      updateUser(updated);
    } catch {
      setPhotoPreview(user?.profile_photo_url ?? null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaveState("saving"); setSaveError("");
    try {
      const updated = await api.updateProfile({ name, phone: phone || undefined, bio: bio || undefined, subject: brans || undefined } as Parameters<typeof api.updateProfile>[0]);
      updateUser(updated);
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Kayıt başarısız");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 5000);
    }
  };

  const saveNotifs = async (e: FormEvent) => {
    e.preventDefault();
    setSaveState("saving"); setSaveError("");
    try {
      await api.updateNotificationPreferences({ daily_reminders: bildirimCalisma, email_notifications: bildirimDeneme, risk_alerts: false });
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

  const TABS = [
    { id: "profil" as Tab, label: "Profil", icon: User },
    { id: "bilgiler" as Tab, label: "Öğretmen Bilgileri", icon: BookOpen },
    { id: "bildirimler" as Tab, label: "Bildirimler", icon: Bell },
    { id: "guvenlik" as Tab, label: "Güvenlik", icon: Shield },
  ];

  const SaveBtn = ({ text = "Kaydet" }: { text?: string }) => (
    <button type="submit" disabled={saveState === "saving"}
      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-indigo-500/25 active:scale-[0.98]">
      {saveState === "saving" ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
        : saveState === "success" ? <><CheckCircle className="w-4 h-4" /> Kaydedildi!</>
        : <><Save className="w-4 h-4" /> {text}</>}
    </button>
  );

  const Feedback = () => (
    <>
      {saveState === "success" && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium mb-5">
          <CheckCircle className="w-4 h-4 shrink-0" /> Değişiklikler kaydedildi.
        </div>
      )}
      {saveState === "error" && (
        <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" /> {saveError}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profilim</h1>
          <p className="text-slate-500 mt-1 font-medium">Öğretmen hesabı ve tercihlerini yönet</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">

          {/* Sol: Profil Kartı */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header — statik gradient */}
              <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center shadow-lg ring-2 ring-white/30">
                      {photoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoPreview} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-black text-2xl">{initials}</span>
                      )}
                      {photoUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200">
                      <Camera className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-white text-lg leading-tight">{user.name}</p>
                    <p className="text-white/70 text-xs mt-1">{user.email}</p>
                    <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                      Öğretmen
                    </div>
                  </div>
                </div>
              </div>

              {/* Hızlı istatistikler */}
              <div className="p-4 divide-y divide-slate-50">
                {user.subject && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Branş</span>
                    <span className="text-xs font-bold text-slate-800">{user.subject}</span>
                  </div>
                )}
                {(user.teacher_status) && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-xs text-slate-500">Durum</span>
                    <span className={`text-xs font-bold capitalize ${user.teacher_status === "approved" ? "text-emerald-600" : "text-amber-600"}`}>
                      {user.teacher_status === "approved" ? "Onaylı" : user.teacher_status}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2.5">
                  <span className="text-xs text-slate-500">Üyelik</span>
                  <span className="text-xs font-medium text-slate-600">
                    {new Date(user.created_at).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Sekmeler */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSaveState("idle"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}>
                  <tab.icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? "text-indigo-600" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sağ: İçerik */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8">

              {/* Profil */}
              {activeTab === "profil" && (
                <form onSubmit={save} className="space-y-5">
                  <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">Profil Bilgileri</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Temel hesap bilgilerini düzenle</p>
                    </div>
                  </div>
                  <Feedback />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormInput label="Ad Soyad" value={name} onChange={setName} placeholder="Adınız Soyadınız" />
                    <FormInput label="E-posta" value={user.email} onChange={() => {}} disabled />
                  </div>
                  <FormInput label="Telefon" value={phone} onChange={setPhone} type="tel" placeholder="0555 000 00 00" />
                  <div className="flex justify-end pt-2"><SaveBtn text="Profili Kaydet" /></div>
                </form>
              )}

              {/* Öğretmen Bilgileri */}
              {activeTab === "bilgiler" && (
                <form onSubmit={save} className="space-y-5">
                  <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">Öğretmen Bilgileri</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Branş ve biyografi bilgilerini düzenle</p>
                    </div>
                  </div>
                  <Feedback />
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Branş</label>
                    <select value={brans} onChange={(e) => setBrans(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all">
                      <option value="">Branş seçin</option>
                      {BRANSLAR.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Hakkımda</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                      placeholder="Kendinizi tanıtın, deneyimlerinizden bahsedin..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all resize-none" />
                  </div>
                  <div className="flex justify-end pt-2"><SaveBtn text="Bilgileri Kaydet" /></div>
                </form>
              )}

              {/* Bildirimler */}
              {activeTab === "bildirimler" && (
                <form onSubmit={saveNotifs} className="space-y-5">
                  <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">Bildirim Tercihleri</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Hangi bildirimleri almak istediğini seç</p>
                    </div>
                  </div>
                  <Feedback />
                  {[
                    { label: "Öğrenci Aktivite Bildirimi", desc: "Öğrencileriniz ders çalıştığında bildirim alın", value: bildirimCalisma, onChange: setBildirimCalisma },
                    { label: "E-posta Bildirimleri",        desc: "Önemli güncellemeler için e-posta alın",      value: bildirimDeneme, onChange: setBildirimDeneme },
                  ].map(({ label, desc, value, onChange }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <Toggle checked={value} onChange={onChange} />
                    </div>
                  ))}
                  <div className="flex justify-end pt-2"><SaveBtn text="Tercihleri Kaydet" /></div>
                </form>
              )}

              {/* Güvenlik */}
              {activeTab === "guvenlik" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">Güvenlik</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Hesap güvenliğini yönet</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                      <Lock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Şifre Değiştir</p>
                      <p className="text-xs text-slate-500 mt-0.5">Güçlü bir şifre belirle</p>
                    </div>
                    <Link href="/sifre-degistir"
                      className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 shrink-0">
                      Değiştir <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Hesap Bilgileri</p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">E-posta</span>
                        <span className="font-semibold text-slate-800">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hesap Durumu</span>
                        <span className="font-semibold text-emerald-600">Aktif</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
