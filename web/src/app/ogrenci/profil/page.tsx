"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  User, Mail, Phone, Lock, Save, Camera, CheckCircle,
  AlertCircle, Target, BookOpen, Shield, Bell, ChevronRight,
  Loader2, GraduationCap, Award, Star, Crown, Edit3
} from "lucide-react";

const SINAVLAR = [
  { value: "LGS",     label: "LGS",     desc: "8. sınıf" },
  { value: "TYT",     label: "TYT",     desc: "Ön lisans / 2 yıllık" },
  { value: "TYT-AYT", label: "TYT+AYT", desc: "4 yıllık üniversite" },
  { value: "KPSS",    label: "KPSS",    desc: "Kamu personel" },
];

const BRANSLAR = [
  "Matematik","Türkçe","Fizik","Kimya","Biyoloji",
  "Tarih","Coğrafya","İngilizce","Edebiyat","Felsefe","Geometri","Diğer",
];

type Tab = "profil" | "hedef" | "bildirimler" | "guvenlik";
type SaveState = "idle" | "saving" | "success" | "error";

// Rol renk teması — statik (no dynamic Tailwind)
const ROLE_THEMES = {
  student: {
    gradient: "from-indigo-600 to-violet-700",
    badge: "bg-indigo-100 text-indigo-700",
    label: "Öğrenci",
  },
  teacher: {
    gradient: "from-blue-600 to-indigo-700",
    badge: "bg-blue-100 text-blue-700",
    label: "Öğretmen",
  },
  parent: {
    gradient: "from-purple-600 to-pink-700",
    badge: "bg-purple-100 text-purple-700",
    label: "Veli",
  },
  admin: {
    gradient: "from-rose-600 to-red-700",
    badge: "bg-rose-100 text-rose-700",
    label: "Admin",
  },
};

// Toggle bileşeni
function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        checked ? "bg-indigo-600" : "bg-slate-200"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}

