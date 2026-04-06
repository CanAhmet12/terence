'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Check, X, Loader2 } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Temel',
    price: 99,
    features: [
      '1000 soru çözme',
      'Temel videolar',
      'Sınav sistemi',
      'Basit raporlama',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    features: [
      'Sınırsız soru çözme',
      'Tüm videolar (HD)',
      'AI Mentor',
      'Spaced Repetition',
      'Detaylı analiz',
      'Canlı ders',
    ],
    popular: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 299,
    features: [
      'Premium tüm özellikler',
      '1-1 mentörlük',
      'Özel çalışma planı',
      'Öncelikli destek',
      'Sınırsız canlı ders',
      'Sertifika',
    ],
  },
]

export default function PaymentFlow() {
  const [selectedPlan, setSelectedPlan] = useState<string>('premium')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [paymentIframeUrl, setPaymentIframeUrl] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/v1/payments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: selectedPlan,
          billing_period: billingPeriod,
        }),
      })

      if (!response.ok) throw new Error('Payment creation failed')

      const data = await response.json()

      // Open PayTR iframe
      setPaymentIframeUrl(data.payment_url)
    } catch (err) {
      console.error('Payment error:', err)
      alert('Ödeme başlatılamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  // Listen for payment completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'payment_success') {
        alert('Ödeme başarılı! Aboneliğiniz aktifleştirildi.')
        window.location.href = '/dashboard'
      } else if (event.data.type === 'payment_failed') {
        alert('Ödeme başarısız. Lütfen tekrar deneyin.')
        setPaymentIframeUrl(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (paymentIframeUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden">
          <div className="bg-gray-100 p-4 flex items-center justify-between border-b">
            <h2 className="text-lg font-bold text-gray-900">Güvenli Ödeme</h2>
            <button
              onClick={() => setPaymentIframeUrl(null)}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <iframe
            src={paymentIframeUrl}
            className="w-full h-full"
            title="Ödeme"
          />
        </div>
      </div>
    )
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan)
  const finalPrice = billingPeriod === 'yearly'
    ? (selectedPlanData?.price || 0) * 10 // 2 month discount
    : selectedPlanData?.price || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planını Seç, Başarıya Başla
          </h1>
          <p className="text-gray-600 text-lg">
            7 gün ücretsiz deneme, istediğin zaman iptal edebilirsin
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700'
            }`}
          >
            Aylık
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              billingPeriod === 'yearly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700'
            }`}
          >
            Yıllık
            <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
              2 AY BEDAVA
            </span>
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 ${
                plan.popular ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-bold">
                  🔥 EN POPÜLER
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ₺{billingPeriod === 'yearly' ? plan.price * 10 : plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">
                    / {billingPeriod === 'yearly' ? 'yıl' : 'ay'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    selectedPlan === plan.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Seçili' : 'Seç'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Button */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Seçilen Plan</h3>
              <p className="text-gray-600">{selectedPlanData?.name} - {billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">₺{finalPrice}</p>
              <p className="text-sm text-gray-600">
                {billingPeriod === 'yearly' && `₺${(finalPrice / 12).toFixed(0)} / ay`}
              </p>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                İşlem yapılıyor...
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6" />
                Güvenli Ödemeye Geç
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            🔒 256-bit SSL ile korunan güvenli ödeme
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Sık Sorulan Sorular</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">7 günlük deneme nasıl çalışır?</h4>
              <p className="text-gray-600 text-sm">
                İlk 7 gün tamamen ücretsiz. İstediğin zaman iptal edebilirsin, hiçbir ücret alınmaz.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">İstediğim zaman iptal edebilir miyim?</h4>
              <p className="text-gray-600 text-sm">
                Evet! Taahhüt yok, istediğin zaman iptal edebilirsin. İptalden sonra dönem sonuna kadar kullanmaya devam edebilirsin.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Hangi ödeme yöntemlerini kabul ediyorsunuz?</h4>
              <p className="text-gray-600 text-sm">
                Kredi kartı, banka kartı ve havale ile ödeme yapabilirsin. Tüm ödemeler PayTR üzerinden güvenle işlenir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
