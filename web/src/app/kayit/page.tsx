"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, User, Eye, EyeOff, Phone, ArrowRight, ArrowLeft,
  BookOpen, Users, GraduationCap, Target, School, ChevronRight,
  CheckCircle, Briefcase
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const GOOGLE_AUTH_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")}/auth/google/redirect`
  : "https://terenceegitim.com/auth/google/redirect";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type Role = "student" | "teacher" | "parent";
type Step = 1 | 2 | 3;

const EXAM_TYPES = [
  { value: "LGS", label: "LGS", desc: "Liseye Geçiş Sınavı", grades: [8] },
  { value: "TYT", label: "TYT", desc: "Temel Yeterlilik Testi", grades: [9, 10, 11, 12] },
  { value: "AYT", label: "AYT", desc: "Alan Yeterlilik Testi", grades: [9, 10, 11, 12] },
  { value: "TYT-AYT", label: "TYT+AYT", desc: "Üniversite (İkisi Birden)", grades: [9, 10, 11, 12] },
  { value: "KPSS", label: "KPSS", desc: "Kamu Personel Sınavı", grades: [] },
];

const STUDENT_GRADES = [
  { value: 5, label: "5. Sınıf" },
  { value: 6, label: "6. Sınıf" },
  { value: 7, label: "7. Sınıf" },
  { value: 8, label: "8. Sınıf" },
  { value: 9, label: "9. Sınıf" },
  { value: 10, label: "10. Sınıf" },
  { value: 11, label: "11. Sınıf" },
  { value: 12, label: "12. Sınıf" },
  { value: 0, label: "Mezun / Üniversite" },
];

const TEACHER_SUBJECTS = [
  "Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe",
  "Edebiyat", "Tarih", "Coğrafya", "İngilizce", "Felsefe",
  "Din Kültürü", "Geometri", "Diğer"
];

const ROLES = [
  {
    value: "student" as Role,
    icon: GraduationCap,
    title: "Öğrenci",
    desc: "Kişiselleştirilmiş çalışma planı, soru bankası ve AI destekli analizler ile hedefe ulaş",
    color: "teal",
    features: ["Akıllı çalışma planı", "1M+ soru bankası", "Performans analizi", "Canlı dersler"],
  },
  {
    value: "teacher" as Role,
    icon: Briefcase,
    title: "Öğretmen",
    desc: "Sınıfını yönet, ödev ver, canlı ders aç ve öğrencilerinin gelişimini takip et",
    color: "blue",
    features: ["Sınıf yönetimi", "Ödev & test hazırlama", "Canlı ders", "Detaylı raporlar"],
  },
  {
    value: "parent" as Role,
    icon: Users,
    title: "Veli",
    desc: "Çocuğunuzun çalışma sürecini gerçek zamanlı takip edin, raporlara ulaşın",
    color: "purple",
    features: ["Çalışma takibi", "Performans raporu", "Bildirim ayarları", "Öğretmenle iletişim"],
  },
];

const colorMap = {
  teal: {
    bg: "bg-teal-50", border: "border-teal-500", text: "text-teal-700",
    icon: "bg-teal-100 text-teal-600", badge: "bg-teal-500",
    btn: "from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600",
    ring: "ring-teal-500", shadow: "shadow-teal-500/25",
  },
  blue: {
    bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-700",
    icon: "bg-blue-100 text-blue-600", badge: "bg-blue-500",
    btn: "from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600",
    ring: "ring-blue-500", shadow: "shadow-blue-500/25",
  },
  purple: {
    bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-700",
    icon: "bg-purple-100 text-purple-600", badge: "bg-purple-500",
    btn: "from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600",
    ring: "ring-purple-500", shadow: "shadow-purple-500/25",
  },
};

