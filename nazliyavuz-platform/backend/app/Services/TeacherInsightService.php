<?php

namespace App\Services;

use App\Models\Kazanim;
use App\Models\PlanTask;
use App\Models\StudySession;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * BI-8 — Teacher Analytics Deep Intelligence.
 * Derives teaching insights from exam_answers, plan_tasks and study_sessions.
 * No new tables — fully derived from existing data.
 */
class TeacherInsightService
{
    private const LOOK_BACK_DAYS  = 30;
    private const MIN_TOTAL_ANSWERS = 5;    // minimum answers per kazanim to surface it
    private const HIGH_ERROR_RATE = 60;     // % wrong → high priority
    private const MED_ERROR_RATE  = 40;     // % wrong → medium priority

    /**
     * Full teaching-insight DTO for the analytics endpoint.
     *
     * @param  int        $teacherId
     * @param  Collection $studentIds
     * @param  int        $totalStudents  total students in teacher's classes
     */
    public function buildInsight(int $teacherId, Collection $studentIds, int $totalStudents): array
    {
        if ($studentIds->isEmpty()) {
            return $this->emptyInsight();
        }

        $ids = $studentIds->values()->all();

        // ── P0: Reteach topics ────────────────────────────────────────────
        $reteachTopics = $this->computeReteachTopics($ids, $totalStudents);

        // ── P0: Headline ──────────────────────────────────────────────────
        $headline       = null;
        $headlineReason = null;
        if (! empty($reteachTopics)) {
            $top          = $reteachTopics[0];
            $headline     = "{$top['topic']} bu hafta yeniden anlatılmalı.";
            $headlineReason = "Öğrencilerin %{$top['error_rate']}'i bu konuda hata yapıyor.";
        }

        // ── P1: Achievement clusters (kazanim granularity) ────────────────
        $achievementClusters = $this->computeAchievementClusters($ids);

        // ── P1: Class bottleneck (worst subject) ──────────────────────────
        $classBottleneck = $this->computeClassBottleneck($ids);

        // ── P1: Intervention effect (BI-4 data) ───────────────────────────
        $interventionEffect = $this->computeInterventionEffect($teacherId, $ids);

        // ── P1: Confidence ────────────────────────────────────────────────
        $totalAnswers = collect($reteachTopics)->sum('total_answers');
        $confidence   = $totalAnswers >= 200 ? 'high'
            : ($totalAnswers >= 50 ? 'medium' : 'low');

        return [
            'teaching_insight' => [
                'headline'        => $headline,
                'headline_reason' => $headlineReason,
                'priority'        => ! empty($reteachTopics) ? $reteachTopics[0]['priority'] : null,
            ],
            'reteach_topics'      => $reteachTopics,
            'achievement_clusters'=> $achievementClusters,
            'class_bottleneck'    => $classBottleneck,
            'intervention_effect' => $interventionEffect,
            'confidence'          => $confidence,
            'look_back_days'      => self::LOOK_BACK_DAYS,
            'total_students'      => $totalStudents,
        ];
    }

    // ── Private: reteach topics ──────────────────────────────────────────────

