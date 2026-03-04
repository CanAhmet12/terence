"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-900 mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <Image src="/logo.png" alt="Terence Eğitim" width={40} height={40} />
          </div>
          <span className="font-bold text-xl">TERENCE EĞİTİM</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Şifreni sıfırla</h1>
          <p className="text-slate-600 mb-8">
            E-posta adresini gir. Sana şifre sıfırlama linki göndereceğiz.
          </p>

          {err && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {err}
            </div>
          )}
          {sent ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-teal-600" />
              </div>
              <h2 className="font-semibold text-slate-900 mb-2">E-posta gönderildi</h2>
              <p className="text-slate-600 text-sm mb-6">
                {email} adresine şifre sıfırlama linki gönderdik. Lütfen gelen kutunu kontrol et.
              </p>
              <Link
                href="/giris"
                className="text-teal-600 font-semibold hover:underline"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-slate-500 text-center">
            <Link href="/giris" className="text-teal-600 hover:underline">
              ← Giriş sayfasına dön
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