// Form input
function FormInput({ label, value, onChange, type = "text", placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}

export default function OgrenciProfilPage() {
  const { user, token, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profil");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [brans, setBrans] = useState("");

  const [hedefSinav, setHedefSinav] = useState("TYT-AYT");
  const [hedefOkul, setHedefOkul] = useState("");
  const [hedefBolum, setHedefBolum] = useState("");
  const [hedefNet, setHedefNet] = useState("");

  const [bildirimCalisma, setBildirimCalisma] = useState(true);
  const [bildirimDeneme, setBildirimDeneme] = useState(true);
  const [bildirimHedef, setBildirimHedef] = useState(true);

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const isParent  = user?.role === "parent";
  const role = (user?.role ?? "student") as keyof typeof ROLE_THEMES;
  const theme = ROLE_THEMES[role] ?? ROLE_THEMES.student;

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setPhotoPreview(user.profile_photo_url ?? null);

    if (isStudent && user.goal) {
      const g = user.goal as Record<string, unknown>;
      setHedefSinav(g.exam_type as string ?? user.target_exam ?? "TYT-AYT");
      setHedefOkul(g.target_school as string ?? "");
      setHedefBolum(g.target_department as string ?? "");
      setHedefNet(g.target_net ? String(g.target_net) : "");
    }
    if (isTeacher) setBrans(user.subject ?? "");
  }, [user, isStudent, isTeacher]);

  // Bildirim ayarlarını API'den yükle
  useEffect(() => {
    if (!token) return;
    api.getNotificationSettings(token).then((res) => {
      const settings = res as Record<string, unknown>;
      if (settings.study_reminder !== undefined) setBildirimCalisma(Boolean(settings.study_reminder));
      if (settings.exam_reminder !== undefined) setBildirimDeneme(Boolean(settings.exam_reminder));
      if (settings.goal_reminder !== undefined) setBildirimHedef(Boolean(settings.goal_reminder));
    }).catch(() => { /* defaults kalır */ });
  }, [token]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState("saving"); setSaveError("");
    try {
      const data: Record<string, string | undefined> = { name, phone: phone || undefined };
      if (isTeacher) { data.bio = bio || undefined; data.subject = brans || undefined; }
      const updated = await api.updateProfile(data);
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
    setSaveState("saving"); setSaveError("");
    try {
      await api.updateGoal({
        exam_goal: hedefSinav,
        target_exam: hedefSinav,
        target_school: hedefOkul || undefined,
        target_department: hedefBolum || undefined,
        target_net: hedefNet ? Number(hedefNet) : undefined,
      } as Parameters<typeof api.updateGoal>[0]);
      const me = await api.getMe();
      updateUser(me);
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
    setSaveState("saving"); setSaveError("");
    try {
      await api.updateNotificationSettings(token ?? undefined, {
        study_reminder: bildirimCalisma,
        exam_reminder: bildirimDeneme,
        goal_reminder: bildirimHedef,
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

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profil",       label: "Profil",           icon: User    },
    ...(isStudent || isTeacher ? [{ id: "hedef" as Tab, label: isTeacher ? "Öğretmen Bilgileri" : "Hedef & Sınav", icon: Target }] : []),
    { id: "bildirimler",  label: "Bildirimler",       icon: Bell    },
    { id: "guvenlik",     label: "Güvenlik",          icon: Shield  },
  ];

  const SaveBtn = ({ text = "Kaydet" }: { text?: string }) => (
    <button
      type="submit"
      disabled={saveState === "saving"}
      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-indigo-500/25 active:scale-[0.98]"
    >
      {saveState === "saving" ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
      ) : saveState === "success" ? (
        <><CheckCircle className="w-4 h-4" /> Kaydedildi!</>
      ) : (
        <><Save className="w-4 h-4" /> {text}</>
      )}
    </button>
  );

  const Feedback = () => (
    <>
      {saveState === "success" && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium mb-5">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" /> Değişiklikler başarıyla kaydedildi.
        </div>
      )}
      {saveState === "error" && saveError && (
        <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium mb-5">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" /> {saveError}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Başlık ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profilim</h1>
          <p className="text-slate-500 mt-1 font-medium">Hesap bilgilerini ve tercihlerini yönet</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">

          {/* ── Sol: Profil Kartı ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Avatar + İsim */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Gradient header — statik sınıf */}
              <div className={`p-6 bg-gradient-to-br ${theme.gradient}`}>
                <div className="flex flex-col items-center gap-3">
                  {/* Avatar */}
                  <div className="relative group">
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
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>

                  <div className="text-center">
                    <p className="font-black text-white text-lg leading-tight">{user.name}</p>
                    <p className="text-white/70 text-xs mt-1">{user.email}</p>
                    <div className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${theme.badge}`}>
                      {theme.label}
                    </div>
                  </div>
                </div>
              </div>

              {/* İstatistikler */}
              <div className="p-4 divide-y divide-slate-50">
                {isStudent && (
                  <>
                    <div className="flex justify-between py-2.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> XP Puanı</span>
                      <span className="text-xs font-bold text-slate-800">{(user.xp_points ?? 0).toLocaleString("tr")}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Seviye</span>
                      <span className="text-xs font-bold text-slate-800">{user.level ?? 1}</span>
                    </div>
                    {user.target_exam && (
                      <div className="flex justify-between py-2.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Hedef Sınav</span>
                        <span className="text-xs font-bold text-indigo-600">{user.target_exam}</span>
                      </div>
                    )}
                    {user.subscription_plan && (
                      <div className="flex justify-between py-2.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Plan</span>
                        <span className="text-xs font-bold text-amber-600 capitalize">{user.subscription_plan}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between py-2.5">
                  <span className="text-xs text-slate-500">Üyelik</span>
                  <span className="text-xs font-medium text-slate-600">
                    {new Date(user.created_at).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Sekme navigasyonu */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSaveState("idle"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <tab.icon className={`w-4.5 h-4.5 shrink-0 ${activeTab === tab.id ? "text-indigo-600" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Sağ: İçerik ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8">

              {/* ════ PROFİL SEKMESİ ════ */}
              {activeTab === "profil" && (
                <form onSubmit={saveProfile} className="space-y-5">
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
                    <FormInput label="E-posta" value={user.email} onChange={() => {}} disabled placeholder="E-posta" />
                  </div>

                  <FormInput label="Telefon" value={phone} onChange={setPhone} type="tel" placeholder="0555 000 00 00" />

                  {isTeacher && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Branş</label>
                        <select
                          value={brans}
                          onChange={(e) => setBrans(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                        >
                          <option value="">Branş seçin</option>
                          {BRANSLAR.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Hakkımda / Biyografi</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          placeholder="Kendinizi tanıtın..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all resize-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-2">
                    <SaveBtn text="Profili Kaydet" />
                  </div>
                </form>
              )}

              {/* ════ HEDEF SEKMESİ ════ */}
              {activeTab === "hedef" && (
                <form onSubmit={saveGoal} className="space-y-5">
                  <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Target className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">{isTeacher ? "Öğretmen Bilgileri" : "Hedef & Sınav Bilgileri"}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Sınav hedefini ve okul tercihlerin</p>
                    </div>
                  </div>

                  <Feedback />

                  {isStudent && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Hedef Sınav</label>
                        <div className="grid grid-cols-2 gap-2">
                          {SINAVLAR.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => setHedefSinav(s.value)}
                              className={`flex flex-col items-start p-3.5 rounded-xl border-2 transition-all text-left ${
                                hedefSinav === s.value
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <p className={`font-bold text-sm ${hedefSinav === s.value ? "text-indigo-700" : "text-slate-700"}`}>
                                {s.label}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormInput
                          label="Hedef Net"
                          value={hedefNet}
                          onChange={setHedefNet}
                          type="number"
                          placeholder="Örn: 100"
                        />
                      </div>

                      <FormInput label="Hedef Üniversite" value={hedefOkul} onChange={setHedefOkul} placeholder="Boğaziçi Üniversitesi" />
                      <FormInput label="Hedef Bölüm" value={hedefBolum} onChange={setHedefBolum} placeholder="Bilgisayar Mühendisliği" />
                    </>
                  )}

                  <div className="flex justify-end pt-2">
                    <SaveBtn text="Hedefi Kaydet" />
                  </div>
                </form>
              )}

              {/* ════ BİLDİRİMLER SEKMESİ ════ */}
              {activeTab === "bildirimler" && (
                <form onSubmit={saveNotifications} className="space-y-5">
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
                    { label: "Günlük Çalışma Hatırlatması", desc: "Her gün belirlediğin saatte çalışma hatırlatması al", value: bildirimCalisma, onChange: setBildirimCalisma },
                    { label: "Deneme Sınavı Bildirimi",      desc: "Yeni deneme soruları eklendiğinde bildirim al",   value: bildirimDeneme, onChange: setBildirimDeneme },
                    { label: "Hedef Risk Uyarısı",           desc: "Hedefinden uzaklaştığında uyarı al",             value: bildirimHedef,  onChange: setBildirimHedef },
                  ].map(({ label, desc, value, onChange }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <Toggle checked={value} onChange={onChange} />
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <SaveBtn text="Tercihleri Kaydet" />
                  </div>
                </form>
              )}

              {/* ════ GÜVENLİK SEKMESİ ════ */}
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

                  {/* Şifre değiştir kartı */}
                  <div className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                      <Lock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Şifre Değiştir</p>
                      <p className="text-xs text-slate-500 mt-0.5">Güçlü bir şifre belirle</p>
                    </div>
                    <Link
                      href="/sifre-degistir"
                      className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 shrink-0"
                    >
                      Değiştir <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* E-posta bilgisi */}
                  <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Hesap Bilgileri</p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">E-posta</span>
                        <span className="font-semibold text-slate-800">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">E-posta Doğrulama</span>
                        <span className={`font-semibold ${user.email_verified_at ? "text-emerald-600" : "text-red-500"}`}>
                          {user.email_verified_at ? "✓ Doğrulandı" : "Doğrulanmamış"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Üyelik Tarihi</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(user.created_at).toLocaleDateString("tr-TR")}
                        </span>
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
