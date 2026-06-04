<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\Notification;
use App\Models\PlanTask;
use App\Models\StudySession;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * BI-4 — Teacher Intervention Intelligence.
 * Computes last-intervention and follow-up signals from existing tables.
 * No new tables — reads plan_tasks, assignments, notifications.
 */
class TeacherInterventionService
{
    /**
     * Batch-compute intervention DTOs for a set of students.
     *
     * @param  int        $teacherId      Authenticated teacher
     * @param  array|Collection $studentIds  Student user IDs
     * @param  array      $riskByStudent  ['student_id' => 'green'|'yellow'|'red']
     * @return array      ['student_id' => dto_array | null]
     */
    public function forStudents(
        int $teacherId,
        array|Collection $studentIds,
        array $riskByStudent = [],
    ): array {
        $ids = collect($studentIds)->values()->all();

        if (empty($ids)) {
            return [];
        }

        // ── Batch queries (4 aggregates — no N+1) ──────────────────────────

        // Last teacher-assigned plan task per student
        $lastPlan = PlanTask::whereIn('user_id', $ids)
            ->where('assigned_by_user_id', $teacherId)
            ->where('source', 'teacher')
            ->selectRaw('user_id, MAX(created_at) as last_at')
            ->groupBy('user_id')
            ->pluck('last_at', 'user_id');

        // Last assignment from this teacher per student
        $lastAssignment = Assignment::whereIn('student_id', $ids)
            ->where('teacher_id', $teacherId)
            ->selectRaw('student_id, MAX(created_at) as last_at')
            ->groupBy('student_id')
            ->pluck('last_at', 'student_id');

        // Last teacher_message notification per student (low confidence — no sender_id)
        $lastMessage = Notification::whereIn('user_id', $ids)
            ->where('type', 'teacher_message')
            ->selectRaw('user_id, MAX(created_at) as last_at')
            ->groupBy('user_id')
            ->pluck('last_at', 'user_id');

        // Last study session per student (for post-intervention activity check)
        $lastStudy = StudySession::whereIn('user_id', $ids)
            ->selectRaw('user_id, MAX(started_at) as last_study')
            ->groupBy('user_id')
            ->pluck('last_study', 'user_id');

        // ── Build per-student DTOs ────────────────────────────────────────
        $result = [];
        foreach ($ids as $sid) {
            $result[$sid] = $this->buildDto(
                studentId:    $sid,
                riskLevel:    $riskByStudent[$sid] ?? 'green',
                lastPlanAt:   $lastPlan[$sid]       ?? null,
                lastAssignAt: $lastAssignment[$sid]  ?? null,
                lastMsgAt:    $lastMessage[$sid]     ?? null,
                lastStudyAt:  $lastStudy[$sid]       ?? null,
            );
        }
        return $result;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function buildDto(
        int $studentId,
        string $riskLevel,
        ?string $lastPlanAt,
        ?string $lastAssignAt,
        ?string $lastMsgAt,
        ?string $lastStudyAt,
    ): ?array {
        // Collect candidates from all channels
        $candidates = [];

        if ($lastPlanAt) {
            $candidates[] = ['at' => $lastPlanAt, 'type' => 'plan_task', 'confidence' => 'high'];
        }
        if ($lastAssignAt) {
            $candidates[] = ['at' => $lastAssignAt, 'type' => 'assignment', 'confidence' => 'high'];
        }
        if ($lastMsgAt) {
            $candidates[] = ['at' => $lastMsgAt, 'type' => 'message', 'confidence' => 'low'];
        }

        // Sort by date desc; pick latest
        usort($candidates, fn ($a, $b) => strcmp((string) $b['at'], (string) $a['at']));
        $latest = $candidates[0] ?? null;

        // Was there study activity after the latest intervention?
        $studiedAfterIntervention = false;
        if ($latest && $lastStudyAt) {
            try {
                $studiedAfterIntervention =
                    Carbon::parse($lastStudyAt)->gt(Carbon::parse($latest['at']));
            } catch (\Throwable) {}
        }

        // ── needs_follow_up rules ─────────────────────────────────────────

        $needsFollowUp    = false;
        $recommendedAction = 'Takip yeterli görünüyor';

        if ($latest) {
            $daysSinceIntervention = 0;
            try {
                $daysSinceIntervention = (int) Carbon::parse($latest['at'])->diffInDays(now());
            } catch (\Throwable) {}

            // A) Intervention exists but no study after it
            if (!$studiedAfterIntervention) {
                $needsFollowUp        = true;
                $recommendedAction    = match ($latest['type']) {
                    'plan_task'  => 'Plan gönderildi ama öğrenci çalışmaya başlamadı',
                    'assignment' => 'Ödev verildi ama öğrenci çalışmaya başlamadı',
                    default      => 'Mesaj gönderildi ama çalışma başlamadı',
                };
            }
            // B) Intervention > 7 days ago and student is still risky
            elseif ($daysSinceIntervention > 7 && $riskLevel !== 'green') {
                $needsFollowUp        = true;
                $recommendedAction    = 'Takip zamanı geldi';
            }
        } else {
            // C) No intervention at all and student is risky
            if ($riskLevel !== 'green') {
                $needsFollowUp        = true;
                $recommendedAction    = 'İlk müdahaleyi planla';
            }
        }

        return [
            'last_at'            => $latest ? $latest['at'] : null,
            'type'               => $latest ? $latest['type'] : null,
            'confidence'         => $latest ? $latest['confidence'] : null,
            'label'              => $this->buildLabel($latest),
            'needs_follow_up'    => $needsFollowUp,
            'recommended_action' => $recommendedAction,
        ];
    }

    private function buildLabel(?array $latest): string
    {
        if ($latest === null) {
            return 'Henüz müdahale yok';
        }

        $days = 0;
        try {
            $days = (int) Carbon::parse($latest['at'])->diffInDays(now());
        } catch (\Throwable) {}

        $typeLabel = match ($latest['type']) {
            'plan_task'  => 'plan',
            'assignment' => 'ödev',
            'message'    => 'mesaj',
            default      => 'müdahale',
        };

        if ($days === 0) return "Bugün $typeLabel gönderildi";
        if ($days === 1) return "Dün $typeLabel gönderildi";
        return "Son $typeLabel $days gün önce";
    }
}
