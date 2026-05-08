"use client";

import { ExternalLink, FileText } from "lucide-react";

export function PdfPanel({ url }: { url: string }) {
  return (
    <div className="flex h-full w-full flex-col bg-slate-900">
      <div className="min-h-0 flex-1">
        <embed src={url} type="application/pdf" className="h-full min-h-[320px] w-full" title="PDF ders notu" />
      </div>
      <div className="flex shrink-0 items-center justify-center gap-3 border-t border-slate-700 py-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 sm:text-sm"
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden />
          PDF’yi yeni sekmede aç
          <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
        </a>
      </div>
    </div>
  );
}
