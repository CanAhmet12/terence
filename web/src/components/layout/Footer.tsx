import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, ArrowUpRight } from "lucide-react";

const footerLinks = {
  platform: [
    { label: "Öğrenci Paneli", href: "/ogrenci" },
    { label: "Öğretmen Paneli", href: "/ogretmen" },
    { label: "Veli Paneli", href: "/veli" },
    { label: "Özellikler", href: "/#ozellikler" },
    { label: "Neden Biz", href: "/#neden-biz" },
    { label: "Paketler", href: "/#paketler" },
    { label: "Nasıl Çalışır", href: "/#nasil-calisir" },
  ],
  destek: [
    { label: "SSS", href: "/#sss" },
    { label: "İletişim", href: "/iletisim" },
    { label: "Profil", href: "/profil" },
    { label: "Gizlilik Politikası", href: "/gizlilik" },
    { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-slate-900 text-slate-300 overflow-hidden">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand - premium his */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <Image src="/logo.png" alt="Terence Eğitim" width={48} height={48} className="rounded-2xl" />
              <span className="font-bold text-xl text-white tracking-tight">
                TERENCE <span className="text-teal-400">EĞİTİM</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              Akıllı hedef motoru, kişiye özel çalışma planı ve 1M+ soru bankası ile LGS, TYT, AYT, KPSS hazırlığınızı zirveye taşıyoruz.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:destek@terenceegitim.com"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors text-sm group"
              >
                <Mail className="w-4 h-4 text-teal-400/80 group-hover:text-teal-400" />
                destek@terenceegitim.com
              </a>
              <a
                href="tel:08501234567"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors text-sm group"
              >
                <Phone className="w-4 h-4 text-teal-400/80 group-hover:text-teal-400" />
                0850 123 45 67
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Platform</h3>
            <ul className="space-y-3.5">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-teal-400 transition-colors text-sm group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Destek */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Destek</h3>
            <ul className="space-y-3.5">
              {footerLinks.destek.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-teal-400 transition-colors text-sm group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} TERENCE EĞİTİM. Tüm hakları saklıdır.
          </p>
          <p className="text-slate-600 text-sm">
            Hedefine özel akıllı öğrenme platformu
          </p>
        </div>
      </div>
    </footer>
  );
}
