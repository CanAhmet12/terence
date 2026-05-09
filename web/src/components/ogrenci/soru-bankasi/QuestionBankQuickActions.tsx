"use client";

export function QuestionBankQuickActions({
  onQuick10,
  onWeakFocus,
  onTimedPractice,
  disabled,
}: {
  onQuick10: () => void;
  onWeakFocus: () => void;
  onTimedPractice: () => void;
  disabled: boolean;
}) {
  return (
    <fieldset>
      <legend>Hızlı modlar</legend>
      <button type="button" disabled={disabled} onClick={onQuick10}>
        Hızlı 10
      </button>
      <button type="button" disabled={disabled} onClick={onWeakFocus}>
        Kazanım seti
      </button>
      <button type="button" disabled={disabled} onClick={onTimedPractice}>
        Süreli 5 dk
      </button>
    </fieldset>
  );
}
