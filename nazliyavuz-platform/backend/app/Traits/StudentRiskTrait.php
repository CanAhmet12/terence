<?php

namespace App\Traits;

use Carbon\Carbon;

/**
 * BI-3 — Canonical student risk level computation.
 * Combines goal-pace signal with inactivity signal.
 * Returns green | yellow | red (backward-compatible with existing teacher/parent fields).
 */
trait StudentRiskTrait
{
    /**
     * Compute student risk level using pace-based + inactivity signals.
     *
     * @param  float       $net         Current net score (users.current_net)
     * @param  float       $daysSince   Days since last study session (0–999)
     * @param  float|null  $targetNet   Target net (users.target_net)
     * @param  string|null $examDate    Exam date string (users.exam_date)
     * @return string 'green' | 'yellow' | 'red'
     */
    protected function computeStudentRiskLevel(
        float $net,
        float $daysSince,
        ?float $targetNet = null,
        ?string $examDate = null,
    ): string {
        // ── Pace-based signal ─────────────────────────────────────────────
        $paceTier = 'on_track';

        if ($targetNet !== null && $examDate !== null) {
            try {
                $examCarbon = Carbon::parse($examDate)->startOfDay();
                if ($examCarbon->isFuture()) {
                    $weeksLeft    = max(1, (int) ceil(now()->diffInDays($examCarbon, false) / 7));
                    $weeklyNeeded = max(0.0, ($targetNet - $net) / $weeksLeft);
                    if ($weeklyNeeded > 5)      $paceTier = 'critical';
                    elseif ($weeklyNeeded > 2)  $paceTier = 'at_risk';
                    // else: on_track
                }
            } catch (\Throwable) {
                // Unparseable exam_date — fall through to absolute-net fallback
            }
        }

        // Fallback: no target or invalid date — use absolute net
        if ($paceTier === 'on_track' && $targetNet === null) {
            if ($net < 20)       $paceTier = 'critical';
            elseif ($net < 40)   $paceTier = 'at_risk';
        }

        // ── Inactivity signal — can raise risk, never lower it ────────────
        $inactivityTier = 'on_track';
        if ($daysSince > 7)       $inactivityTier = 'critical';
        elseif ($daysSince > 3)   $inactivityTier = 'at_risk';

        // ── Take the worst tier ───────────────────────────────────────────
        $rank  = ['on_track' => 0, 'at_risk' => 1, 'critical' => 2];
        $worst = ($rank[$paceTier] >= $rank[$inactivityTier]) ? $paceTier : $inactivityTier;

        return match ($worst) {
            'critical' => 'red',
            'at_risk'  => 'yellow',
            default    => 'green',
        };
    }
}
