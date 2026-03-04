import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "terenceegitim.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "api.terenceegitim.com" },
    ],
    minimumCacheTTL: 3600,
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Tüm sayfalar için temel güvenlik başlıkları
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paytr.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://api.terenceegitim.com https://fcm.googleapis.com wss:",
              "frame-src 'self' https://www.paytr.com https://*.daily.co https://terence.daily.co",
              "worker-src 'self' blob:",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Service worker ve manifest için cache headers
        source: "/(sw.js|manifest.json|favicon.ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // Statik varlıklar için uzun süreli cache
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/ogrenci/zayif-kazan%C4%B1m",
        destination: "/ogrenci/zayif-kazanim",
        permanent: true,
      },
      {
        source: "/ogrenci/zayif-kazan%C4%B1m/:path*",
        destination: "/ogrenci/zayif-kazanim/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
