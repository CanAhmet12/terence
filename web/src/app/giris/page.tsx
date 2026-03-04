"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Image from "next/image";
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

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError, loading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    clearError();
    try {
      await login(email, password);
    } catch {
      // hata auth-context'ten gösteriliyor
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sol: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 text-slate-900 mb-10 group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow">
              <Image src="/logo.png" alt="Terence Eğitim" width={48} height={48} />
            </div>
            <span className="font-bold text-xl tracking-tight">
              TERENCE <span className="text-teal-600">EĞİTİM</span>
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Hoş geldin</h1>
          <p className="text-slate-600 mb-8">Hesabına giriş yap</p>

          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="email"
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

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="current-password"
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
              <Link href="/sifre-sifirlama" className="block text-sm text-teal-600 hover:text-teal-700 font-medium mt-2">
                Şifremi unuttum
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            {/* Google ile Giriş */}
            <a
              href={GOOGLE_AUTH_URL}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all mb-5 shadow-sm"
            >
              <GoogleIcon />
              Google ile Giriş Yap
            </a>
            <p className="text-sm text-slate-600 text-center">
              Hesabın yok mu?{" "}
              <Link href="/kayit" className="text-teal-600 font-bold hover:underline inline-flex items-center gap-1">
                Ücretsiz kayıt ol
                <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Sağ: Tanıtım */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 via-transparent to-emerald-900/20" />
        <div className="relative flex flex-col items-center justify-center p-16 text-white">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-extrabold mb-6 leading-tight">
              Hedefine Özel Akıllı Plan
            </h2>
            <p className="text-white/90 leading-relaxed text-lg mb-10">
              LGS, TYT, AYT, KPSS hazırlığında hedef okulunu seç. Sistem gerekli neti hesaplasın, kalan günlere bölsün.
            </p>
            <ul className="space-y-4 text-left">
              {["1M+ soru bankası", "Kazanım bazlı içerik", "Veli takip paneli"].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold" aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
