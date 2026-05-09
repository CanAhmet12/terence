'use client'

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function KullanimKosullariPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Kullanım Koşulları</h1>
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600 break-words">
            <p className="leading-relaxed">
              TERENCE EĞİTİM platformunu kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
            </p>
            <h2 className="text-xl font-semibold text-slate-900">Genel Kurallar</h2>
            <p>Platform içeriğini yalnızca kişisel eğitim amaçlı kullanabilirsiniz. İçeriklerin izinsiz kopyalanması ve dağıtılması yasaktır.</p>
            <h2 className="text-xl font-semibold text-slate-900">Abonelik</h2>
            <p>Ücretsiz deneme süresinin ardından seçtiğiniz paket için abonelik ücreti uygulanır. İstediğiniz zaman iptal edebilirsiniz.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
