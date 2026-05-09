"use client";

type ScopeMode = "class" | "exam";

type QuestionBankHeroProps = {
  scopeMode: ScopeMode;
  onScopeModeChange: (mode: ScopeMode) => void;
  examTabs: string[];
  activeExamTab: string;
  onExamTabChange: (tab: string) => void;
  onOpenVoice: () => void;
  onOpenPersonalTest: () => void;
};

export function QuestionBankHero({
  scopeMode,
  onScopeModeChange,
  examTabs,
  activeExamTab,
  onExamTabChange,
  onOpenVoice,
  onOpenPersonalTest,
}: QuestionBankHeroProps) {
  return (
    <section>
      <h1>Soru Bankası</h1>
      <p>Sınıfına ve hedeflerine uygun soruları çöz, eksiklerini tamamla!</p>

      <div role="group" aria-label="Kapsam">
        <button type="button" onClick={() => onScopeModeChange("class")}>
          Sınıf
        </button>
        <button type="button" onClick={() => onScopeModeChange("exam")}>
          Sınav
        </button>
      </div>

      <p>
        <button type="button" onClick={onOpenVoice}>
          Sesli çözüm
        </button>
      </p>

      {scopeMode === "exam" && examTabs.length > 1 && (
        <div role="tablist" aria-label="Sınav türü">
          <p>Sınav türü</p>
          {examTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeExamTab === tab}
              onClick={() => onExamTabChange(tab)}
            >
              {tab === "ORTAK" ? "Ortak" : tab}
            </button>
          ))}
        </div>
      )}

      <section aria-labelledby="qb-personal-test-heading">
        <h2 id="qb-personal-test-heading">Bana Özel Test</h2>
        <p>Kendi seviyene uygun özel test oluştur.</p>
        <button type="button" onClick={onOpenPersonalTest}>
          Test oluştur
        </button>
      </section>
    </section>
  );
}
