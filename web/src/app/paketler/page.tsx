"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Check, Zap, Video, FileText, Users, Shield, ArrowRight,
  CheckCircle, Loader2, Star, Crown, Tag, X, ChevronDown
} from "lucide-react";

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "Yıllık plan peşin mi ödeniyor?", a: "Evet, yıllık planlar tek seferde peşin ödenir. Bu sayede aylık fiyata kıyasla %20 indirim kazanırsınız. Ödeme sonrasında 12 aylık erişim hemen aktif olur." },
  { q: "İptal edersem ne olur?", a: "İstediğiniz zaman, herhangi bir taahhüt olmadan aboneliğinizi durdurabilirsiniz. İptal sonrası mevcut dönem sonuna kadar platforma erişiminiz devam eder." },
  { q: "Ücretsiz plan ne kadar sürer?", a: "Ücretsiz plan süresiz kullanılabilir. Ancak bazı özellikler (AI Koç, sınırsız soru bankası, canlı ders) ücretli planlarda mevcuttur." },
  { q: "İade politikası nedir?", a: "İlk 7 gün içinde memnun kalmazsanız tam para iadesi alabilirsiniz. İade talebi için destek ekibimizle iletişime geçmeniz yeterlidir." },
  { q: "Birden fazla cihazda kullanabilir miyim?", a: "Evet, hesabınızla telefon, tablet ve bilgisayar dahil tüm cihazlardan erişebilirsiniz. Eş zamanlı 3 cihaz desteklenmektedir." },
  { q: "Öğretmene nasıl ulaşabilirim?", a: "Plus ve Pro planlarda mesajlaşma özelliği ile öğretmenlerinize doğrudan mesaj atabilirsiniz. Pro planda kişisel koçluk desteği de mevcuttur." },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Sıkça Sorulan Sorular</h2>
        <p className="text-slate-500">Aklındaki soruların cevapları burada</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <span>{item.q}</span>
              <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 ml-4 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-48" : "max-h-0"}`}>
              <p className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
type PlanKey = "free" | "bronze" | "plus" | "pro";

interface Plan {
  key: PlanKey;
  name: string;
  subtitle: string;
  price: number;
  period: string;
  popular: boolean;
  badge?: string;
  icon: React.ElementType;
  color: string;
  features: { text: string; bold?: boolean }[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    subtitle: "Tanışma Paketi",
    price: 0,
    period: "",
    popular: false,
    icon: Zap,
    color: "slate",
    features: [
      { text: "Her dersten 1 ünite" },
      { text: "Günlük 10 soru" },
      { text: "1 deneme sınavı" },
      { text: "7 gün akıllı plan" },
      { text: "Hedef & net tahmin ekranı" },
    ],
    cta: "Ücretsiz Başla",
  },
  {
    key: "bronze",
    name: "Bronze",
    subtitle: "Tüm Videolar",
    price: 99,
    period: "/ay",
    popular: false,
    icon: Video,
    color: "amber",
    features: [
      { text: "Tüm konu anlatım videoları", bold: true },
      { text: "Hız ayarlı izleme (0.5x – 2x)" },
      { text: "Tüm PDF ders notları" },
      { text: "Sınırsız video erişimi" },
      { text: "Kaldığın yerden devam" },
    ],
    cta: "Bronze'a Geç",
  },
  {
    key: "plus",
    name: "Plus",
    subtitle: "Deneme + Soru Bankası",
    price: 199,
    period: "/ay",
    popular: true,
    badge: "En Popüler",
    icon: FileText,
    color: "teal",
    features: [
      { text: "Bronze paket dahil", bold: true },
      { text: "Sınırsız online deneme", bold: true },
      { text: "1M+ soru bankası" },
      { text: "Türkiye geneli sıralama" },
      { text: "Kazanım analiz raporu" },
      { text: "Benzer soru önerisi" },
    ],
    cta: "Plus'a Geç",
  },
  {
    key: "pro",
    name: "Pro",
    subtitle: "Canlı Ders + Koçluk",
    price: 349,
    period: "/ay",
    popular: false,
    badge: "Tam Paket",
    icon: Crown,
    color: "purple",
    features: [
      { text: "Plus paket dahil", bold: true },
      { text: "Canlı ders katılımı", bold: true },
      { text: "Kişiye özel koçluk" },
      { text: "Haftalık rapor PDF" },
      { text: "Öncelikli destek" },
      { text: "Veli SMS bildirimleri" },
    ],
    cta: "Pro'ya Geç",
  },
];

