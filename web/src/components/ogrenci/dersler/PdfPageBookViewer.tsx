"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, ExternalLink } from "lucide-react";

type Props = {
  pageUrls: string[];
  /** Tam PDF (embed veya yeni sekme) */
  pdfUrl?: string | null;
  title?: string;
  /** Sayfa görüntüsü yoksa embed kullanılır */
  preferEmbedWhenNoPages?: boolean;
};

export function PdfPageBookViewer({ pageUrls, pdfUrl, title, preferEmbedWhenNoPages = true }: Props) {
  const [page, setPage] = useState(0);
  const hasPages = pageUrls.length > 0;
  const last = pageUrls.length - 1;

  if (!hasPages) {
    if (preferEmbedWhenNoPages && pdfUrl) {
      return (
        <div className="flex h-full min-h-[280px] w-full flex-col bg-white">
          <embed src={pdfUrl} type="application/pdf" className="min-h-0 w-full flex-1" title={title ?? "PDF"} />
          {pdfUrl ? (
            <div className="flex shrink-0 justify-center border-t border-slate-200 py-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 underline-offset-2 hover:underline"
              >
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                Yeni sekmede aç
                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-sm text-slate-600">
        <p>PDF henüz sayfalara bölünmedi veya sunucuda dönüştürücü yok.</p>
        {pdfUrl ? (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-700 underline">
            PDF dosyasını aç
          </a>
        ) : null}
      </div>
    );
  }

  const src = pageUrls[page] ?? "";

  return (
    <div className="flex h-full min-h-[320px] w-full flex-col bg-slate-100">
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-2 sm:p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title ? `${title} — sayfa ${page + 1}` : `Sayfa ${page + 1}`}
          className="max-h-[min(72dvh,720px)] w-auto max-w-full rounded-lg border border-slate-200 bg-white object-contain shadow-md"
          loading="lazy"
        />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page <= 0}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Önceki
        </button>
        <span className="text-sm font-medium text-slate-600">
          Sayfa {page + 1} / {pageUrls.length}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(last, p + 1))}
          disabled={page >= last}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sonraki
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {pdfUrl ? (
        <div className="flex justify-center border-t border-slate-100 bg-white py-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-violet-700 underline-offset-2 hover:underline sm:text-sm"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            Orijinal PDF (yeni sekme)
            <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
          </a>
        </div>
      ) : null}
    </div>
  );
}
