"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ChevronLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function SifreDegistirPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordMismatch = !!newPassword && !!confirmPassword && newPassword !== confirmPassword;
  const tooShort = !!newPassword && newPassword.length < 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordMismatch || tooShort || !token) return;
    setError(null);
    setLoading(true);
    try {
      await api.changePassword(token, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push("/profil"), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Şifre değiştirilemedi.";
      if (msg.includes("current") || msg.includes("mevcut") || msg.includes("wrong") || msg.includes("incorrect")) {
        setError("Mevcut şifreniz hatalı.");
      } else {
        setError(msg || "Şifre değiştirilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Şifre Değiştirildi</h2>
          <p className="text-slate-600">Şifreniz başarıyla güncellendi. Profil sayfanıza yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-16 p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-md w-full">
        <Link
          href="/profil"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Profil&apos;e dön
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Şifre Değiştir</h1>
        <p className="text-slate-500 text-sm mb-8">Hesap güvenliğiniz için güçlü bir şifre seçin.</p>

        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="current-pw" className="block text-sm font-semibold text-slate-700 mb-2">
              Mevcut Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
              <input
                id="current-pw"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? "Şifreyi gizle" : "Şifreyi göster"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new-pw" className="block text-sm font-semibold text-slate-700 mb-2">
              Yeni Şifre <span className="text-slate-400 font-normal">(min. 8 karakter)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
              <input
                id="new-pw"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                aria-invalid={tooShort}
                className={`w-full pl-12 pr-12 py-3.5 border rounded-xl focus:ring-2 outline-none transition-all ${
                  tooShort ? "border-red-400 focus:ring-red-400" : "border-slate-200 focus:ring-teal-500 focus:border-teal-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? "Şifreyi gizle" : "Şifreyi göster"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {tooShort && (
              <p className="text-red-600 text-xs mt-1">Şifre en az 8 karakter olmalıdır.</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-pw" className="block text-sm font-semibold text-slate-700 mb-2">
              Yeni Şifre Tekrar
            </label>
            <input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              aria-invalid={passwordMismatch}
              aria-describedby={passwordMismatch ? "confirm-pw-error" : undefined}
              className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 outline-none transition-all ${
                passwordMismatch ? "border-red-400 focus:ring-red-400" : "border-slate-200 focus:ring-teal-500"
              }`}
            />
            {passwordMismatch && (
              <p id="confirm-pw-error" role="alert" className="text-red-600 text-xs mt-1">
                Şifreler eşleşmiyor.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passwordMismatch || tooShort || !currentPassword}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 mt-2"
          >
            {loading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
