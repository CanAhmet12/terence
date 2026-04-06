import { Metadata, Viewport } from 'next'
import './globals.css'
import { ClientLayout } from '@/components/ClientLayout'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export const metadata: Metadata = {
  title: 'Terence - YKS/LGS Hazırlık Platformu',
  description: 'Türkiye\'nin en gelişmiş eğitim platformu. AI destekli öğrenme, 3D kütüphane, sınırsız soru bankası.',
  keywords: ['YKS', 'LGS', 'eğitim', 'online kurs', 'soru bankası', 'AI mentor'],
  authors: [{ name: 'Terence' }],
  manifest: '/manifest.json',
  metadataBase: new URL('https://terenceegitim.com'),
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
        <link rel="preconnect" href="https://cdn.terenceegitim.com" />
        <link rel="dns-prefetch" href="https://cdn.terenceegitim.com" />
      </head>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