function StepIndicator({ step, role }: { step: Step; role: Role }) {
  const color = role === "teacher" ? "blue" : role === "parent" ? "purple" : "teal";
  const c = colorMap[color];
  const steps = [
    { n: 1, label: "Rol Seç" },
    { n: 2, label: "Hesap Bilgileri" },
    { n: 3, label: role === "student" ? "Hedef & Sınıf" : role === "teacher" ? "Profil Bilgileri" : "Çocuk Bağlantısı" },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              step > s.n ? `${c.badge} text-white` :
              step === s.n ? `border-2 ${c.border} ${c.text} bg-white` :
              "border-2 border-slate-200 text-slate-400 bg-white"
            }`}>
              {step > s.n ? <CheckCircle className="w-5 h-5" /> : s.n}
            </div>
            <span className={`text-xs mt-1.5 font-medium transition-colors ${step >= s.n ? c.text : "text-slate-400"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mb-5 transition-all duration-500 ${step > s.n ? c.badge : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError, loading, user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>("student");

  // Adım 2 — Hesap Bilgileri
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // Adım 3 — Öğrenci
  const [grade, setGrade] = useState<number | null>(null);
  const [targetExam, setTargetExam] = useState("");
  const [targetSchool, setTargetSchool] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [targetNet, setTargetNet] = useState("");

  // Adım 3 — Öğretmen
  const [subject, setSubject] = useState("");
  const [bio, setBio] = useState("");

  // Adım 3 — Veli
  const [childEmail, setChildEmail] = useState("");

  const pwMismatch = !!password && !!passwordConfirm && password !== passwordConfirm;
  const selectedRole = ROLES.find(r => r.value === role)!;
  const color = role === "teacher" ? "blue" : role === "parent" ? "purple" : "teal";
  const c = colorMap[color];

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") router.replace("/admin");
    else if (user.role === "teacher") router.replace("/ogretmen");
    else if (user.role === "parent") router.replace("/veli");
    else router.replace("/ogrenci");
  }, [user, router]);

  if (user) return null;

  const goNext = () => {
    clearError();
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };
  const goBack = () => {
    clearError();
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwMismatch) return;
    clearError();
    try {
      await register({
        name, email, password,
        password_confirmation: passwordConfirm,
        role,
        ...(phone && { phone }),
        ...(role === "student" && grade !== null && { grade }),
        ...(role === "student" && targetExam && { target_exam: targetExam }),
        ...(role === "student" && targetSchool && { target_school: targetSchool }),
        ...(role === "student" && targetDepartment && { target_department: targetDepartment }),
        ...(role === "student" && targetNet && { target_net: parseFloat(targetNet) }),
        ...(role === "teacher" && subject && { subject }),
        ...(role === "teacher" && bio && { bio }),
        ...(role === "parent" && childEmail && { child_email: childEmail }),
      });
      router.push(`/dogrulama?email=${encodeURIComponent(email)}`);
    } catch {
      // error shown via context
    }
  };

  const step2Valid = name.trim() && email.trim() && password.length >= 8 && passwordConfirm && !pwMismatch;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow">
            <Image src="/logo.png" alt="Terence Eğitim" width={40} height={40} />
          </div>
          <span className="font-bold text-slate-900">
            TERENCE <span className="text-teal-600">EĞİTİM</span>
          </span>
        </Link>
        <p className="text-sm text-slate-500">
          Hesabın var mı?{" "}
          <Link href="/giris" className="text-teal-600 font-semibold hover:underline">
            Giriş yap
          </Link>
        </p>
      </header>

      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-3xl">

          {/* ─── ADIM 1: ROL SEÇİMİ ─────────────────────────────────── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
                  Hesap türünü seç
                </h1>
                <p className="text-slate-500 text-lg">
                  Sana özel deneyim için rolünü belirliyoruz
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {ROLES.map((r) => {
                  const rc = colorMap[r.color as keyof typeof colorMap];
                  const RIcon = r.icon;
                  const isSelected = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                        isSelected
                          ? `${rc.bg} ${rc.border} shadow-lg`
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      {isSelected && (
                        <span className={`absolute top-4 right-4 w-6 h-6 ${rc.badge} rounded-full flex items-center justify-center`}>
                          <CheckCircle className="w-4 h-4 text-white" />
                        </span>
                      )}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isSelected ? rc.icon : "bg-slate-100 text-slate-500"} transition-colors`}>
                        <RIcon className="w-7 h-7" strokeWidth={1.8} />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${isSelected ? rc.text : "text-slate-800"}`}>{r.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4">{r.desc}</p>
                      <ul className="space-y-1.5">
                        {r.features.map((f) => (
                          <li key={f} className={`flex items-center gap-2 text-xs font-medium ${isSelected ? rc.text : "text-slate-500"}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? rc.badge : "bg-slate-200"} shrink-0`}>
                              <CheckCircle className="w-2.5 h-2.5 text-white" />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={goNext}
                className={`w-full py-4 bg-gradient-to-r ${c.btn} text-white font-bold rounded-2xl transition-all shadow-lg ${c.shadow} flex items-center justify-center gap-2 text-lg`}
              >
                {selectedRole.title} olarak devam et
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Google ile kayıt */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-400 font-medium">veya</span>
                </div>
              </div>
              <a
                href={GOOGLE_AUTH_URL}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <GoogleIcon />
                Google ile Kayıt Ol
              </a>
            </div>
          )}

          {/* ─── ADIM 2: HESAP BİLGİLERİ ────────────────────────────── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 md:p-10">
                <StepIndicator step={2} role={role} />

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${c.bg} ${c.text} text-sm font-semibold mb-6`}>
                  <selectedRole.icon className="w-4 h-4" />
                  {selectedRole.title} hesabı
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Hesap bilgilerin</h2>
                <p className="text-slate-500 mb-7">Güvenli bir hesap oluşturalım</p>

                {error && (
                  <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ad Soyad</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Adınız Soyadınız" required autoComplete="name"
                        className={`w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${c.ring} focus:border-transparent outline-none transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="ornek@email.com" required autoComplete="email"
                        className={`w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${c.ring} focus:border-transparent outline-none transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefon <span className="text-slate-400 font-normal">(opsiyonel)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="05XX XXX XX XX" autoComplete="tel"
                        className={`w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${c.ring} focus:border-transparent outline-none transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Şifre <span className="text-slate-400 font-normal">(min. 8 karakter)</span></label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required minLength={8} autoComplete="new-password"
                        className={`w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${c.ring} focus:border-transparent outline-none transition-all`}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {password.length > 0 && password.length < 8 && (
                      <p className="text-amber-600 text-xs mt-1">En az 8 karakter gerekli</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Şifre Tekrar</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPw2 ? "text" : "password"} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                        placeholder="••••••••" required minLength={8} autoComplete="new-password"
                        aria-invalid={pwMismatch}
                        className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:ring-2 outline-none transition-all ${
                          pwMismatch ? "border-red-400 focus:ring-red-400" : `border-slate-200 ${c.ring} focus:border-transparent`
                        }`}
                      />
                      <button type="button" onClick={() => setShowPw2(!showPw2)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {pwMismatch && <p className="text-red-600 text-xs mt-1 font-medium">Şifreler eşleşmiyor</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={goBack}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Geri
                  </button>
                  <button type="button" onClick={goNext} disabled={!step2Valid}
                    className={`flex-1 py-3.5 bg-gradient-to-r ${c.btn} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg ${c.shadow} flex items-center justify-center gap-2`}>
                    Devam et <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── ADIM 3: ROL'E ÖZEL BİLGİLER ───────────────────────── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 md:p-10">
                <StepIndicator step={3} role={role} />

                {/* ── ÖĞRENCİ ── */}
                {role === "student" && (
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                        <Target className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900">Hedef & Sınıf Bilgileri</h2>
                        <p className="text-slate-500 text-sm">Sana özel plan oluşturmak için kullanacağız</p>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">{error}</div>
                    )}

                    <div className="space-y-6">
                      {/* Sınıf */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Hangi sınıftasın? <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {STUDENT_GRADES.map(g => (
                            <button key={g.value} type="button" onClick={() => setGrade(g.value)}
                              className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                                grade === g.value
                                  ? "border-teal-500 bg-teal-50 text-teal-700"
                                  : "border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50/50"
                              }`}>
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hedef Sınav */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Hangi sınava hazırlanıyorsun? <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {EXAM_TYPES.map(et => (
                            <button key={et.value} type="button" onClick={() => setTargetExam(et.value)}
                              className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                                targetExam === et.value
                                  ? "border-teal-500 bg-teal-50"
                                  : "border-slate-200 hover:border-teal-200 hover:bg-slate-50"
                              }`}>
                              <div>
                                <span className={`font-bold text-sm ${targetExam === et.value ? "text-teal-700" : "text-slate-800"}`}>
                                  {et.label}
                                </span>
                                <span className="text-slate-500 text-xs ml-2">{et.desc}</span>
                              </div>
                              {targetExam === et.value && <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hedef Okul / Bölüm (sınava göre göster) */}
                      {targetExam && targetExam !== "LGS" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-1 text-sm font-semibold text-slate-700 mb-2">
                              <School className="w-4 h-4 text-teal-500" /> Hedef Okul
                            </label>
                            <input
                              type="text" value={targetSchool} onChange={e => setTargetSchool(e.target.value)}
                              placeholder="Örn: Boğaziçi Üniversitesi"
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1 text-sm font-semibold text-slate-700 mb-2">
                              <BookOpen className="w-4 h-4 text-teal-500" /> Hedef Bölüm
                            </label>
                            <input
                              type="text" value={targetDepartment} onChange={e => setTargetDepartment(e.target.value)}
                              placeholder="Örn: Tıp, Hukuk..."
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                            />
                          </div>
                        </div>
                      )}
                      {targetExam === "LGS" && (
                        <div>
                          <label className="flex items-center gap-1 text-sm font-semibold text-slate-700 mb-2">
                            <School className="w-4 h-4 text-teal-500" /> Hedef Lise
                          </label>
                          <input
                            type="text" value={targetSchool} onChange={e => setTargetSchool(e.target.value)}
                            placeholder="Örn: Galatasaray Lisesi"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                          />
                        </div>
                      )}

                      {/* Hedef Net */}
                      {targetExam && (
                        <div>
                      <label className="flex items-center gap-1 text-sm font-semibold text-slate-700 mb-2">
                            <Target className="w-4 h-4 text-teal-500" /> Hedef Net Sayısı
                            <span className="text-slate-400 font-normal ml-1">(opsiyonel)</span>
                          </label>
                          <input
                            type="number" value={targetNet} onChange={e => setTargetNet(e.target.value)}
                            placeholder="Örn: 100" min="0" max="200" step="0.5"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button type="button" onClick={goBack}
                        className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Geri
                      </button>
                      <button type="submit" disabled={loading || !grade || !targetExam}
                        className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2">
                        {loading ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Kaydediliyor...</span>
                        ) : (
                          <><CheckCircle className="w-5 h-5" /> Hesap Oluştur</>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 text-center mt-4">
                      Bu bilgileri daha sonra profilinden güncelleyebilirsin
                    </p>
                  </form>
                )}

                {/* ── ÖĞRETMEN ── */}
                {role === "teacher" && (
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900">Öğretmen Profili</h2>
                        <p className="text-slate-500 text-sm">Öğrencilerin seni tanıyabilsin</p>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">{error}</div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Branşın / Dersin <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {TEACHER_SUBJECTS.map(s => (
                            <button key={s} type="button" onClick={() => setSubject(s)}
                              className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                                subject === s
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
                              }`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Kısa Biyografi <span className="text-slate-400 font-normal">(opsiyonel)</span>
                        </label>
                        <textarea
                          value={bio} onChange={e => setBio(e.target.value)}
                          placeholder="Örn: 10 yıllık Matematik öğretmeniyim. TYT ve AYT sınavlarına öğrenci hazırlıyorum..."
                          rows={3} maxLength={500}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 focus:border-transparent outline-none text-sm transition-all resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/500</p>
                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-amber-800 text-sm font-medium">
                          📋 Öğretmen hesabınız yönetici onayına gönderilecektir. Onay sonrası sınıflarınızı oluşturabilirsiniz.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button type="button" onClick={goBack}
                        className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Geri
                      </button>
                      <button type="submit" disabled={loading || !subject}
                        className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                        {loading ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Kaydediliyor...</span>
                        ) : (
                          <><CheckCircle className="w-5 h-5" /> Hesap Oluştur</>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── VELİ ── */}
                {role === "parent" && (
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900">Çocuk Bağlantısı</h2>
                        <p className="text-slate-500 text-sm">Çocuğunuzun hesabına bağlanın</p>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">{error}</div>
                    )}

                    <div className="space-y-5">
                      <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl">
                        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5" /> Çocuğunuz platformda kayıtlı mı?
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Eğer çocuğunuz halihazırda öğrenci hesabı açmışsa, e-posta adresini girerek hesaplarınızı bağlayabilirsiniz.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Çocuğunuzun E-postası <span className="text-slate-400 font-normal">(opsiyonel)</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email" value={childEmail} onChange={e => setChildEmail(e.target.value)}
                            placeholder="cocuk@email.com" autoComplete="off"
                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ring-purple-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                          Bırakabilirsiniz — daha sonra panel üzerinden de bağlantı kurabilirsiniz
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { icon: "📊", title: "Anlık Raporlar", desc: "Günlük çalışma süresi ve test sonuçları" },
                          { icon: "🔔", title: "Akıllı Bildirimler", desc: "Çalışmadığında ve sınav yaklaşınca uyarı" },
                          { icon: "🎯", title: "Hedef Takibi", desc: "Hedef okula ne kadar yakın?" },
                        ].map(item => (
                          <div key={item.title} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                              <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button type="button" onClick={goBack}
                        className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Geri
                      </button>
                      <button type="submit" disabled={loading}
                        className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2">
                        {loading ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Kaydediliyor...</span>
                        ) : (
                          <><CheckCircle className="w-5 h-5" /> Hesap Oluştur</>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 text-center mt-4">
                      Çocuk bağlantısını daha sonra da ekleyebilirsiniz
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Alt link */}
          {step !== 3 && (
            <p className="text-center text-sm text-slate-500 mt-6">
              Zaten hesabın var mı?{" "}
              <Link href="/giris" className="text-teal-600 font-semibold hover:underline inline-flex items-center gap-1">
                Giriş yap <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
