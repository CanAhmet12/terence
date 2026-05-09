"use client";

import Link from "next/link";
import type { BadgeData, QuestionBankSubjectSummary, WeakAchievement } from "@/lib/api";

export function QuestionBankInsightsRow({
  subjects,
  weakPreview,
  badgeData,
  goalHint,
  loading,
}: {
  subjects: QuestionBankSubjectSummary[];
  weakPreview: WeakAchievement[];
  badgeData: BadgeData | null;
  goalHint?: string | null;
  loading: boolean;
}) {
  const bullets =
    weakPreview.length > 0
      ? weakPreview.slice(0, 4).map((w) => ({
          text: `${w.konu ?? w.kod}: doğruluk %${w.accuracy_rate}`,
          href: `/ogrenci/soru-bankasi?kazanim_code=${encodeURIComponent(w.kod)}`,
        }))
      : [];

  const badges = (badgeData?.badges ?? []).filter(Boolean).slice(0, 10);

  return (
    <div>
      <section aria-labelledby="qb-rec-heading">
        <h2 id="qb-rec-heading">Öneriler</h2>
        <p>{goalHint ?? "Hedef ve sınıfına göre öneriler burada listelenir."}</p>
        {loading ? (
          <p>Yükleniyor…</p>
        ) : bullets.length === 0 && !goalHint ? (
          <p>Henüz yeterli veri yok.</p>
        ) : (
          <ul>
            {bullets.map((b) => (
              <li key={b.href}>
                <Link href={b.href}>{b.text}</Link>
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link href="/ogrenci/zayif-kazanim">Zayıf kazanımlar</Link>
        </p>
      </section>

      <section aria-labelledby="qb-radar-heading">
        <h2 id="qb-radar-heading">Ders doğruluk özeti</h2>
        {subjects.length === 0 ? (
          <p>Veri yok.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Ders</th>
                <th scope="col">Doğruluk %</th>
                <th scope="col">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {subjects.slice(0, 12).map((s) => (
                <tr key={s.subject}>
                  <td>{s.subject}</td>
                  <td>{s.correct_rate != null ? Math.round(s.correct_rate) : "—"}</td>
                  <td>{s.total ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p>
          <Link href="/ogrenci/rapor">Detaylı rapor</Link>
        </p>
      </section>

      <section aria-labelledby="qb-badges-heading">
        <h2 id="qb-badges-heading">Rozetler</h2>
        {loading ? (
          <p>Yükleniyor…</p>
        ) : badges.length === 0 ? (
          <p>Rozet yok.</p>
        ) : (
          <ul>
            {badges.map((b) => (
              <li key={b.id}>
                {b.emoji ?? ""} {b.name}
              </li>
            ))}
          </ul>
        )}
        <p>
          <Link href="/ogrenci/rozet">Tüm rozetler</Link>
        </p>
      </section>
    </div>
  );
}
