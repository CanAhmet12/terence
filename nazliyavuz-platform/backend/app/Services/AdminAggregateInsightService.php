<?php

namespace App\Services;

use App\Models\ClassRoom;
use App\Models\ClassStudent;
use App\Models\ContentItem;
use App\Models\PlanTask;
use App\Models\StudySession;
use App\Models\User;
use App\Traits\StudentRiskTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * BI-9 — Admin Aggregate Intelligence.
 * Platform-wide analytics derived from existing tables.
 * No new tables — read-only aggregation.
 */
class AdminAggregateInsightService
{
    use StudentRiskTrait;

    /**
     * Full admin intelligence DTO.
     *
     * @param  int  $totalStudents  already counted in AdminController::stats()
     * @param  int  $newThisWeek   already counted in AdminController::stats()
     * @param  int  $activeToday   already counted in AdminController::stats()
     */
    public function buildInsight(
        int $totalStudents,
        int $newThisWeek,
        int $activeToday,
    ): array {
        // ── P0: Risk distribution ─────────────────────────────────────────
        $riskDistribution = $this->computeRiskDistribution();

        // ── P0: Platform headline ─────────────────────────────────────────
        $platformInsight = $this->buildPlatformInsight(
            $riskDistribution,
            $totalStudents,
            $activeToday,
        );

        // ── P0: Class health ──────────────────────────────────────────────
        $classHealth = $this->computeClassHealth($riskDistribution['_by_student'] ?? []);

        // ── P1: Teacher intervention aggregate ────────────────────────────
        $teacherIntervention = $this->computeTeacherIntervention();

        // ── P1: Platform bottleneck (worst subject) ───────────────────────
        $platformBottleneck = $this->computePlatformBottleneck();

        // ── P1: Content health ────────────────────────────────────────────
        $contentHealth = $this->computeContentHealth();

        // ── P1: Growth health ─────────────────────────────────────────────
        $growthHealth = $this->computeGrowthHealth($newThisWeek);

        // ── P1: Confidence ────────────────────────────────────────────────
        $confidence = $totalStudents >= 100 ? 'high'
            : ($totalStudents >= 20 ? 'medium' : 'low');

        // Strip internal-only key from risk_distribution
        unset($riskDistribution['_by_student']);

        return [
            'platform_insight'     => $platformInsight,
            'risk_distribution'    => $riskDistribution,
            'class_health'         => $classHealth,
            'teacher_intervention' => $teacherIntervention,
            'platform_bottleneck'  => $platformBottleneck,
            'content_health'       => $contentHealth,
            'growth_health'        => $growthHealth,
            'confidence'           => $confidence,
        ];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function computeRiskDistribution(): array
    {
        try {
            $students = User::where('role', 'student')
                ->get(['id', 'current_net', 'target_net', 'exam_date']);

            if ($students->isEmpty()) {
                return ['green' => 0, 'yellow' => 0, 'red' => 0, 'risk_ratio' => 0.0, '_by_student' => []];
            }

            $ids       = $students->pluck('id')->all();
            $lastStudy = StudySession::whereIn('user_id', $ids)
                ->selectRaw('user_id, MAX(started_at) as last_at')
                ->groupBy('user_id')
                ->pluck('last_at', 'user_id');

            $counts     = ['green' => 0, 'yellow' => 0, 'red' => 0];
            $byStudent  = [];

            foreach ($students as $s) {
                $daysSince = isset($lastStudy[$s->id])
                    ? (int) now()->diffInDays(Carbon::parse($lastStudy[$s->id]))
                    : 999;
                $risk = $this->computeStudentRiskLevel(
                    (float) ($s->current_net ?? 0),
                    $daysSince,
                    $s->target_net !== null ? (float) $s->target_net : null,
                    $s->exam_date ? (string) $s->exam_date : null,
                );
                $counts[$risk]++;
                $byStudent[$s->id] = $risk;
            }

            $total = $students->count();
            $atRisk = $counts['yellow'] + $counts['red'];

            return array_merge($counts, [
                'risk_ratio'  => $total > 0 ? round($atRisk / $total, 3) : 0.0,
                '_by_student' => $byStudent, // stripped before returning externally
            ]);
        } catch (\Throwable) {
            return ['green' => 0, 'yellow' => 0, 'red' => 0, 'risk_ratio' => 0.0, '_by_student' => []];
        }
    }

    private function buildPlatformInsight(
        array $riskDist,
        int   $totalStudents,
        int   $activeToday,
    ): array {
        $riskRatio   = $riskDist['risk_ratio'] ?? 0;
        $riskPercent = (int) round($riskRatio * 100);
        $activityRate = $totalStudents > 0 ? round($activeToday / $totalStudents * 100, 1) : 0;

        [$headline, $priority, $reason] = match (true) {
            $riskPercent >= 40 => [
                "Platform genelinde riskli öğrenci oranı yüksek.",
                'high',
                "Riskli öğrenci oranı %$riskPercent seviyesinde.",
            ],
            $riskPercent >= 20 => [
                "Platform orta düzey dikkat gerektiriyor.",
                'medium',
                "Riskli öğrenci oranı %$riskPercent seviyesinde.",
            ],
            $activityRate < 10 => [
                "Platform aktivitesi düşük.",
                'medium',
                "Bugün öğrencilerin yalnızca %$activityRate'i aktif.",
            ],
            default => [
                "Platform genelinde sağlık iyi seviyede.",
                'low',
                "Riskli öğrenci oranı %$riskPercent, aktivite iyi.",
            ],
        };

        return compact('headline', 'priority', 'reason');
    }

    private function computeClassHealth(array $riskByStudent): array
    {
        try {
            $classRooms = ClassRoom::withCount('students')->get(['id', 'name', 'grade', 'exam_type']);
            if ($classRooms->isEmpty()) return [];

            // All class→student relations in one query
            $allPairs = ClassStudent::whereIn('class_room_id', $classRooms->pluck('id'))
                ->select('class_room_id', 'student_id')
                ->get()
                ->groupBy('class_room_id');

            $classData = [];
            foreach ($classRooms as $c) {
                $students = $allPairs->get($c->id, collect());
                $count    = $students->count();
                if ($count === 0) continue;

                $atRisk = 0;
                foreach ($students as $pivot) {
                    $risk = $riskByStudent[$pivot->student_id] ?? 'green';
                    if (in_array($risk, ['yellow', 'red'], true)) $atRisk++;
                }

                $ratio   = round($atRisk / $count, 3);
                $health  = $ratio >= 0.4 ? 'critical' : ($ratio >= 0.2 ? 'attention' : 'healthy');

                $classData[] = [
                    'class'      => $c->name,
                    'grade'      => $c->grade,
                    'exam_type'  => $c->exam_type,
                    'students'   => $count,
                    'risk_ratio' => $ratio,
                    'health'     => $health,
                ];
            }

            usort($classData, fn ($a, $b) => $b['risk_ratio'] <=> $a['risk_ratio']);
            return array_slice($classData, 0, 5);
        } catch (\Throwable) {
            return [];
        }
    }

    private function computeTeacherIntervention(): ?array
    {
        try {
            $since = now()->subDays(7);

            $teachersActive = PlanTask::where('source', 'teacher')
                ->where('created_at', '>=', $since)
                ->distinct('assigned_by_user_id')
                ->count('assigned_by_user_id');

            $studentsFollowedUp = PlanTask::where('source', 'teacher')
                ->where('created_at', '>=', $since)
                ->distinct('user_id')
                ->count('user_id');

            if ($studentsFollowedUp === 0) return null;

            // Batch: students who studied after intervention
            $interventions = PlanTask::where('source', 'teacher')
                ->where('created_at', '>=', $since)
                ->selectRaw('user_id, MAX(created_at) as task_at')
                ->groupBy('user_id')
                ->get();

            $responded = 0;
            $batchStudied = StudySession::whereIn('user_id', $interventions->pluck('user_id'))
                ->where('started_at', '>=', $since)
                ->selectRaw('user_id, MAX(started_at) as last_study')
                ->groupBy('user_id')
                ->pluck('last_study', 'user_id');

            foreach ($interventions as $iv) {
                $study = $batchStudied[$iv->user_id] ?? null;
                if ($study && Carbon::parse($study)->gt(Carbon::parse($iv->task_at))) {
                    $responded++;
                }
            }

            return [
                'teachers_active'     => $teachersActive,
                'students_followed_up'=> $studentsFollowedUp,
                'students_responded'  => $responded,
                'response_rate'       => $studentsFollowedUp > 0
                    ? (int) round($responded / $studentsFollowedUp * 100)
                    : 0,
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    private function computePlatformBottleneck(): ?array
    {
        try {
            $worst = DB::table('exam_answers as ea')
                ->join('questions as q', 'ea.question_id', '=', 'q.id')
                ->whereNotNull('q.subject')
                ->where('ea.created_at', '>=', now()->subDays(30))
                ->selectRaw('q.subject, COUNT(*) as total, SUM(CASE WHEN ea.is_correct = 0 THEN 1 ELSE 0 END) as wrong')
                ->groupBy('q.subject')
                ->having('total', '>=', 20)
                ->orderByRaw('(wrong / total) DESC')
                ->first();

            if (! $worst) return null;

            $errorRate = $worst->total > 0
                ? (int) round($worst->wrong / $worst->total * 100) : 0;

            return [
                'subject'    => $worst->subject,
                'error_rate' => $errorRate,
                'reason'     => "Platform genelinde en yüksek hata oranı: %$errorRate",
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    private function computeContentHealth(): ?array
    {
        try {
            $total  = ContentItem::where('is_active', true)->count();
            $orphan = ContentItem::where('is_active', true)->whereDoesntHave('topic')->count();

            $topSubjectRow = DB::table('content_items as ci')
                ->join('topics as t', 'ci.topic_id', '=', 't.id')
                ->join('units as u', 't.unit_id', '=', 'u.id')
                ->join('courses as co', 'u.course_id', '=', 'co.id')
                ->where('ci.is_active', true)
                ->selectRaw('co.subject, COUNT(*) as cnt')
                ->groupBy('co.subject')
                ->orderByDesc('cnt')
                ->first();

            return [
                'active_content' => $total,
                'orphan_content' => $orphan,
                'orphan_ratio'   => $total > 0 ? round($orphan / $total, 3) : 0.0,
                'top_subject'    => $topSubjectRow?->subject,
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    private function computeGrowthHealth(int $newThisWeek): array
    {
        try {
            $lastWeekStart = now()->subWeeks(2)->startOfWeek();
            $lastWeekEnd   = now()->subWeek()->startOfWeek();
            $newLastWeek   = User::whereBetween('created_at', [$lastWeekStart, $lastWeekEnd])->count();

            $trend = 'stable';
            if ($newLastWeek > 0) {
                $change = $newThisWeek - $newLastWeek;
                if ($change > 2)  $trend = 'growing';
                if ($change < -2) $trend = 'declining';
            } elseif ($newThisWeek > 0) {
                $trend = 'growing';
            }

            return [
                'new_users_this_week' => $newThisWeek,
                'new_users_last_week' => $newLastWeek,
                'trend'               => $trend,
                'trend_label'         => match ($trend) {
                    'growing'  => 'Büyüme artıyor',
                    'declining'=> 'Büyüme yavaşlıyor',
                    default    => 'Stabil büyüme',
                },
            ];
        } catch (\Throwable) {
            return ['new_users_this_week' => $newThisWeek, 'trend' => 'stable'];
        }
    }
}
