import Script from 'next/script'
import { Metadata, Viewport } from 'next'
import './globals.css'

// Force all pages to use dynamic rendering (no static generation)
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export const metadata: Metadata = {
  title: 'Terence - YKS/LGS Hazırlık Platformu',
  description: 'Türkiye\'nin en gelişmiş eğitim platformu. AI destekli öğrenme, 3D kütüphane, sınırsız soru bankası.',
  keywords: ['YKS', 'LGS', 'eğitim', 'online kurs', 'soru bankası', 'AI mentor'],
  authors: [{ name: 'Terence' }],
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Terence',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Terence',
    title: 'Terence - YKS/LGS Hazırlık',
    description: 'AI destekli eğitim platformu',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terence - YKS/LGS Hazırlık',
    description: 'AI destekli eğitim platformu',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://cdn.terenceegitim.com" />
        <link rel="dns-prefetch" href="https://cdn.terenceegitim.com" />
        
        {/* Service Worker registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                  .then((reg) => console.log('SW registered:', reg))
                  .catch((err) => console.log('SW registration failed:', err))
              })
            }
          `}
        </Script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
