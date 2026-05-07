"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

const TYPES: { value: string; label: string }[] = [
  { value: "custom", label: "Özel" },
  { value: "question", label: "Soru" },
  { value: "video", label: "Video" },
  { value: "exam", label: "Deneme" },
  { value: "read", label: "Okuma" },
];

export function PlanAddTaskDrawer({
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    type: string;
    subject?: string;
    planned_minutes?: number;
  }) => Promise<void>;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("custom");
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState("30");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setType("custom");
    setSubject("");
    setMinutes("30");
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    const m = parseInt(minutes, 10);
    await onSubmit({
      title: title.trim(),
      type,
      subject: subject.trim() || undefined,
      planned_minutes: Number.isFinite(m) && m > 0 ? m : 30,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-slate-900/40"
        onClick={() => !submitting && onClose()}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Görev ekle</h2>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onClose()}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Başlık
        </label>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ne çalışacaksın?"
        />

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tür
        </p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                type === t.value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ders (isteğe bağlı)
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Matematik"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Süre (dk)
            </label>
            <input
              type="number"
              min={5}
              max={480}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={submitting || !title.trim()}
          onClick={() => void handleSubmit()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Kaydet
        </button>
      </div>
    </div>
  );
}
