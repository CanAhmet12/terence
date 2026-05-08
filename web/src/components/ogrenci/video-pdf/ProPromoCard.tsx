"use client";

import Link from "next/link";
import { Crown } from "lucide-react";

export function ProPromoCard() {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
          <Crown className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-amber-950">PRO ile sınırsız erişim</h3>
          <p className="mt-1 text-sm text-amber-900/80">
            Kilitli videolara ve tüm müfredat içeriklerine tam erişin.
          </p>
          <Link
            href="/paketler"
            className="mt-3 inline-flex rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-amber-500"
          >
            Paketleri incele
          </Link>
        </div>
      </div>
    </div>
  );
}
