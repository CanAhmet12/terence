"use client";

export function StudyMotivationBanner({
  onStartQuick,
}: {
  onStartQuick: () => void;
}) {
  return (
    <aside aria-label="Çalışma hatırlatması">
      <p>Hedeflerine ulaşmak için düzenli çalış.</p>
      <p>Bugün soru çözerek hedefini tamamlayabilirsin.</p>
      <button type="button" onClick={onStartQuick}>
        Hızlı set ile başla
      </button>
    </aside>
  );
}
