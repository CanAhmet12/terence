"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Shield,
  Bell,
  ChevronRight,
  Clock,
  Settings,
  Key,
} from "lucide-react";

type Tab = "profil" | "bildirimler" | "guvenlik";
type SaveState = "idle" | "saving" | "success" | "error";

export default function AdminProfilPage() {
  const { user, token, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profil");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [bildirimEmail, setBildirimEmail] = useState(true);
  const [bildirimSystem, setBildirimSystem] = useState(true);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setPhotoPreview(user.profile_photo_url ?? null);
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveState("saving");
    setSaveError("");
    try {
      const updated = await api.updateProfile({
        name,
        phone: phone || undefined,
      });
      updateUser(updated);
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
    setSaveState("saving");
    setSaveError("");
    try {
      await api.updateNotificationPreferences({
        daily_reminders: bildirimSystem,
        email_notifications: bildirimEmail,
        risk_alerts: true,
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

  const initials = user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "A";

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profil", label: "Profil Bilgileri", icon: User },
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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Profili</h1>
        <p className="text-slate-600 mt-1">Yönetici hesap bilgilerinizi ve sistem tercihlerinizi yönetin</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sol kart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center shadow-lg border-2 border-white/20">
                    {photoPreview ? (
                      photoPreview.startsWith("blob:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoPreview} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <Image src={photoPreview} alt="Profil" width={80} height={80} className="w-full h-full object-cover" />
                      )
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
                  <div className="flex items-center gap-1.5 mt-1 justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white/70 text-xs font-medium">Sistem Yöneticisi</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-600 truncate text-xs">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm pt-2 border-t border-slate-100">
                <Settings className="w-4 h-4 text-teal-500 shrink-0" />
                <span className="text-teal-700 font-semibold text-xs">Admin Rolü</span>
              </div>
              {user.created_at && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 text-xs">
                    Üye: {new Date(user.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              )}
            </div>

            <nav className="border-t border-slate-100 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSaveState("idle"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white"
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

        {/* Sağ içerik */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 lg:p-8">

            {/* ─── Profil Bilgileri ─── */}
            {activeTab === "profil" && (
              <form onSubmit={save} className="space-y-5">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <User className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">Profil Bilgileri</h2>
                </div>
                <Feedback />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ad Soyad</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      E-posta <span className="text-slate-400 font-normal">(değiştirilemez)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefon <span className="text-slate-400 font-normal">(opsiyonel)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05XX XXX XX XX"
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Sistem erişim bilgisi */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Yetki Düzeyi</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Bu hesap tüm platform verilerine tam erişim yetkisine sahiptir. Giriş bilgilerini güvende tutun.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saveState === "saving"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg text-sm"
                >
                  {saveState === "saving" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ─── Bildirimler ─── */}
            {activeTab === "bildirimler" && (
              <form onSubmit={saveNotifications} className="space-y-5">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <Bell className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">Bildirim Tercihleri</h2>
                </div>
                <Feedback />
                <div className="space-y-3">
                  {[
                    {
                      label: "E-posta bildirimleri",
                      desc: "Sistem uyarıları ve önemli güncellemeler e-posta ile",
                      checked: bildirimEmail,
                      set: setBildirimEmail,
                    },
                    {
                      label: "Sistem bildirimleri",
                      desc: "Platform içi anlık bildirimler",
                      checked: bildirimSystem,
                      set: setBildirimSystem,
                    },
                  ].map((item) => (
                    <label
                      key={item.label}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-slate-800 font-semibold text-sm">{item.label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                      </div>
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          item.checked ? "bg-teal-500" : "bg-slate-300"
                        }`}
                        onClick={() => item.set(!item.checked)}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            item.checked ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={saveState === "saving"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg text-sm"
                >
                  {saveState === "saving" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Bildirimleri Kaydet
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ─── Güvenlik ─── */}
            {activeTab === "guvenlik" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <Shield className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">Güvenlik</h2>
                </div>

                <Link
                  href="/sifre-degistir"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors group"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Şifre Değiştir</p>
                      <p className="text-xs text-slate-500 mt-0.5">Admin hesabı güvenliği için düzenli değiştirin</p>
                    </div>
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </Link>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Güvenlik Önerileri</span>
                  </div>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Şifrenizi düzenli aralıklarla değiştirin</li>
                    <li>Güçlü bir şifre kullanın (en az 12 karakter)</li>
                    <li>Şifrenizi kimseyle paylaşmayın</li>
                    <li>Paylaşımlı bilgisayarlarda oturum açmaktan kaçının</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs text-slate-500 font-medium mb-1">Hesap bilgileri</p>
                  <p className="text-sm text-slate-700">
                    Kayıt tarihi:{" "}
                    <span className="font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("tr-TR") : "—"}
                    </span>
                  </p>
                  {user.last_login_at && (
                    <p className="text-sm text-slate-700 mt-1">
                      Son giriş:{" "}
                      <span className="font-medium">
                        {new Date(user.last_login_at).toLocaleString("tr-TR")}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
