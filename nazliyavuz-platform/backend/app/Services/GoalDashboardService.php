<?php

namespace App\Services;

use App\Models\DailyPlan;
use App\Models\ExamSession;
use App\Models\PlanTask;
use App\Models\StudySession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tek kaynaklı öğrenci hedef / ilerleme özeti (öğrenci ve öğretmen aynı DTO).
 */
class GoalDashboardService
{
    public function forUser(User $user): array
    {
        $template = $this->resolveTemplate($user);
        $snapshot = $this->userSnapshot($user);
        $completeness = $this->dataCompleteness($user, $template);

        $examMetrics = null;
        $schoolMetrics = null;

        if ($template === 'school_primary') {
            $schoolMetrics = $this->buildSchoolMetrics($user);
            $insights = $this->buildSchoolInsights($user, $schoolMetrics);
        } else {
            $examMetrics = $this->buildExamMetrics($user);
            $insights = $this->buildExamInsights($user, $examMetrics);
        }

        return [
            'success' => true,
            'template' => $template,
            'user_snapshot' => $snapshot,
            'exam_metrics' => $examMetrics,
            'school_metrics' => $schoolMetrics,
            'insights' => $insights,
            'data_completeness' => $completeness,
        ];
    }

    public function resolveTemplate(User $user): string
    {
        $exam = $user->target_exam ?? $user->exam_goal;
        if ($exam === 'LGS') {
            return 'exam_lgs';
        }
        $grade = (int) ($user->grade ?? 0);
        if ($grade >= 1 && $grade <= 6) {
            return 'school_primary';
        }
        if (in_array($exam, ['TYT', 'AYT', 'TYT-AYT', 'KPSS'], true)) {
            return 'exam_yks';
        }
        if ($grade >= 7 && $grade <= 8) {
            return 'exam_lgs';
        }

        return 'exam_yks';
    }

