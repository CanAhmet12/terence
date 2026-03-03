import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { PwaInit } from "@/components/PwaInit";

const font = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_URL = "https://terenceegitim.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TERENCE EĞİTİM | Akıllı Öğrenme Platformu",
    template: "%s | TERENCE EĞİTİM",
  },
  description:
    "LGS, TYT, AYT, KPSS hazırlık için Türkiye'nin en akıllı eğitim platformu. Kişiye özel çalışma planı, 1M+ soru bankası, online deneme sınavı, canlı ders.",
  keywords: [
    "LGS hazırlık",
    "TYT hazırlık",
    "AYT hazırlık",
    "KPSS hazırlık",
    "online eğitim",
    "soru bankası",
    "deneme sınavı",
    "akıllı çalışma planı",
    "hedef motoru",
    "terence eğitim",
  ],
  authors: [{ name: "Terence Eğitim", url: BASE_URL }],
  creator: "Terence Eğitim",
  publisher: "Terence Eğitim",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: BASE_URL,
    siteName: "Terence Eğitim",
    title: "TERENCE EĞİTİM | Akıllı Öğrenme Platformu",
    description:
      "LGS, TYT, AYT, KPSS hazırlık. Hedef motoru, kişiye özel çalışma planı, 1M+ soru bankası.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Terence Eğitim" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TERENCE EĞİTİM | Akıllı Öğrenme Platformu",
    description: "LGS, TYT, AYT, KPSS hazırlık. 1M+ soru bankası, online deneme, canlı ders.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  alternates: { canonical: BASE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${font.variable} font-sans antialiased`}>
        <AuthProvider>
          <PwaInit />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