const COLOR_MAP: Record<string, { ring: string; bg: string; btn: string; badge: string; icon: string }> = {
  slate: {
    ring: "border-slate-200 hover:border-slate-300",
    bg: "bg-white",
    btn: "border-2 border-slate-200 hover:border-teal-400 text-slate-700 hover:text-teal-600 hover:bg-teal-50/50",
    badge: "bg-slate-100 text-slate-600",
    icon: "bg-slate-100 text-slate-600",
  },
  amber: {
    ring: "border-amber-200 hover:border-amber-300",
    bg: "bg-white",
    btn: "border-2 border-amber-200 hover:border-amber-400 text-amber-700 hover:bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    icon: "bg-amber-100 text-amber-600",
  },
  teal: {
    ring: "border-teal-500 ring-2 ring-teal-500/20 shadow-2xl shadow-teal-500/15",
    bg: "bg-white",
    btn: "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25",
    badge: "bg-teal-500 text-white",
    icon: "bg-teal-100 text-teal-600",
  },
  purple: {
    ring: "border-purple-200 hover:border-purple-300",
    bg: "bg-white",
    btn: "border-2 border-purple-200 hover:border-purple-400 text-purple-700 hover:bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    icon: "bg-purple-100 text-purple-600",
  },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-2xl animate-pulse ${className ?? ""}`} />;
}

// ─── Ödeme Modal ──────────────────────────────────────────────────────────────
function PaymentModal({
  plan, onClose, token, billing,
}: { plan: Plan; onClose: () => void; token: string | null; billing: "monthly" | "yearly" }) {
  const [iframeToken, setIframeToken] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState<{ amount: number; finalPrice: number } | null>(null);
  const [initiating, setInitiating] = useState(false);

  const planIdMap: Record<string, number> = { bronze: 1, plus: 2, pro: 3 };
  const planId = planIdMap[plan.key];

  const handleInitiate = useCallback(async (couponCode?: string) => {
    if (!token || !planId) return;
    setInitiating(true);
    try {
      const res = await api.initiatePayment({
        package_id: planId,
        coupon_code: couponCode,
      } as Parameters<typeof api.initiatePayment>[0]);
      const resObj = res as Record<string, unknown>;
      setIframeToken((resObj.token ?? resObj.iframe_token) as string ?? null);
    } catch {
      setIframeToken(null);
    } finally {
      setInitiating(false);
    }
  }, [token, planId, billing]);

  useEffect(() => {
    handleInitiate();
  }, [handleInitiate]);

  const handleApplyCoupon = async () => {
    if (!coupon.trim() || !token || !planId) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await api.applyCoupon(coupon.trim(), planId);
      const resObj = res as Record<string, unknown>;
      if (resObj.success || resObj.valid || (resObj.discount as number) > 0) {
        setCouponApplied(true);
        setDiscount({ amount: resObj.discount_amount as number ?? resObj.discount as number, finalPrice: resObj.final_price as number });
        // Yeni fiyatla iframe'i yeniden al
        handleInitiate(coupon.trim());
      } else {
        setCouponError(res.message || "Geçersiz kupon kodu.");
      }
    } catch {
      setCouponError("Kupon uygulanırken hata oluştu.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon("");
    setCouponApplied(false);
    setDiscount(null);
    setCouponError(null);
    setIframeToken(null);
    handleInitiate();
  };

  const basePrice = billing === "yearly"
    ? Math.round(plan.price * 12 * 0.8)
    : plan.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Başlık */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{plan.name} — {discount ? discount.finalPrice : basePrice}₺{billing === "yearly" ? "/yıl" : "/ay"}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Güvenli ödeme — PayTR</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-6 space-y-4">
          {/* Promosyon kodu */}
          {!couponApplied ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-500" />
                Promosyon / İndirim Kodu
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(null); }}
                  placeholder="Kodunuzu girin (isteğe bağlı)"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!coupon.trim() || couponLoading}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Uygula"}
                </button>
              </div>
              {couponError && (
                <p className="text-xs text-red-600 font-medium">{couponError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Kupon uygulandı — {discount?.amount}₺ indirim!</span>
              </div>
              <button onClick={removeCoupon} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Ödeme iframe */}
          {initiating ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
              <p className="font-semibold text-slate-700">Ödeme sayfası hazırlanıyor...</p>
            </div>
          ) : iframeToken ? (
            <div className="space-y-3">
              <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-slate-200">
                <iframe
                  src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                  allow="payment"
                  className="w-full h-full"
                  title="Güvenli Ödeme"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                <Shield className="w-4 h-4 text-teal-500" />
                256-bit SSL ile şifrelenmiş güvenli ödeme
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              Ödeme sayfası yüklenemedi. Lütfen tekrar deneyin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────
export default function PaketlerPage() {
  const { user, token } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");

  // Kullanıcının mevcut paketini al
  useEffect(() => {
    if (user?.subscription_plan) setCurrentPlan(user.subscription_plan as PlanKey);
  }, [user]);

  const handleSelectPlan = useCallback(async (plan: Plan) => {
    if (plan.key === "free") {
      window.location.href = "/kayit";
      return;
    }
    if (plan.key === currentPlan) return;
    if (!token) {
      window.location.href = "/giris?redirect=/paketler";
      return;
    }
    setLoadingPlan(plan.key);
    setSelectedPlan(plan);
    setLoadingPlan(null);
  }, [token, currentPlan]);

  // Yıllık hesap: %20 indirim
  const discountedPrice = (price: number) =>
    billing === "yearly" ? Math.round(price * 12 * 0.8) : price;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero */}
        <div className="pt-20 pb-16 text-center px-4">
          <p className="inline-block text-teal-600 font-bold text-sm uppercase tracking-widest mb-4 px-3 py-1 bg-teal-50 rounded-full">
            Paketler & Fiyatlandırma
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-5">
            Hedefine Uygun{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-400">
              Paketi Seç
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto mb-10">
            7 gün ücretsiz dene. Beğenirsen devam et. İstediğin zaman iptal edebilirsin.
          </p>

          {/* Aylık / Yıllık toggle */}
          <div className="inline-flex items-center bg-slate-100 rounded-2xl p-1.5 gap-1">
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  billing === b ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {b === "monthly" ? "Aylık" : "Yıllık"}
                {b === "yearly" && (
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    %20 İndirim
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Paket kartları */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const c = COLOR_MAP[plan.color];
              const price = discountedPrice(plan.price);
              const isCurrentPlan = plan.key === currentPlan;
              const isLoading = loadingPlan === plan.key;

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-3xl border-2 p-7 transition-all duration-300 ${c.ring} ${c.bg} ${
                    plan.popular ? "scale-[1.02] lg:scale-[1.03]" : ""
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap shadow-sm ${c.badge}`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* İkon + isim */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.icon}`}>
                      <plan.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500">{plan.subtitle}</p>
                    </div>
                  </div>

                  {/* Fiyat */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <p className="text-4xl font-extrabold text-slate-900">Ücretsiz</p>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-extrabold text-slate-900">{price}₺</span>
                        <span className="text-slate-500 font-medium mb-1">
                          {billing === "yearly" ? "/yıl" : "/ay"}
                        </span>
                      </div>
                    )}
                    {billing === "yearly" && plan.price > 0 && (
                      <p className="text-xs text-teal-600 font-semibold mt-1">
                        {Math.round(price / 12)}₺/ay — {plan.price * 12 - price}₺ tasarruf
                      </p>
                    )}
                  </div>

                  {/* Özellikler */}
                  <ul className="space-y-3 mb-7">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span className={`text-sm ${f.bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA butonu */}
                  {isCurrentPlan ? (
                    <div className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-teal-50 border-2 border-teal-200 text-teal-700 font-bold text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Mevcut Paket
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isLoading}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${c.btn} disabled:opacity-70`}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Hazırlanıyor...</>
                      ) : (
                        <>{plan.cta} <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Güven göstergeleri */}
          <div className="mt-14 grid sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "256-bit SSL Güvenli Ödeme", desc: "PayTR altyapısı ile kredi kartı bilgileriniz tam koruma altında." },
              { icon: CheckCircle, title: "İstediğin Zaman İptal", desc: "Herhangi bir taahhüt yok. Bir tıkla aboneliğini durdurabilirsin." },
              { icon: Star, title: "7 Gün Para İadesi", desc: "Memnun kalmazsan ilk 7 gün içinde tam para iadesi alabilirsin." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Soru? */}
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Hangi paketi seçeceğini bilmiyor musun?{" "}
              <Link href="/iletisim" className="text-teal-600 font-semibold hover:underline">
                Bize ulaş →
              </Link>
            </p>
          </div>

          {/* Özellik Karşılaştırma Tablosu */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Paket Karşılaştırması</h2>
              <p className="text-slate-500">Hangi özelliklerin hangi planda olduğunu kolayca karşılaştır</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="bg-slate-900 text-white text-left px-6 py-4 font-semibold text-sm rounded-tl-2xl">Özellik</th>
                    {[
                      { name: "Free", color: "bg-slate-800" },
                      { name: "Bronze", color: "bg-amber-700" },
                      { name: "Plus", color: "bg-teal-700" },
                      { name: "Pro", color: "bg-teal-900 rounded-tr-2xl" },
                    ].map((p) => (
                      <th key={p.name} className={`${p.color} text-white text-center px-4 py-4 font-bold text-sm`}>
                        {p.name}
                        {p.name === "Plus" && (
                          <span className="block text-[10px] font-semibold text-teal-200 mt-0.5">En Popüler</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { feature: "Video Ders", free: "1 ünite/ders", bronze: "Tüm üniteler", plus: "Tüm üniteler", pro: "Tüm üniteler" },
                    { feature: "Soru Bankası", free: "10 soru/gün", bronze: "Günlük 50 soru", plus: "Sınırsız", pro: "Sınırsız" },
                    { feature: "Deneme Sınavı", free: "1 adet", bronze: "Aylık 2 adet", plus: "Sınırsız", pro: "Sınırsız" },
                    { feature: "Akıllı Günlük Plan", free: "7 gün", bronze: "✓", plus: "✓", pro: "✓" },
                    { feature: "Zayıf Kazanım Analizi", free: "✗", bronze: "✓", plus: "✓", pro: "✓" },
                    { feature: "AI Dijital Koç", free: "✗", bronze: "5 soru/gün", plus: "Sınırsız", pro: "Sınırsız" },
                    { feature: "Canlı Ders", free: "✗", bronze: "✗", plus: "✓", pro: "✓" },
                    { feature: "PDF İndirme", free: "✗", bronze: "✗", plus: "✓", pro: "✓" },
                    { feature: "Öğretmen Koçluğu", free: "✗", bronze: "✗", plus: "✗", pro: "✓" },
                    { feature: "Öncelikli Destek", free: "✗", bronze: "✗", plus: "✓", pro: "7/24 Destek" },
                    { feature: "Veli Takip Paneli", free: "✗", bronze: "✓", plus: "✓", pro: "✓" },
                  ].map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                      <td className="px-6 py-3.5 text-sm font-medium text-slate-700">{row.feature}</td>
                      {[row.free, row.bronze, row.plus, row.pro].map((val, ci) => (
                        <td key={ci} className={`px-4 py-3.5 text-center text-sm ${ci === 2 ? "bg-teal-50/40" : ""}`}>
                          {val === "✓" ? (
                            <span className="text-teal-600 font-bold text-base">✓</span>
                          ) : val === "✗" ? (
                            <span className="text-slate-300 font-bold text-base">✗</span>
                          ) : (
                            <span className="text-slate-600 font-medium">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Bölümü */}
          <FaqAccordion />
        </div>
      </div>

      {/* Ödeme modal */}
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          token={token}
          billing={billing}
          onClose={() => { setSelectedPlan(null); }}
        />
      )}
    </>
  );
}