    /**
     * @return array<string, mixed>
     */
    private function userSnapshot(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'grade' => $user->grade,
            'target_exam' => $user->target_exam ?? $user->exam_goal,
            'exam_goal' => $user->exam_goal ?? $user->target_exam,
            'target_school' => $user->target_school,
            'target_department' => $user->target_department,
            'target_net' => $user->target_net !== null ? (float) $user->target_net : null,
            'current_net' => (float) ($user->current_net ?? 0),
            'exam_date' => $this->readExamDate($user),
            'streak_days' => (int) ($user->streak_days ?? 0),
            'xp_points' => (int) ($user->xp_points ?? 0),
        ];
    }

    private function readExamDate(User $user): ?string
    {
        if (!Schema::hasColumn('users', 'exam_date')) {
            return null;
        }
        $v = $user->exam_date;
        if ($v === null || $v === '') {
            return null;
        }
        if ($v instanceof Carbon) {
            return $v->format('Y-m-d');
        }

        return (string) $v;
    }

    /**
     * @return array{missing: list<string>, flags: array<string, bool>}
     */
    private function dataCompleteness(User $user, string $template): array
    {
        $missing = [];
        $flags = [];

        if ($template !== 'school_primary') {
            if ($user->target_net === null) {
                $missing[] = 'target_net';
            }
            if (!$this->readExamDate($user)) {
                $missing[] = 'exam_date';
                $flags['needs_exam_date'] = true;
            }
        }

        return ['missing' => $missing, 'flags' => $flags];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buildExamMetrics(User $user): ?array
    {
        $lastCompleted = ExamSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('finished_at')
            ->orderByDesc('finished_at')
            ->first(['id', 'net_score', 'finished_at', 'title']);

        $inProgressCount = ExamSession::where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->count();

        $completedCount = ExamSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();

        return [
            'last_completed_exam_net' => $lastCompleted ? (float) $lastCompleted->net_score : null,
            'last_completed_exam_at' => $lastCompleted?->finished_at?->toIso8601String(),
            'last_completed_exam_title' => $lastCompleted?->title,
            'completed_exams_count' => $completedCount,
            'in_progress_exams_count' => $inProgressCount,
            'user_current_net_db' => (float) ($user->current_net ?? 0),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buildSchoolMetrics(User $user): ?array
    {
        $today = Carbon::today()->toDateString();
        $todayPlan = DailyPlan::where('user_id', $user->id)->where('plan_date', $today)->first();

        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();

        $tasksDoneWeek = PlanTask::where('user_id', $user->id)
            ->where('is_completed', true)
            ->whereBetween('completed_at', [$weekStart, $weekEnd])
            ->count();

        $tasksTotalWeekRaw = PlanTask::where('user_id', $user->id)
            ->whereBetween('created_at', [$weekStart, $weekEnd])
            ->count();

        $weeklyStudy = (int) StudySession::where('user_id', $user->id)
            ->where('started_at', '>=', $weekStart->toDateString())
            ->sum('duration_seconds');

        $curriculumCompleted = 0;
        $curriculumInProgress = 0;
        if (Schema::hasTable('curriculum_topic_progress')) {
            $curriculumCompleted = (int) DB::table('curriculum_topic_progress')
                ->where('user_id', $user->id)
                ->where('status', 'completed')
                ->count();
            $curriculumInProgress = (int) DB::table('curriculum_topic_progress')
                ->where('user_id', $user->id)
                ->where('status', 'in_progress')
                ->count();
        }

        return [
            'tasks_done_today' => (int) ($todayPlan?->completed_tasks ?? 0),
            'tasks_total_today' => (int) ($todayPlan?->total_tasks ?? 0),
            'tasks_done_week' => $tasksDoneWeek,
            'tasks_total_week' => $tasksTotalWeekRaw,
            'study_time_weekly_seconds' => $weeklyStudy,
            'curriculum_topics_completed' => $curriculumCompleted,
            'curriculum_topics_in_progress' => $curriculumInProgress,
        ];
    }

    /**
     * @param  array<string, mixed>  $examMetrics
     * @return array<string, mixed>
     */
    private function buildExamInsights(User $user, array $examMetrics): array
    {
        $examDateStr = $this->readExamDate($user);
        $examDateCarbon = $examDateStr ? Carbon::parse($examDateStr)->startOfDay() : null;

        $daysRemaining = null;
        if ($examDateCarbon) {
            $daysRemaining = max(0, (int) Carbon::now()->startOfDay()->diffInDays($examDateCarbon, false));
        }

        $weeksLeft = $daysRemaining !== null ? max(1, (int) ceil($daysRemaining / 7)) : null;

        $currentNet = (float) ($user->current_net ?? 0);
        $targetNet = $user->target_net !== null ? (float) $user->target_net : null;

        $netNeeded = ($targetNet !== null) ? max(0, round($targetNet - $currentNet, 2)) : null;
        $weeklyNetNeeded = ($netNeeded !== null && $weeksLeft !== null && $weeksLeft > 0)
            ? round($netNeeded / $weeksLeft, 2)
            : null;

        $legacyRisk = 'low';
        if ($targetNet !== null && $examDateCarbon !== null && $weeklyNetNeeded !== null) {
            if ($weeklyNetNeeded > 5) {
                $legacyRisk = 'high';
            } elseif ($weeklyNetNeeded > 2) {
                $legacyRisk = 'medium';
            }
        }

        $riskTier = match ($legacyRisk) {
            'high' => 'critical',
            'medium' => 'at_risk',
            default => 'on_track',
        };

        if ($targetNet === null || $examDateCarbon === null) {
            $weeklyNetNeeded = null;
            $legacyRisk = 'medium';
            $riskTier = 'at_risk';
        }

        $weekStart = Carbon::now()->startOfWeek();
        $weeklyMinutes = (int) StudySession::where('user_id', $user->id)
            ->where('started_at', '>=', $weekStart)
            ->whereNotNull('duration_seconds')
            ->sum(DB::raw('duration_seconds / 60'));

        return [
            'days_remaining' => $daysRemaining,
            'weeks_remaining' => $weeksLeft,
            'weekly_net_needed' => $weeklyNetNeeded,
            'net_gap' => $netNeeded,
            'risk_tier' => $riskTier,
            'risk_engine' => $legacyRisk,
            'weekly_study_minutes' => $weeklyMinutes,
            'streak_days' => (int) ($user->streak_days ?? 0),
            'upgrade_suggestion' => $legacyRisk === 'high' && ($user->subscription_plan ?? 'free') === 'free',
            'display_current_net' => $currentNet,
            'display_target_net' => $targetNet,
        ];
    }

    /**
     * @param  array<string, mixed>  $schoolMetrics
     * @return array<string, mixed>
     */
    private function buildSchoolInsights(User $user, array $schoolMetrics): array
    {
        $doneToday = (int) ($schoolMetrics['tasks_done_today'] ?? 0);
        $totalToday = (int) ($schoolMetrics['tasks_total_today'] ?? 0);
        $ratioToday = $totalToday > 0 ? $doneToday / $totalToday : null;

        $doneWeek = (int) ($schoolMetrics['tasks_done_week'] ?? 0);
        $totalWeekRaw = (int) ($schoolMetrics['tasks_total_week'] ?? 0);
        $ratioWeek = $totalWeekRaw > 0 ? min(1.0, $doneWeek / max(1, $totalWeekRaw)) : null;

        $studySec = (int) ($schoolMetrics['study_time_weekly_seconds'] ?? 0);

        $riskTier = 'on_track';
        if ($ratioToday !== null && $ratioToday < 0.25 && $totalToday > 0) {
            $riskTier = 'at_risk';
        }
        if ($ratioWeek !== null) {
            if ($ratioWeek < 0.15) {
                $riskTier = 'critical';
            } elseif ($ratioWeek < 0.35 && $riskTier !== 'critical') {
                $riskTier = 'at_risk';
            }
        }
        if ($studySec < 1800 && $riskTier === 'on_track' && ($totalToday > 0 || $totalWeekRaw > 0)) {
            $riskTier = 'at_risk';
        }

        return [
            'days_remaining' => null,
            'weeks_remaining' => null,
            'weekly_net_needed' => null,
            'net_gap' => null,
            'risk_tier' => $riskTier,
            'risk_engine' => 'school',
            'weekly_study_minutes' => (int) round($studySec / 60),
            'streak_days' => (int) ($user->streak_days ?? 0),
            'upgrade_suggestion' => false,
            'task_completion_ratio_today' => $ratioToday,
            'task_completion_ratio_week' => $ratioWeek !== null ? round($ratioWeek, 3) : null,
            'display_current_net' => null,
            'display_target_net' => null,
        ];
    }
}
