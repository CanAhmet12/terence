<?php

namespace App\Services;

use App\Models\ExamSession;
use App\Models\Kazanim;
use App\Models\QuestionAnswer;
use App\Models\StudySession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * BI-5 — Personalized Recommendation Engine.
 * Uses existing data: question_answers, exam_sessions, study_sessions, users.
 * No new tables — fully derived from current data.
 */
class RecommendationService
{
    // P0 thresholds
    private const WEAK_ACCURACY_THRESHOLD  = 60;   // % correct — below = weak
    private const WEAK_MIN_ANSWERS         = 3;    // min answers to consider a kazanim
    private const PRACTICE_STALE_DAYS      = 3;    // days without practice → suggest
    private const EXAM_STALE_DAYS          = 7;    // days without exam → suggest
    private const MAX_RECOMMENDATIONS      = 3;

    public function forUser(User $user): array
    {
        // ── 1. Weak achievements ──────────────────────────────────────────
        $weakAchievements = $this->getWeakAchievements($user);

        // ── 2. Activity recency ───────────────────────────────────────────
        $lastQuestionAt = QuestionAnswer::where('user_id', $user->id)->max('created_at');
        $lastExamAt     = ExamSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->max('finished_at');

        $daysSinceQuestion = $lastQuestionAt
            ? (int) now()->diffInDays(Carbon::parse($lastQuestionAt))
            : 999;
        $daysSinceExam = $lastExamAt
            ? (int) now()->diffInDays(Carbon::parse($lastExamAt))
            : 999;

        // ── 3. Risk tier (pace-based) ─────────────────────────────────────
        $riskTier = $this->computeRiskTier($user);

        // ── 4. Build recommendations ──────────────────────────────────────
        $recommendations = [];

        // RULE 1: Weak topic
        if (! empty($weakAchievements)) {
            $top     = $weakAchievements[0];
            $baseP   = 'high';
            // P1: at_risk/critical raises priority further
            $priority = ($riskTier !== 'on_track') ? 'high' : $baseP;

            $recommendations[] = [
                'type'          => 'weak_topic',
                'title'         => $top['konu'],
                'subject'       => $top['subject'] ?? null,
                'kazanim_code'  => $top['kod'],
                'reason'        => '%' . $top['accuracy_rate'] . ' doğruluk — ' . $top['wrong_count'] . ' yanlış',
                'priority'      => $priority,
            ];
        }

        // RULE 2: Practice (question solving)
        if ($daysSinceQuestion >= self::PRACTICE_STALE_DAYS) {
            $priority = ($daysSinceQuestion >= 7 || $riskTier === 'critical') ? 'high' : 'medium';
            $reason   = $daysSinceQuestion >= 7
                ? $daysSinceQuestion . ' gündür soru çözülmedi'
                : 'Son ' . self::PRACTICE_STALE_DAYS . ' gün soru çözülmedi';

            $subject = ! empty($weakAchievements) ? ($weakAchievements[0]['subject'] ?? null) : null;

            $recommendations[] = [
                'type'          => 'practice',
                'title'         => $subject ? "$subject soruları çöz" : '20 soru çöz',
                'subject'       => $subject,
                'kazanim_code'  => null,
                'reason'        => $reason,
                'priority'      => $priority,
            ];
        }

        // RULE 3: Exam (mini-test)
        if ($daysSinceExam >= self::EXAM_STALE_DAYS) {
            $priority = ($riskTier === 'critical') ? 'high' : 'medium';
            $days     = $daysSinceExam >= 999 ? 'Hiç' : $daysSinceExam;

            $recommendations[] = [
                'type'          => 'exam',
                'title'         => 'Deneme çöz',
                'subject'       => null,
                'kazanim_code'  => null,
                'reason'        => $daysSinceExam >= 999
                    ? 'Henüz deneme çözülmemiş'
                    : $days . ' gündür deneme yapılmadı',
                'priority'      => $priority,
            ];
        }

        // ── 5. Sort by priority and cap ───────────────────────────────────
        $priorityRank = ['high' => 3, 'medium' => 2, 'low' => 1];
        usort($recommendations, fn ($a, $b) =>
            ($priorityRank[$b['priority']] ?? 0) - ($priorityRank[$a['priority']] ?? 0)
        );
        $recommendations = array_values(array_slice($recommendations, 0, self::MAX_RECOMMENDATIONS));

        // ── 6. Confidence ─────────────────────────────────────────────────
        $dataPoints = count($weakAchievements)
            + ($lastQuestionAt ? 2 : 0)
            + ($lastExamAt ? 1 : 0);
        $confidence = $dataPoints >= 5 ? 'high' : ($dataPoints >= 2 ? 'medium' : 'low');

        return [
            'primary_recommendation' => $recommendations[0] ?? null,
            'recommendations'        => $recommendations,
            'context'                => [
                'risk_tier'          => $riskTier,
                'days_since_question'=> $daysSinceQuestion < 999 ? $daysSinceQuestion : null,
                'days_since_exam'    => $daysSinceExam    < 999 ? $daysSinceExam    : null,
                'weak_topics_count'  => count($weakAchievements),
            ],
            'generated_at'           => now()->toIso8601String(),
            'confidence'             => $confidence,
        ];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Returns top weak achievements sorted by accuracy_rate ASC.
     * Mirrors QuestionController::weakAchievements() logic (read-only).
     */
    private function getWeakAchievements(User $user): array
    {
        try {
            $query = QuestionAnswer::where('question_answers.user_id', $user->id)
                ->join('questions', 'question_answers.question_id', '=', 'questions.id')
                ->whereNotNull('questions.kazanim_code');

            if ($user->isStudent()) {
                $scope            = $user->learningScope();
                $allowedExamTypes = $user->allowedExamTypes();
                $query->where('questions.grade', $scope['grade'])
                    ->where(function ($q) use ($allowedExamTypes) {
                        $q->whereIn('questions.exam_type', $allowedExamTypes)
                            ->orWhere('questions.exam_type', 'Genel');
                    });
            }

            $rows = $query->select(
                    'questions.kazanim_code',
                    'questions.subject',
                    DB::raw('COUNT(*) as total_count'),
                    DB::raw('SUM(CASE WHEN question_answers.is_correct = 1 THEN 1 ELSE 0 END) as correct_count'),
                    DB::raw('SUM(CASE WHEN question_answers.is_correct = 0 AND question_answers.selected_option IS NOT NULL THEN 1 ELSE 0 END) as wrong_count')
                )
                ->groupBy('questions.kazanim_code', 'questions.subject')
                ->having('total_count', '>=', self::WEAK_MIN_ANSWERS)
                ->having(DB::raw('ROUND((correct_count / total_count) * 100, 2)'), '<', self::WEAK_ACCURACY_THRESHOLD)
                ->orderByRaw('ROUND((correct_count / total_count) * 100, 2) ASC')
                ->limit(5)
                ->get();

            return $rows->map(function ($row) {
                $kazanim = Kazanim::where('kod', $row->kazanim_code)->first();
                return [
                    'kod'           => $row->kazanim_code,
                    'konu'          => $kazanim?->konu ?? $row->kazanim_code,
                    'subject'       => $row->subject ?? $kazanim?->subject,
                    'wrong_count'   => (int) $row->wrong_count,
                    'total_count'   => (int) $row->total_count,
                    'accuracy_rate' => $row->total_count > 0
                        ? round(($row->correct_count / $row->total_count) * 100, 1)
                        : 0,
                ];
            })->values()->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Compute student risk tier (on_track | at_risk | critical).
     * Mirrors GoalDashboardService::buildExamInsights() pace logic.
     */
    private function computeRiskTier(User $user): string
    {
        $currentNet = (float) ($user->current_net ?? 0);
        $targetNet  = $user->target_net !== null ? (float) $user->target_net : null;
        $examDate   = $user->exam_date ? (string) $user->exam_date : null;

        if ($targetNet === null || $examDate === null) {
            return 'at_risk'; // no target → moderate default
        }

        try {
            $examCarbon  = Carbon::parse($examDate)->startOfDay();
            if (! $examCarbon->isFuture()) return 'on_track';

            $daysRemaining   = max(0, (int) now()->startOfDay()->diffInDays($examCarbon, false));
            $weeksLeft       = max(1, (int) ceil($daysRemaining / 7));
            $weeklyNetNeeded = max(0.0, ($targetNet - $currentNet) / $weeksLeft);

            if ($weeklyNetNeeded > 5) return 'critical';
            if ($weeklyNetNeeded > 2) return 'at_risk';
            return 'on_track';
        } catch (\Throwable) {
            return 'at_risk';
        }
    }
}
