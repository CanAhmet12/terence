"use client";

export function TopicAbout({ title, body }: { title?: string; body?: string | null }) {
  if (!body?.trim()) return null;
  return (
    <section className="rounded-3xl border border-slate-100/90 bg-white p-6 shadow-md shadow-slate-200/25 ring-1 ring-slate-900/5 md:p-8" aria-labelledby="topic-about-heading">
      <h2 id="topic-about-heading" className="mb-3 text-lg font-bold text-slate-900 md:text-xl">
        {title ?? "Konu Hakkında"}
      </h2>
      <p className="text-sm leading-relaxed text-slate-600 md:text-base whitespace-pre-wrap">{body}</p>
    </section>
  );
}
