"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Shield } from "lucide-react";

export default function SifreDegistirPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const backHref = user?.role === "teacher"
    ? "/ogretmen/profil"
    : user?.role === "parent"
    ? "/veli/profil"
    : "/ogrenci/profil";

  const pwStrength = (pw: string) => {
    if (pw.length === 0) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = pwStrength(newPassword);
  const strengthLabel = ["", "Zayıf", "Orta", "İyi", "Güçlü"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-teal-400", "bg-emerald-500"][strength];

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.changePassword(token, { current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword });
      setSuccess(true);
      setTimeout(() => router.push(backHref), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <Link href={backHref} className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Profile dön
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Şifre Değiştir</h1>
              <p className="text-sm text-slate-500 mt-0.5">Hesabınızı güvende tutun</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {success && (
              <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-700 text-sm font-medium">
                <CheckCircle className="w-5 h-5 shrink-0" />
                Şifreniz başarıyla değiştirildi! Yönlendiriliyorsunuz...
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mevcut Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Yeni Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm"
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : "bg-slate-200"}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${["", "text-red-500", "text-amber-500", "text-teal-600", "text-emerald-600"][strength]}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Yeni Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 outline-none transition-all text-sm ${
                    mismatch ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-teal-500 focus:border-teal-500"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mismatch && <p className="text-xs text-red-500 mt-1.5 font-medium">Şifreler eşleşmiyor</p>}
            </div>

            <button
              type="submit"
              disabled={saving || success || mismatch}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Değiştiriliyor...</>
              ) : (
                <><Shield className="w-4 h-4" />Şifreyi Değiştir</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
