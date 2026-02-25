"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { GraduationCap, Lock, Check } from "lucide-react";

export default function SifreDegistirPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirm || newPass.length < 8) return;
    await new Promise((r) => setTimeout(r, 800));
    setDone(true);
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-slate-50/80">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-3 text-slate-900 mb-10 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow">
              <GraduationCap className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl">TERENCE EĞİTİM</span>
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Şifre Değiştir</h1>

            {done ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
                </div>
                <p className="font-bold text-slate-900 text-lg">Şifreniz güncellendi</p>
                <p className="text-slate-600 mt-2">Artık yeni şifrenizle giriş yapabilirsiniz.</p>
                <Link
                  href="/profil"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Profile dön
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mevcut Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Yeni Şifre (min. 8 karakter)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Yeni Şifre Tekrar</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                  {newPass && confirm && newPass !== confirm && (
                    <p className="text-red-600 text-sm mt-1 font-medium">Şifreler eşleşmiyor</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={newPass !== confirm || newPass.length < 8}
                  className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
                >
                  Şifreyi Güncelle
                </button>
              </form>
            )}
          </div>

          <Link href="/profil" className="block mt-6 text-center text-slate-600 hover:text-teal-600 font-medium">
            ← Profile dön
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
