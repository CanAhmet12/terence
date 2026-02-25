import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const font = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TERENCE EĞİTİM | Akıllı Öğrenme Platformu",
  description:
    "LGS, TYT, AYT, KPSS hazırlık. Hedef motoru, kişiye özel çalışma planı, 1M+ soru bankası. Öğrenci, öğretmen ve veli panelleri.",
  keywords: "LGS, TYT, AYT, KPSS, online eğitim, soru bankası, deneme sınavı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${font.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
