"use client";

export function TopicAbout({ title, body }: { title?: string; body?: string | null }) {
  if (!body?.trim()) return null;
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="topic-about-heading">
      <h2 id="topic-about-heading" className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
        {title ?? "Konu hakkında"}
      </h2>
      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{body}</p>
    </section>
  );
}
