<?php

namespace App\Services;

use App\Models\User;

/**
 * BI-6 — Parent Intelligence Engine.
 * Generates human-readable insights for parents from already-computed risk,
 * trajectory and recommendation data. No new DB queries beyond what callers provide.
 */
class ParentInsightService
{
    /**
     * Lightweight insight for child list / summary.
     * Uses pre-computed data — no extra DB calls (important for N-child lists).
     *
     * @param  string  $riskLevel   'green' | 'yellow' | 'red'
     * @param  array   $weeklyNets  float[] weekly net scores (oldest → newest)
     * @param  int     $daysSince   Days since last study session
     * @param  string  $childName   First name of child
     */
    public function forSummary(
        string $riskLevel,
        array  $weeklyNets,
        int    $daysSince,
        string $childName = 'Öğrenci',
    ): array {
        $riskTier  = $this->riskLevelToTier($riskLevel);
        $trend     = $this->detectTrend($weeklyNets);
        $scenario  = $this->classifyScenario($riskTier, $trend);

        [$summary, $riskReason, $trendLabel, $recommendedAction] =
            $this->buildTexts($scenario, $childName, $weeklyNets, $daysSince);

        $confidence = $this->computeConfidence(count($weeklyNets), $daysSince);

        return [
            'summary'            => $summary,
            'risk_reason'        => $riskReason,
            'trend'              => $trendLabel,
            'recommended_action' => $recommendedAction,
            'confidence'         => $confidence,
        ];
    }

    /**
     * Richer insight for child report (single-child context).
     * May use canonical_risk + primary_recommendation from caller.
     *
     * @param  array  $canonicalRisk        from buildChildReport canonical_risk
     * @param  array  $weeklyNets           float[] net scores
     * @param  array|null $primaryRec       from RecommendationService (optional)
     * @param  string|null $lastInterventionLabel  from TeacherInterventionService (optional)
     * @param  string $childName
     */
    public function forReport(
        array  $canonicalRisk,
        array  $weeklyNets,
        ?array $primaryRec = null,
        ?string $lastInterventionLabel = null,
        string $childName = 'Öğrenci',
    ): array {
        $riskTier = $canonicalRisk['tier'] ?? 'on_track';
        $trend    = $this->detectTrend($weeklyNets);
        $scenario = $this->classifyScenario($riskTier, $trend);

        [$summary, $riskReason, $trendLabel, $recommendedAction] =
            $this->buildTexts($scenario, $childName, $weeklyNets, 0);

        // P1: override recommended_action with primary recommendation if available
        if ($primaryRec && isset($primaryRec['type'])) {
            $recommendedAction = $this->recToParentAction($primaryRec, $childName);
        }

        // P1: Intervention context
        $interventionNote = null;
        if ($lastInterventionLabel && str_contains($lastInterventionLabel, 'gün')) {
            $interventionNote = 'Öğretmen tarafından yakın zamanda çalışma planı gönderildi.';
        }

        $confidence = $this->computeConfidence(count($weeklyNets), 0, (bool) $primaryRec);

        return [
            'summary'             => $summary,
            'risk_reason'         => $canonicalRisk['reason'] ?? $riskReason,
            'trend'               => $trendLabel,
            'recommended_action'  => $recommendedAction,
            'intervention_note'   => $interventionNote,
            'confidence'          => $confidence,
        ];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function riskLevelToTier(string $level): string
    {
        return match ($level) {
            'red'    => 'critical',
            'yellow' => 'at_risk',
            default  => 'on_track',
        };
    }

    private function detectTrend(array $nets): string
    {
        $filtered = array_filter($nets, fn ($n) => $n !== null && $n > 0);
        $values   = array_values($filtered);
        if (count($values) < 2) return 'insufficient_data';

        $delta = end($values) - $values[count($values) - 2];
        if ($delta > 1)  return 'up';
        if ($delta < -1) return 'down';
        return 'stable';
    }

    /**
     * Classify into named scenario used for text templates.
     *
     * A: critical + not improving
     * B: critical + improving (hopeful)
     * C: at_risk + any
     * D: on_track + ahead / up
     * E: on_track + stable
     * F: insufficient data
     */
    private function classifyScenario(string $riskTier, string $trend): string
    {
        if ($trend === 'insufficient_data') return 'F';

        return match (true) {
            $riskTier === 'critical' && $trend !== 'up' => 'A',
            $riskTier === 'critical' && $trend === 'up' => 'B',
            $riskTier === 'at_risk'                    => 'C',
            $riskTier === 'on_track' && in_array($trend, ['up', 'stable']) => 'D',
            $riskTier === 'on_track'                   => 'E',
            default                                    => 'F',
        };
    }

    /**
     * Returns [summary, risk_reason, trend_label, recommended_action].
     */
    private function buildTexts(
        string $scenario,
        string $name,
        array  $weeklyNets,
        int    $daysSince,
    ): array {
        $latestNet = ! empty($weeklyNets) ? end($weeklyNets) : null;
        $netStr    = $latestNet !== null ? round((float) $latestNet, 1) : '?';

        return match ($scenario) {
            'A' => [
                "$name hedefine ulaşmak için ivme kazanması gerekiyor.",
                "Hedef temposu gerisinde ve haftalık net düşüşte.",
                "Netlerde düşüş var",
                "Düzenli çalışma takibi yapın ve öğrenciye destek olun.",
            ],
            'B' => [
                "$name zor bir süreçte ama gelişim gösteriyor.",
                "Hedef temposu gerisinde, ancak son haftalarda artış var.",
                "Netlerde yavaş artış var",
                "Olumlu gelişimi destekleyin ve motivasyonu canlı tutun.",
            ],
            'C' => [
                "$name ilerliyor ancak tempo korunmalı.",
                "Hedef için gereken haftalık artış henüz karşılanmıyor.",
                "Netlerde değişken seyir",
                "Bu hafta düzenli çalışmayı takip edin.",
            ],
            'D' => [
                "$name hedefinin önünde ilerliyor, çok iyi!",
                "Hedefe ulaşmak için gereken tempo karşılanıyor.",
                "Netlerde artış var",
                "Bu başarıyı kutlayın; süreklilik önemli.",
            ],
            'E' => [
                "$name yolunda, devam önemli.",
                "Hedef temposu sağlıklı seyrediyor.",
                "Netlerde stabil seyir",
                "Düzenli çalışmayı desteklemeye devam edin.",
            ],
            default => [ // F
                "Yeterli veri oluşmadı; çalışmalar başladıkça içgörüler güçlenecek.",
                null,
                null,
                "Öğrencinin düzenli çalışma alışkanlığı kazanmasını destekleyin.",
            ],
        };
    }

    private function recToParentAction(array $rec, string $name): string
    {
        return match ($rec['type'] ?? '') {
            'weak_topic'  => "Bu hafta {$rec['title']} konusuna odaklanmasını teşvik edin.",
            'practice'    => "$name'in düzenli soru çözmesini destekleyin.",
            'exam'        => "Kısa bir deneme çözmesini önerin.",
            default       => "Bu hafta düzenli çalışmayı takip edin.",
        };
    }

    private function computeConfidence(int $netCount, int $daysSince, bool $hasRec = false): string
    {
        $points = $netCount + ($hasRec ? 2 : 0) + ($daysSince < 999 ? 1 : 0);
        if ($points >= 6) return 'high';
        if ($points >= 3) return 'medium';
        return 'low';
    }
}
