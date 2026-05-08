"use client";

export type MediaTypeFilter = "all" | "video" | "pdf" | "text";

const TABS: { id: MediaTypeFilter; label: string }[] = [
  { id: "all", label: "Tüm türler" },
  { id: "video", label: "Video" },
  { id: "pdf", label: "PDF" },
  { id: "text", label: "Bağlantı" },
];

type Props = {
  value: MediaTypeFilter;
  onChange: (v: MediaTypeFilter) => void;
};

export function MediaTypeFilter({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="İçerik türü"
      className="flex flex-wrap gap-2"
    >
      {TABS.map((t) => {
        const selected = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              selected
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
            }`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
