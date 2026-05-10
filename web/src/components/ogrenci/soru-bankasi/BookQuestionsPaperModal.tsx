"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import type { Question, AnswerResult } from "@/lib/api";

function diffLabel(d?: string): string {
  if (d === "easy") return "Kolay";
  if (d === "hard") return "Zor";
  if (d === "medium") return "Orta";
  return d ?? "—";
}

/** Tam ekran, kitap sayfası / basılı soru kitabı görünümü */
export function BookQuestionsPaperModal({
  subject,
  title,
  questions,
  loading,
  answerResults,
  answeringId,
  loadingSimilar,
  onAnswer,
  onSimilar,
  onClose,
}: {
  subject: string;
  title: string;
  questions: Question[];
  loading: boolean;
  answerResults: Record<number, AnswerResult & { selected: string; solution_video?: string }>;
  answeringId: number | null;
  loadingSimilar?: number | null;
  onAnswer: (q: Question, opt: string) => void;
  onSimilar?: (questionId: number) => void;
  onClose: () => void;
}) {
  const questionsPerPage = 1;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.max(1, questions.length);
  const soru = questions[currentPage];
  const result = soru ? answerResults[soru.id] : undefined;
  const answeredCount = Object.keys(answerResults).length;
  const qNum = currentPage + 1;

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, Math.max(0, questions.length - 1)));
  }, [questions.length]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#c8c2b6]">
      {/* Masa / zemin */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23665432' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-stone-600/30 bg-stone-800/95 px-4 py-3 text-stone-100 shadow-md backdrop-blur-sm sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-stone-400">{subject}</p>
          <h2 className="truncate font-serif text-lg font-semibold text-white sm:text-xl">{title}</h2>
          <p className="text-xs text-stone-400">
            Çözülen {answeredCount} / {questions.length || "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-stone-500 bg-stone-700 px-3 py-2 text-sm font-medium text-white hover:bg-stone-600"
        >
          <X className="h-4 w-4" aria-hidden />
          Kapat
        </button>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-12 w-12 animate-spin text-stone-600" aria-hidden />
            <p className="font-serif text-stone-700">Sayfalar yükleniyor…</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="max-w-md rounded-sm border border-stone-400/50 bg-[#fdfbf7] px-8 py-12 text-center font-serif text-stone-600 shadow-lg">
              Bu derse ait soru bulunamadı.
            </p>
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-3 py-6 sm:px-8 sm:py-8">
              {/* Kağıt sayfa */}
              <article
                className="relative w-full max-w-3xl border border-stone-300/90 bg-[#fdfbf7] px-6 py-8 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_12px_28px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-12 sm:py-10 md:px-14 md:py-12"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
                  backgroundSize: "100% 28px",
                  lineHeight: "28px",
                }}
              >
                <div className="mb-8 flex flex-wrap items-center justify-between gap-2 border-b border-stone-300/80 pb-3 font-serif">
                  <span className="text-sm font-semibold tabular-nums text-stone-800">Soru {qNum}</span>
                  <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                    {soru?.kazanim_code && <span className="rounded border border-stone-300 px-2 py-0.5">{soru.kazanim_code}</span>}
                    <span className="rounded border border-stone-300 px-2 py-0.5">{diffLabel(soru?.difficulty)}</span>
                  </div>
                </div>

                <div className="font-serif text-[17px] leading-[1.75] text-stone-900 sm:text-lg">
                  <p className="text-pretty">{soru?.question_text}</p>
                </div>

                <ul className="mt-8 space-y-0 divide-y divide-stone-300/80 border-t border-stone-300/80">
                  {soru?.options?.map((opt) => (
                    <li key={opt.id}>
                      <button
                        type="button"
                        disabled={!!result || answeringId === soru.id}
                        onClick={() =>
                          soru &&
                          onAnswer(
                            soru,
                            opt.option_letter ?? opt.letter ?? "",
                          )
                        }
                        className="flex w-full items-start gap-4 py-4 text-left font-serif text-[16px] text-stone-900 transition hover:bg-amber-50/50 disabled:pointer-events-none disabled:opacity-50 sm:text-[17px]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-stone-800 font-semibold tabular-nums text-stone-900">
                          {opt.option_letter}
                        </span>
                        <span className="min-w-0 flex-1 pt-0.5 leading-relaxed">{opt.option_text}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                {result && (
                  <div
                    className={`mt-8 border-l-4 px-4 py-3 font-serif text-sm sm:text-base ${
                      result.is_correct
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-950"
                        : "border-rose-600 bg-rose-50/80 text-rose-950"
                    }`}
                  >
                    <strong>{result.is_correct ? "Doğru" : "Yanlış"}</strong>
                    {result.explanation && <p className="mt-2 leading-relaxed">{result.explanation}</p>}
                  </div>
                )}

                {result?.solution_video && (
                  <p className="mt-6 font-serif text-sm">
                    <a
                      href={result.solution_video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-violet-800 underline underline-offset-2 hover:text-violet-950"
                    >
                      Video çözüm
                    </a>
                  </p>
                )}

                {result && onSimilar && (
                  <div className="mt-8 border-t border-stone-300 pt-6">
                    <button
                      type="button"
                      disabled={loadingSimilar === soru.id}
                      onClick={() => soru && onSimilar(soru.id)}
                      className="rounded-sm border border-stone-400 bg-stone-100 px-4 py-2 font-serif text-sm font-medium text-stone-800 hover:bg-stone-200 disabled:opacity-50"
                    >
                      {loadingSimilar === soru.id ? "Yükleniyor…" : "Benzer sorular"}
                    </button>
                  </div>
                )}

                {/* Sayfa köşesi gölgesi */}
                <div
                  className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 bg-gradient-to-tl from-black/[0.06] to-transparent"
                  aria-hidden
                />
              </article>
            </div>

            <footer className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-t border-stone-500/40 bg-[#ece8df]/95 px-4 py-4 backdrop-blur-sm sm:px-8">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-500 bg-[#fdfbf7] px-4 py-2.5 font-serif text-sm font-medium text-stone-800 shadow-sm hover:bg-white disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Önceki sayfa
              </button>
              <p className="font-serif text-sm tabular-nums text-stone-700">
                Sayfa {currentPage + 1} / {totalPages}
              </p>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-500 bg-[#fdfbf7] px-4 py-2.5 font-serif text-sm font-medium text-stone-800 shadow-sm hover:bg-white disabled:opacity-35"
              >
                Sonraki sayfa
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