    private function computeReteachTopics(array $studentIds, int $totalStudents): array
    {
        try {
            $since = now()->subDays(self::LOOK_BACK_DAYS);
            $rows  = DB::table('exam_answers as ea')
                ->join('questions as q', 'ea.question_id', '=', 'q.id')
                ->whereIn('ea.user_id', $studentIds)
                ->whereNotNull('q.kazanim_code')
                ->where('ea.created_at', '>=', $since)
                ->selectRaw(
                    'q.kazanim_code, q.subject, COUNT(*) as total,
                     SUM(CASE WHEN ea.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count,
                     COUNT(DISTINCT ea.user_id) as affected_students'
                )
                ->groupBy('q.kazanim_code', 'q.subject')
                ->having('total', '>=', self::MIN_TOTAL_ANSWERS)
                ->orderByRaw('(wrong_count / total) DESC')
                ->limit(3)
                ->get();

            return $rows->map(function ($r) {
                $kazanim   = Kazanim::where('kod', $r->kazanim_code)->first();
                $errorRate = $r->total > 0 ? (int) round($r->wrong_count / $r->total * 100) : 0;
                $priority  = $errorRate >= self::HIGH_ERROR_RATE ? 'high'
                    : ($errorRate >= self::MED_ERROR_RATE ? 'medium' : 'low');

                return [
                    'kazanim_code'      => $r->kazanim_code,
                    'topic'             => $kazanim?->konu ?? $r->kazanim_code,
                    'subject'           => $r->subject ?? $kazanim?->subject,
                    'error_rate'        => $errorRate,
                    'total_answers'     => (int) $r->total,
                    'affected_students' => (int) $r->affected_students,
                    'priority'          => $priority,
                ];
            })->values()->all();
        } catch (\Throwable) {
            return [];
        }
    }

    // ── Private: achievement clusters (subject level) ────────────────────────

    private function computeAchievementClusters(array $studentIds): array
    {
        try {
            $since = now()->subDays(self::LOOK_BACK_DAYS);
            $rows  = DB::table('exam_answers as ea')
                ->join('questions as q', 'ea.question_id', '=', 'q.id')
                ->whereIn('ea.user_id', $studentIds)
                ->whereNotNull('q.subject')
                ->where('ea.created_at', '>=', $since)
                ->selectRaw(
                    'q.subject, COUNT(*) as total,
                     SUM(CASE WHEN ea.is_correct = 0 THEN 1 ELSE 0 END) as wrong,
                     COUNT(DISTINCT ea.user_id) as affected_students'
                )
                ->groupBy('q.subject')
                ->having('total', '>=', self::MIN_TOTAL_ANSWERS)
                ->orderByRaw('(wrong / total) DESC')
                ->limit(5)
                ->get();

            return $rows->map(function ($r) {
                $errorRate = $r->total > 0 ? (int) round($r->wrong / $r->total * 100) : 0;
                return [
                    'subject'           => $r->subject,
                    'error_rate'        => $errorRate,
                    'affected_students' => (int) $r->affected_students,
                    'severity'          => $errorRate >= self::HIGH_ERROR_RATE ? 'high'
                        : ($errorRate >= self::MED_ERROR_RATE ? 'medium' : 'low'),
                ];
            })->values()->all();
        } catch (\Throwable) {
            return [];
        }
    }

    // ── Private: class bottleneck ────────────────────────────────────────────

    private function computeClassBottleneck(array $studentIds): ?array
    {
        try {
            $since = now()->subDays(self::LOOK_BACK_DAYS);
            $worst = DB::table('exam_answers as ea')
                ->join('questions as q', 'ea.question_id', '=', 'q.id')
                ->whereIn('ea.user_id', $studentIds)
                ->whereNotNull('q.subject')
                ->where('ea.created_at', '>=', $since)
                ->selectRaw(
                    'q.subject, COUNT(*) as total,
                     SUM(CASE WHEN ea.is_correct = 0 THEN 1 ELSE 0 END) as wrong'
                )
                ->groupBy('q.subject')
                ->having('total', '>', 0)
                ->orderByRaw('(wrong / total) DESC')
                ->first();

            if (! $worst) return null;

            $errorRate = $worst->total > 0
                ? (int) round($worst->wrong / $worst->total * 100) : 0;

            return [
                'subject'    => $worst->subject,
                'error_rate' => $errorRate,
                'reason'     => "$errorRate% hata oranıyla sınıfın en zorlandığı alan",
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    // ── Private: intervention effect ──────────────────────────────────────────

    private function computeInterventionEffect(int $teacherId, array $studentIds): ?array
    {
        try {
            $since = now()->subDays(7);

            // Students who received a plan task from this teacher in last 7 days
            $followedUp = PlanTask::whereIn('user_id', $studentIds)
                ->where('assigned_by_user_id', $teacherId)
                ->where('source', 'teacher')
                ->where('created_at', '>=', $since)
                ->selectRaw('user_id, MAX(created_at) as last_task_at')
                ->groupBy('user_id')
                ->pluck('last_task_at', 'user_id');

            $followedCount = $followedUp->count();
            if ($followedCount === 0) return null;

            // Check if they studied after the task (batch)
            $improvedCount = 0;
            foreach ($followedUp as $sid => $taskAt) {
                $studied = StudySession::where('user_id', $sid)
                    ->where('started_at', '>', Carbon::parse($taskAt))
                    ->exists();
                if ($studied) $improvedCount++;
            }

            $confidence = $followedCount >= 5 ? 'medium' : 'low';

            return [
                'students_followed_up' => $followedCount,
                'students_responded'   => $improvedCount,
                'response_rate'        => $followedCount > 0
                    ? (int) round($improvedCount / $followedCount * 100)
                    : 0,
                'confidence'           => $confidence,
                'note'                 => 'Müdahale sonrası çalışma başlayan öğrenci sayısı',
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    private function emptyInsight(): array
    {
        return [
            'teaching_insight'     => ['headline' => null, 'headline_reason' => null, 'priority' => null],
            'reteach_topics'       => [],
            'achievement_clusters' => [],
            'class_bottleneck'     => null,
            'intervention_effect'  => null,
            'confidence'           => 'low',
            'look_back_days'       => self::LOOK_BACK_DAYS,
            'total_students'       => 0,
        ];
    }
}
