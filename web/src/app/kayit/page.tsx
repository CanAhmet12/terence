"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, Phone, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError, loading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "teacher" | "parent">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const passwordMismatch = !!password && !!passwordConfirmation && password !== passwordConfirmation;

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") router.replace("/admin");
    else if (user.role === "teacher") router.replace("/ogretmen");
    else if (user.role === "parent") router.replace("/veli");
    else router.replace("/ogrenci");
  }, [user, router]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordMismatch) return;
    clearError();
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
        ...(phone && { phone }),
        ...(role === "parent" && childEmail && { child_email: childEmail }),
      });
      router.push(`/dogrulama?email=${encodeURIComponent(email)}`);
    } catch {
      // error shown by context
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 via-transparent to-emerald-900/20" />
        <div className="relative flex flex-col items-center justify-center p-16 text-white">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-extrabold mb-6 leading-tight">7 Gün Ücretsiz Dene</h2>
            <p className="text-white/90 leading-relaxed text-lg mb-10">
              Her dersten 1 ünite, günlük 10 soru, 1 deneme ve 7 gün akıllı plan ile başla.
            </p>
            <ul className="space-y-4 text-left">
              {["Her dersten 1 ünite", "Günlük 10 soru", "1 deneme sınavı", "7 gün akıllı plan"].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold" aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link href="/" className="inline-flex items-center gap-3 text-slate-900 mb-10 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow">
              <GraduationCap className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight">
              TERENCE <span className="text-teal-600">EĞİTİM</span>
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Ücretsiz kayıt ol</h1>
          <p className="text-slate-600 mb-8">7 gün boyunca tüm özellikleri dene</p>

          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-1 mb-6 p-1.5 bg-slate-100 rounded-xl" role="group" aria-label="Hesap türü seçin">
            {(["student", "teacher", "parent"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                  role === r ? "bg-white text-teal-700 shadow-md" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r === "student" ? "Öğrenci" : r === "teacher" ? "Öğretmen" : "Veli"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700 mb-2">Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ad Soyad"
                  required
                  autoComplete="name"
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-2">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            {role === "parent" && (
              <div>
                <label htmlFor="child-email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Çocuğunuzun E-postası <span className="text-slate-400 font-normal">(hesabınıza bağlanacak)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <input
                    id="child-email"
                    type="email"
                    value={childEmail}
                    onChange={(e) => setChildEmail(e.target.value)}
                    placeholder="cocuk@email.com"
                    autoComplete="off"
                    className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Öğrenci olarak kayıtlı çocuğunuzun e-postası</p>
              </div>
            )}

            <div>
              <label htmlFor="reg-phone" className="block text-sm font-semibold text-slate-700 mb-2">
                Telefon <span className="text-slate-400 font-normal">(opsiyonel)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  autoComplete="tel"
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-2">Şifre (min. 8 karakter)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reg-password-confirm" className="block text-sm font-semibold text-slate-700 mb-2">Şifre Tekrar</label>
              <input
                id="reg-password-confirm"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                aria-invalid={passwordMismatch}
                aria-describedby={passwordMismatch ? "pw-mismatch" : undefined}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all ${
                  passwordMismatch ? "border-red-400 focus:ring-red-400" : "border-slate-200"
                }`}
              />
              {passwordMismatch && (
                <p id="pw-mismatch" role="alert" className="text-red-600 text-sm mt-1 font-medium">
                  Şifreler eşleşmiyor
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
            >
              {loading ? "Kaydediliyor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-600 text-center">
            Zaten hesabın var mı?{" "}
            <Link href="/giris" className="text-teal-600 font-bold hover:underline inline-flex items-center gap-1">
              Giriş yap
              <ArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
