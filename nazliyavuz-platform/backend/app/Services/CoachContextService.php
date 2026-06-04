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
 * BI-7 — Coach Intelligence Context.
 * Compiles all available student intelligence into a single DTO
 * for use by the AI coach system prompt and the coach-context endpoint.
 * Stateless — works even without any conversation history.
 */
class CoachContextService
{
    public function forUser(User $user): array
    {
        // ── 1. Basics ─────────────────────────────────────────────────────
        $currentNet = (float) ($user->current_net ?? 0);
        $targetNet  = $user->target_net !== null ? (float) $user->target_net : null;

        $daysUntilExam = null;
        $examDateStr   = $user->exam_date ? (string) $user->exam_date : null;
        if ($examDateStr) {
            try {
                $examCarbon    = Carbon::parse($examDateStr)->startOfDay();
                $daysUntilExam = $examCarbon->isFuture()
                    ? (int) now()->startOfDay()->diffInDays($examCarbon, false)
                    : 0;
            } catch (\Throwable) {}
        }

        // ── 2. Risk tier ──────────────────────────────────────────────────
        $riskTier = $this->computeRiskTier($currentNet, $targetNet, $examDateStr, $daysUntilExam);

        // ── 3. Trajectory (exam pace) ─────────────────────────────────────
        $trajectory = $this->computeTrajectory($user, $currentNet, $targetNet, $daysUntilExam);

        // ── 4. Primary recommendation (reuse BI-5) ────────────────────────
        $primaryRec = null;
        try {
            $recs      = (new RecommendationService)->forUser($user);
            $primaryRec = $recs['primary_recommendation'] ?? null;
        } catch (\Throwable) {}

        // ── 5. Weak topics (top 5) ────────────────────────────────────────
        $weakTopics = $this->getWeakTopics($user);

        // ── 6. Study habits ───────────────────────────────────────────────
        $studyHabits = $this->computeStudyHabits($user);

        // ── 7. Conversation context ───────────────────────────────────────
        $messageCount = DB::table('ai_coach_messages')
            ->where('user_id', $user->id)
            ->count();

        // ── 8. Coach summary ──────────────────────────────────────────────
        $coachSummary = $this->buildCoachSummary(
            $riskTier,
            $trajectory['status'] ?? 'insufficient_data',
            $weakTopics,
            $studyHabits,
        );

        // ── 9. Confidence ─────────────────────────────────────────────────
        $dataPoints = count($weakTopics)
            + ($trajectory['status'] !== 'insufficient_data' ? 2 : 0)
            + ($studyHabits['days_inactive'] < 999 ? 1 : 0)
            + ($primaryRec ? 1 : 0);
        $confidence = $dataPoints >= 6 ? 'high' : ($dataPoints >= 3 ? 'medium' : 'low');

        return [
            'student' => [
                'name'           => $user->name,
                'grade'          => $user->grade,
                'exam_type'      => $user->exam_type ?? $user->target_exam ?? 'TYT',
                'current_net'    => $currentNet,
                'target_net'     => $targetNet,
                'days_until_exam'=> $daysUntilExam,
                'subscription'   => $user->subscription_plan ?? 'free',
            ],
            'risk' => [
                'tier'  => $riskTier,
                'label' => match ($riskTier) {
                    'critical' => 'Yüksek risk',
                    'at_risk'  => 'Takip gerekiyor',
                    default    => 'Hedefe uygun',
                },
            ],
            'trajectory'     => $trajectory,
            'recommendation' => $primaryRec,
            'weak_topics'    => $weakTopics,
            'study_habits'   => $studyHabits,
            'coach_summary'  => $coachSummary,
            'conversation'   => ['message_count' => $messageCount],
            'confidence'     => $confidence,
            'generated_at'   => now()->toIso8601String(),
        ];
    }

