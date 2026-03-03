import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/paketler", "/giris", "/kayit", "/iletisim", "/gizlilik", "/kullanim-kosullari"],
        disallow: [
          "/ogrenci/",
          "/ogretmen/",
          "/veli/",
          "/admin/",
          "/profil/",
          "/bildirimler/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://terenceegitim.com/sitemap.xml",
    host: "https://terenceegitim.com",
  };
}
