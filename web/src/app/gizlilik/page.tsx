import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function GizlilikPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Gizlilik Politikası</h1>
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <p className="leading-relaxed">
              TERENCE EĞİTİM olarak kişisel verilerinizin güvenliği bizim için önemlidir.
            </p>
            <h2 className="text-xl font-semibold text-slate-900">Topladığımız Veriler</h2>
            <p>Kayıt ve hizmet kullanımı sırasında ad, e-posta, sınıf ve hedef bilgilerinizi topluyoruz.</p>
            <h2 className="text-xl font-semibold text-slate-900">Verilerin Kullanımı</h2>
            <p>Toplanan veriler platform hizmetlerinin sunulması, kişiselleştirilmiş öğrenme planı oluşturulması ve iletişim amaçlı kullanılır.</p>
            <h2 className="text-xl font-semibold text-slate-900">Veri Güvenliği</h2>
            <p>Verileriniz şifreli bağlantılar üzerinden iletilir ve güvenli sunucularda saklanır.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
