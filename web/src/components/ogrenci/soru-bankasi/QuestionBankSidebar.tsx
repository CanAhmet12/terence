"use client";

import Link from "next/link";
import type { ExamSession } from "@/lib/api";
import type { PlanStats } from "@/lib/api";

function examAnswered(ex: ExamSession): number {
  const c = ex.correct_count ?? 0;
  const w = ex.wrong_count ?? 0;
  const e = ex.empty_count ?? 0;
  const sum = c + w + e;
  if (sum > 0) return sum;
  return ex.total_questions ?? 0;
}

function examProgressPct(ex: ExamSession): number {
  const total = ex.total_questions ?? 0;
  const answered = examAnswered(ex);
  if (total > 0) return Math.min(100, Math.round((answered / total) * 100));
  if (typeof ex.score === "number" && ex.score <= 100 && ex.score >= 0) return Math.round(ex.score);
  return 0;
}

function examScoreLabel(ex: ExamSession): string {
  if (ex.net_score != null && ex.net_score !== undefined) return `%${Math.round(Number(ex.net_score))}`;
  if (typeof ex.score === "number") return `%${Math.round(ex.score)}`;
  const total = ex.total_questions ?? 0;
  const c = ex.correct_count ?? 0;
  if (total > 0) return `%${Math.round((c / total) * 100)}`;
  return "—";
}

function WeekStrip() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const days = labels.map((lab, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { lab, date: d.getDate(), isToday: d.toDateString() === now.toDateString() };
  });

  return (
    <ul>
      {days.map((d) => (
        <li key={d.lab}>
          {d.lab} {d.date}
          {d.isToday ? " (bugün)" : ""}
        </li>
      ))}
    </ul>
  );
}

export function QuestionBankSidebar({
  examHistory,
  planStats,
  loading,
  onPersonalTest,
  hidePersonalTestCard = false,
}: {
  examHistory: ExamSession[];
  planStats: PlanStats | null;
  loading: boolean;
  onPersonalTest: () => void;
  hidePersonalTestCard?: boolean;
}) {
  const done = planStats?.tasks_done_today ?? 0;
  const total = planStats?.tasks_total_today ?? 0;

  return (
    <aside aria-label="Yan bilgi">
      {!hidePersonalTestCard && (
        <section>
          <h2>Bana özel test</h2>
          <p>Özel test oluştur.</p>
          <button type="button" onClick={onPersonalTest}>
            Test oluştur
          </button>
        </section>
      )}

      <section aria-labelledby="qb-history-heading">
        <h2 id="qb-history-heading">Son çözdüğün testler</h2>
        <p>
          <Link href="/ogrenci/deneme">Tümü</Link>
        </p>
        {loading ? (
          <p>Yükleniyor…</p>
        ) : examHistory.length === 0 ? (
          <p>Henüz kayıtlı deneme yok.</p>
        ) : (
          <ul>
            {examHistory.slice(0, 5).map((ex) => {
              const pct = examProgressPct(ex);
              const answered = examAnswered(ex);
              const totalQ = ex.total_questions ?? answered;
              return (
                <li key={ex.id}>
                  <strong>{ex.title ?? ex.exam_type ?? "Deneme"}</strong> {examScoreLabel(ex)}
                  <br />
                  {answered}/{totalQ || "—"} soru — ilerleme %{pct}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="qb-cal-heading">
        <h2 id="qb-cal-heading">Çalışma takvimi</h2>
        <p>
          <button type="button" aria-label="Önceki hafta">
            ‹
          </button>
          <button type="button" aria-label="Sonraki hafta">
            ›
          </button>
        </p>
        <WeekStrip />
      </section>

      <section aria-labelledby="qb-goal-heading">
        <h2 id="qb-goal-heading">Günlük hedef</h2>
        <p>
          <Link href="/ogrenci/plan">Düzenle</Link>
        </p>
        {loading && !planStats ? (
          <p>Yükleniyor…</p>
        ) : planStats && (planStats.tasks_total_today ?? 0) <= 0 ? (
          <p>Bugün için planda görev yok.</p>
        ) : (
          <p>
            Görev: {done} / {total > 0 ? total : 1}
          </p>
        )}
        <p>
          <Link href="/ogrenci/plan">Plana git</Link>
        </p>
      </section>
    </aside>
  );
}
