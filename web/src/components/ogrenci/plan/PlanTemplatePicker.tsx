"use client";

import type { PlanTemplatePack } from "@/lib/api";
import { Loader2, Layers } from "lucide-react";

export function PlanTemplatePicker({
  templates,
  loading,
  applying,
  onApplyPack,
}: {
  templates: PlanTemplatePack[];
  loading: boolean;
  applying: boolean;
  onApplyPack: (pack: PlanTemplatePack) => Promise<void>;
}) {
  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Şablonlar yükleniyor…
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Layers className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Şablondan bugüne ekle</p>
          <p className="text-xs text-slate-500">
            Profiline uygun paketler; her biri birden fazla görev ekler.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {templates.map((pack) => (
          <button
            key={pack.key}
            type="button"
            disabled={applying}
            onClick={() => void onApplyPack(pack)}
            className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-50 sm:min-w-[200px]"
          >
            <span className="font-bold text-slate-800">{pack.label}</span>
            <span className="mt-0.5 text-xs text-slate-500">{pack.description}</span>
            <span className="mt-2 text-[11px] font-semibold text-indigo-600">
              {applying ? "Ekleniyor…" : `${pack.tasks.length} görev ekle →`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
