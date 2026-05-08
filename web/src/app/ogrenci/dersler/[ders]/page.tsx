"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Eski kurs tabanlı rota. Öğrenci deneyimi müfredat (Derslerim) üzerinden birleştirildi.
 */
export default function LegacyDersRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const slug = typeof params?.ders === "string" ? params.ders : "";
    const q = slug ? `?from=legacy-course&slug=${encodeURIComponent(slug)}` : "";
    router.replace(`/ogrenci/dersler${q}`);
  }, [router, params]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-slate-50 px-4">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-hidden />
      <p className="text-center text-sm text-slate-600">Müfredat sayfasına yönlendiriliyorsunuz…</p>
    </div>
  );
}
