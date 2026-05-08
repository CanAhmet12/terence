import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Birden fazla lockfile varken Turbopack’in web kökünü doğru seçmesi (yalnızca `next dev` etkisi)
  turbopack: {
    root: path.resolve(__dirname),
  },

  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@react-three/fiber",
      "@react-three/drei",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "terenceegitim.com" },
      { protocol: "https", hostname: "cdn.terenceegitim.com" },
      { protocol: "https", hostname: "storage.terenceegitim.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "api.terenceegitim.com" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paytr.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://terenceegitim.com https://www.terenceegitim.com https://api.terenceegitim.com https://fcm.googleapis.com wss:",
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
        source: "/service-worker.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(sw.js|manifest.json|favicon.ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
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
