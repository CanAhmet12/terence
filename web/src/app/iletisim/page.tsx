"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Mail, Phone, Send, MapPin, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function IletisimPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", konu: "genel", mesaj: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api.contact(form);
      setSent(true);
      setForm({ name: "", email: "", konu: "genel", mesaj: "" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Mesaj gönderilemedi. Lütfen destek@terenceegitim.com adresine e-posta gönderin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-slate-50/80">
        {/* Hero alanı */}
        <div className="relative py-16 lg:py-20 overflow-hidden">
          <div className="absolute inset-0 gradient-hero-mesh" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-4">
                İletişim
              </p>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
                Sorularınız İçin{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">
                  Bize Ulaşın
                </span>
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Destek ekibimiz en kısa sürede size dönüş yapacaktır.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* İletişim kartları */}
            <div className="lg:col-span-1 space-y-4">
              <a
                href="mailto:destek@terenceegitim.com"
                className="group flex items-start gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Mail className="w-7 h-7 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">E-posta</p>
                  <p className="text-teal-600 font-medium mt-1">destek@terenceegitim.com</p>
                  <p className="text-sm text-slate-500 mt-1">24 saat içinde yanıt</p>
                </div>
              </a>
              <a
                href="tel:08501234567"
                className="group flex items-start gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Phone className="w-7 h-7 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Telefon</p>
                  <p className="text-teal-600 font-medium mt-1">0850 123 45 67</p>
                  <p className="text-sm text-slate-500 mt-1">Hafta içi 09:00–18:00</p>
                </div>
              </a>
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-7 h-7 text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Adres</p>
                  <p className="text-slate-600 mt-1">İstanbul, Türkiye</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Mesaj Gönder</h2>
                    <p className="text-sm text-slate-500">Formu doldurun, en kısa sürede size dönelim</p>
                  </div>
                </div>

                {err && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
                    {err}
                  </div>
                )}
                {sent ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-teal-600" />
                    </div>
                    <p className="text-teal-700 font-bold text-lg">Mesajınız alındı</p>
                    <p className="text-slate-600 mt-2">En kısa sürede size dönüş yapacağız.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Ad Soyad</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Konu</label>
                      <select
                        value={form.konu}
                        onChange={(e) => setForm((p) => ({ ...p, konu: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      >
                        <option value="genel">Genel Bilgi</option>
                        <option value="teknik">Teknik Destek</option>
                        <option value="paket">Paket / Ödeme</option>
                        <option value="veli">Veli Kaydı</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Mesaj</label>
                      <textarea
                        value={form.mesaj}
                        onChange={(e) => setForm((p) => ({ ...p, mesaj: e.target.value }))}
                        required
                        rows={5}
                        placeholder="Mesajınızı buraya yazın..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
                    >
                      <Send className="w-5 h-5" />
                      {loading ? "Gönderiliyor..." : "Gönder"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
