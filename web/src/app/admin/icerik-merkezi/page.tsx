"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ClipboardList, FileQuestion, Library, ListVideo, Upload } from "lucide-react";

const cards = [
  {
    href: "/admin/icerik/yukle",
    title: "Müfredat medyası",
    desc: "Video veya PDF dosyasını bilgisayardan yükleyin; müfredat konusuna bağlanır. Harici link yok.",
    icon: Upload,
    accent: "from-teal-600 to-emerald-500",
  },
  {
    href: "/admin/icerik",
    title: "Yüklenen içerikler",
    desc: "Bağlı video ve PDF kayıtlarını listeleyin veya silin.",
    icon: ListVideo,
    accent: "from-slate-700 to-slate-600",
  },
  {
    href: "/admin/deneme-sablonlari",
    title: "Deneme şablonları",
    desc: "TYT, AYT, LGS vb. deneme şablonları; süre, sınıf ve soru listesi yönetimi.",
    icon: ClipboardList,
    accent: "from-sky-600 to-blue-600",
  },
  {
    href: "/admin/sorular",
    title: "Soru havuzu",
    desc: "Tek tek veya toplu (JSON) soru girişi. PDF’ten otomatik soru çıkarma bir sonraki sürümde planlanır.",
    icon: FileQuestion,
    accent: "from-violet-600 to-purple-500",
  },
  {
    href: "/admin/soru-bankasi-kitaplari",
    title: "Kitap kapakları",
    desc: "Soru bankasında görünen 3D kitap kartları: metinler, renkler ve ders/sınıf eşlemesi.",
    icon: Library,
    accent: "from-amber-600 to-orange-500",
  },
];

export default function AdminIcerikMerkeziPage() {
  return (
    <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10 overflow-x-hidden">
      <div className="mb-8 flex w-full min-w-0 items-center justify-between gap-4">
        <Link
          href="/admin"
          className="inline-flex w-fit shrink-0 items-center gap-2 text-slate-600 hover:text-teal-600 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Panele dön
        </Link>
        <span className="hidden shrink-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:block">
          İçerik yönetimi
        </span>
      </div>

      <div className="mb-10 flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/25">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">İçerik merkezi</h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
              Tüm yükleme ve içerik yönetimi akışları buradan dallanır. Medya yalnızca dosya ile gelir; öğretmen paneli de aynı kurala geçirildi. Çok sayfalı kitabı PDF olarak tek dosya
              yükleyebilirsiniz; sayfa sayfa ayrıştırma ve soru-PDF OCR için altyapı ayrıca genişletilecektir.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, title, desc, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-300 hover:shadow-md"
          >
            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{title}</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-600">
              Aç
              <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-950">
        <p className="font-semibold text-emerald-900 mb-2">PDF kitap görünümü (yeni)</p>
        <p className="mb-2">
          Yüklenen PDF dosyaları sunucuda sayfa görüntülerine bölünür (poppler <code className="text-xs bg-white/60 px-1 rounded">pdftoppm</code> veya Imagick).
          Öğrenci &quot;Derslerim&quot; ve &quot;Video &amp; PDF&quot; ekranında sayfa sayfa okuyabilir; iş kuyrukta çalışır — birkaç saniye sonra yenileyin.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-950">
        <p className="font-semibold text-amber-900 mb-2">Yol haritası (kısa)</p>
        <ul className="list-disc pl-5 space-y-1 text-amber-900/90">
          <li>
            <strong>PDF kitap:</strong> sayfa görselleri (canlıda) — sunucuda{" "}
            <code className="text-xs bg-white/60 px-1 rounded">apt install poppler-utils</code> önerilir.
          </li>
          <li>Soru seti: Word/PDF şablon içe aktarma veya OCR + onay adımı.</li>
          <li>Video: ffmpeg ile gerçek kare kapak ve süre meta verisi.</li>
        </ul>
      </div>
    </div>
  );
}
