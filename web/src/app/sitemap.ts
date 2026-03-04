import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://terenceegitim.com";
  const now = new Date().toISOString();

  const publicPages = [
    { url: base, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${base}/paketler`, priority: 0.9, changeFrequency: "monthly" as const },
    { url: `${base}/giris`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${base}/kayit`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${base}/iletisim`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${base}/gizlilik`, priority: 0.4, changeFrequency: "yearly" as const },
    { url: `${base}/kullanim-kosullari`, priority: 0.4, changeFrequency: "yearly" as const },
  ];

  return publicPages.map((p) => ({ ...p, lastModified: now }));
}