    /**
     * Compact system-prompt-ready string for direct use in AI messages.
     */
    public function systemPromptContext(User $user): string
    {
        try {
            $ctx = $this->forUser($user);
            $s   = $ctx['student'];
            $h   = $ctx['study_habits'];
            $t   = $ctx['trajectory'];

            $lines = [
                "Öğrenci: {$s['name']}",
                "Sınıf: {$s['grade']}, Sınav türü: {$s['exam_type']}",
                "Güncel net: {$s['current_net']}, Hedef net: " . ($s['target_net'] ?? 'belirsiz'),
                "Sınava kalan gün: " . ($s['days_until_exam'] ?? 'belirsiz'),
                "Risk durumu: {$ctx['risk']['label']}",
                "Trajektori: " . ($t['status'] ?? 'yetersiz veri'),
            ];

            if (! empty($ctx['weak_topics'])) {
                $topics = implode(', ', array_column($ctx['weak_topics'], 'title'));
                $lines[] = "Zayıf konular: $topics";
            }

            if ($h['days_inactive'] < 999) {
                $lines[] = "Son çalışma: {$h['days_inactive']} gün önce, bu hafta {$h['weekly_study_sessions']} seans";
            }

            if (! empty($ctx['recommendation'])) {
                $lines[] = "Bugün önerilen: " . ($ctx['recommendation']['title'] ?? '');
            }

            $lines[] = "Koç özeti: {$ctx['coach_summary']}";

            return implode(". ", $lines) . ".";
        } catch (\Throwable) {
            return "Öğrenci adı: " . ($user->name ?? 'Öğrenci') . ".";
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function computeRiskTier(
        float  $currentNet,
        ?float $targetNet,
        ?string $examDate,
        ?int   $daysUntilExam,
    ): string {
        if ($targetNet === null || $daysUntilExam === null || $daysUntilExam <= 0) {
            return 'at_risk';
        }
        $weeksLeft    = max(1, (int) ceil($daysUntilExam / 7));
        $weeklyNeeded = max(0.0, ($targetNet - $currentNet) / $weeksLeft);
        if ($weeklyNeeded > 5) return 'critical';
        if ($weeklyNeeded > 2) return 'at_risk';
        return 'on_track';
    }

    private function computeTrajectory(
        User  $user,
        float $currentNet,
        ?float $targetNet,
        ?int   $daysUntilExam,
    ): array {
        $sessions = ExamSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('finished_at')
            ->orderBy('finished_at')
            ->get(['net_score', 'finished_at']);

        if ($sessions->count() < 2) {
            return ['status' => 'insufficient_data', 'projected_net' => null, 'weekly_pace' => null];
        }

        $first         = $sessions->first();
        $last          = $sessions->last();
        $firstNet      = (float) $first->net_score;
        $weeksElapsed  = max(1, (int) Carbon::parse($first->finished_at)->diffInWeeks(now()));
        $weeklyPace    = round(($currentNet - $firstNet) / $weeksElapsed, 2);

        $projectedNet  = null;
        $neededPace    = null;
        $status        = 'insufficient_data';

        if ($targetNet !== null && $daysUntilExam !== null && $daysUntilExam > 0) {
            $weeksLeft    = max(1, (int) ceil($daysUntilExam / 7));
            $neededPace   = round(($targetNet - $currentNet) / $weeksLeft, 2);
            $projectedNet = round($currentNet + $weeklyPace * $weeksLeft, 1);
            $diff         = $weeklyPace - $neededPace;
            $status = $diff >= 0 ? 'ahead' : ($diff >= -0.5 ? 'on_track' : 'behind');
        }

        return [
            'status'          => $status,
            'weekly_pace'     => $weeklyPace,
            'projected_net'   => $projectedNet,
            'needed_pace'     => $neededPace,
        ];
    }

    private function getWeakTopics(User $user): array
    {
        try {
            $rows = QuestionAnswer::where('question_answers.user_id', $user->id)
                ->join('questions', 'question_answers.question_id', '=', 'questions.id')
                ->whereNotNull('questions.kazanim_code')
                ->select(
                    'questions.kazanim_code',
                    'questions.subject',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN question_answers.is_correct = 1 THEN 1 ELSE 0 END) as correct')
                )
                ->groupBy('questions.kazanim_code', 'questions.subject')
                ->having('total', '>=', 3)
                ->having(DB::raw('ROUND((correct / total) * 100, 2)'), '<', 60)
                ->orderByRaw('ROUND((correct / total) * 100, 2) ASC')
                ->limit(5)
                ->get();

            return $rows->map(function ($r) {
                $accuracy = $r->total > 0 ? round(($r->correct / $r->total) * 100, 1) : 0;
                $kazanim  = Kazanim::where('kod', $r->kazanim_code)->first();
                return [
                    'kazanim_code' => $r->kazanim_code,
                    'title'        => $kazanim?->konu ?? $r->kazanim_code,
                    'subject'      => $r->subject ?? $kazanim?->subject,
                    'accuracy'     => $accuracy,
                ];
            })->values()->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function computeStudyHabits(User $user): array
    {
        $lastStudy = StudySession::where('user_id', $user->id)
            ->max('started_at');
        $daysInactive = $lastStudy
            ? (int) Carbon::parse($lastStudy)->diffInDays(now())
            : 999;

        $weeklyCount = StudySession::where('user_id', $user->id)
            ->where('started_at', '>=', now()->subWeek())
            ->count();

        $habitLabel = match (true) {
            $daysInactive >= 7             => 'Uzun süredir çalışma yok',
            $daysInactive >= 3             => 'Düzensiz çalışma',
            $weeklyCount >= 5              => 'Düzenli çalışma',
            $weeklyCount >= 3              => 'Orta düzey düzenli',
            default                        => 'Az çalışma',
        };

        return [
            'days_inactive'         => $daysInactive < 999 ? $daysInactive : null,
            'weekly_study_sessions' => $weeklyCount,
            'habit_label'           => $habitLabel,
        ];
    }

    private function buildCoachSummary(
        string $riskTier,
        string $trajectoryStatus,
        array  $weakTopics,
        array  $habits,
    ): string {
        $daysInactive   = $habits['days_inactive'] ?? null;
        $inactiveSignal = ($daysInactive !== null && $daysInactive >= 7);

        return match (true) {
            // critical scenarios (3)
            $riskTier === 'critical' && $trajectoryStatus === 'behind' =>
                "Hedefine ulaşmak için ciddi ivme kazanman gerekiyor. Her gün düzenli çalışmak şu an en önemli adım.",
            $riskTier === 'critical' && in_array($trajectoryStatus, ['on_track', 'ahead']) =>
                "Tempon iyi ama hedef hâlâ çok yüksek. Bu hızı korursan yakalayabilirsin.",
            $riskTier === 'critical' && $inactiveSignal =>
                "Uzun süredir çalışma yok ve hedefin çok uzakta. Küçük bir adımla bugün başla.",

            // at_risk scenarios (3)
            $riskTier === 'at_risk' && $trajectoryStatus === 'behind' =>
                "Geliştirme sürecinde ama tempo artırılmalı. Zayıf konulara odaklanmak fark yaratır.",
            $riskTier === 'at_risk' && $trajectoryStatus === 'ahead' =>
                "Güzel ilerliyorsun! Bu tempo korunursa hedefe ulaşırsın.",
            $riskTier === 'at_risk' =>
                "İlerleme var ancak tempo korunmalı. Düzenli çalışmak önemli.",

            // on_track scenarios (3)
            $riskTier === 'on_track' && $trajectoryStatus === 'ahead' =>
                "Harika! Hedefinin önünde gidiyorsun. Bu motivasyonu korumak yeter.",
            $riskTier === 'on_track' && $trajectoryStatus === 'behind' =>
                "Genel olarak yolundasın ama son dönemde tempo biraz düştü. Dikkat et.",
            $riskTier === 'on_track' =>
                "Yolundasın, devam et. Zayıf konular üzerine çalışmak seni daha da ileriye taşır.",

            // insufficient data
            default =>
                "Yeterli veri oluşmadı. Düzenli çalışmalar başladıkça sana daha kişisel önerilerde bulunabilirim.",
        };
    }
}
