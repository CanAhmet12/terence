<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\User;
use App\Models\StudySession;
use App\Models\XpLog;
use App\Models\ExamSession;
use App\Models\QuestionAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StudentController extends Controller
{
    // GET /api/student/badges
    public function badges(): JsonResponse
    {
        $user      = Auth::user();
        $allBadges = Badge::where('is_active', true)->get();

        $earnedBadges = DB::table('user_badges')
            ->where('user_id', $user->id)
            ->pluck('earned_at', 'badge_id');

        $badges = $allBadges->map(fn($b) => [
            'id'          => $b->id,
            'name'        => $b->name,
            'description' => $b->description,
            'icon'        => $b->icon_url ?? $b->icon ?? null,
            'emoji'       => null,
            'earned'      => isset($earnedBadges[$b->id]),
            'earned_at'   => $earnedBadges[$b->id] ?? null,
            'xp_reward'   => $b->xp_reward,
            'progress'    => null,
            'required'    => null,
        ])->values();

        $weekStart = Carbon::now()->startOfWeek();
        $topUser   = StudySession::where('started_at', '>=', $weekStart)
            ->whereNotNull('duration_seconds')
            ->selectRaw('user_id, SUM(duration_seconds) as total_seconds')
            ->groupBy('user_id')
            ->orderByDesc('total_seconds')
            ->first();

        $champion = null;
        if ($topUser) {
            $champUser = User::find($topUser->user_id);
            $champion  = [
                'name'          => $champUser?->name ?? 'Bilinmiyor',
                'study_minutes' => round($topUser->total_seconds / 60),
            ];
        }

        return response()->json([
            'success'        => true,
            'badges'         => $badges,
            'total_xp'       => (int) $user->xp_points,
            'xp'             => (int) $user->xp_points,
            'xp_next_level'  => (int)(($user->level ?? 1) * 500),
            'level'          => (int) ($user->level ?? 1),
            'weekly_champion'=> $champion,
        ]);
    }

    // GET /api/student/leaderboard
    public function leaderboard(Request $request): JsonResponse
    {
        $user   = Auth::user();
        $period = $request->query('period', 'weekly');

        $since = $period === 'monthly' ? Carbon::now()->startOfMonth() : Carbon::now()->startOfWeek();

        $rows = StudySession::where('started_at', '>=', $since)
            ->whereNotNull('duration_seconds')
            ->selectRaw('user_id, SUM(duration_seconds) as total_seconds')
            ->groupBy('user_id')
            ->orderByDesc('total_seconds')
            ->limit(20)
            ->get();

        $userIds = $rows->pluck('user_id');
        $users   = User::whereIn('id', $userIds)->get()->keyBy('id');

        $leaderboard = $rows->map(function ($row, $i) use ($users, $user) {
            $u = $users[$row->user_id] ?? null;
            return [
                'rank'              => $i + 1,
                'user_id'           => $row->user_id,
                'name'              => $u?->name ?? 'Bilinmiyor',
                'profile_photo_url' => $u?->profile_photo_url ?? null,
                'study_minutes'     => round($row->total_seconds / 60),
                'xp_points'         => (int) ($u?->xp_points ?? 0),
                'is_current_user'   => $row->user_id === $user->id,
            ];
        })->values();

        return response()->json(['success' => true, 'data' => $leaderboard]);
    }

    // GET /api/student/upcoming-lessons
    public function upcomingLessons(): JsonResponse
    {
        $user     = Auth::user();
        $classIds = DB::table('class_students')->where('student_id', $user->id)->pluck('class_room_id');

        $sessions = \App\Models\LiveSession::whereIn('class_room_id', $classIds)
            ->where('status', 'scheduled')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->limit(10)
            ->get();

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    // POST /api/push-token
    public function registerPushToken(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string|max:500',
            'platform' => 'nullable|string|in:web,android,ios',
        ]);

        $user     = Auth::user();
        $platform = $request->platform ?? 'web';
        $token    = $request->token;

        // Store in users.fcm_tokens JSON column
        $existing = is_string($user->fcm_tokens) ? json_decode($user->fcm_tokens, true) : (array)($user->fcm_tokens ?? []);
        $existing[$platform] = $token;

        DB::table('users')->where('id', $user->id)->update([
            'fcm_tokens' => json_encode($existing),
        ]);

        return response()->json(['success' => true, 'message' => 'Push token kaydedildi']);
    }

    // GET /api/student/goal-engine
    public function goalEngine(): JsonResponse
    {
        $user = Auth::user();

        $examDate  = $user->exam_date ? Carbon::parse($user->exam_date) : Carbon::now()->addMonths(6);
        $daysLeft  = max(0, (int) Carbon::now()->diffInDays($examDate, false));
        $weeksLeft = max(1, ceil($daysLeft / 7));

        // Current net score (last 30 days average)
        $currentNet = (float) ($user->current_net ?? 0);
        $targetNet  = (float) ($user->target_net ?? 80);

        $netNeeded      = max(0, $targetNet - $currentNet);
        $weeklyNetNeeded = $weeksLeft > 0 ? round($netNeeded / $weeksLeft, 2) : 0;

        // Risk assessment
        $risk = 'low';
        if ($weeklyNetNeeded > 5)       $risk = 'high';
        elseif ($weeklyNetNeeded > 2)   $risk = 'medium';

        // Weekly study stats
        $weekStart     = Carbon::now()->startOfWeek();
        $weeklyMinutes = (int) StudySession::where('user_id', $user->id)
            ->where('started_at', '>=', $weekStart)
            ->whereNotNull('duration_seconds')
            ->sum(DB::raw('duration_seconds / 60'));

        // Streak days
        $streakDays = $user->streak_days ?? 0;

        return response()->json([
            'success'            => true,
            'days_left'          => $daysLeft,
            'weeks_left'         => (int) $weeksLeft,
            'current_net'        => $currentNet,
            'target_net'         => $targetNet,
            'net_needed'         => round($netNeeded, 2),
            'weekly_net_needed'  => $weeklyNetNeeded,
            'risk'               => $risk,
            'weekly_study_minutes' => $weeklyMinutes,
            'streak_days'        => $streakDays,
            'exam_date'          => $examDate->format('Y-m-d'),
            'exam_goal'          => $user->exam_goal ?? 'TYT',
            'upgrade_suggestion' => $risk === 'high' && ($user->subscription_plan ?? 'free') === 'free',
        ]);
    }

    // GET /api/student/report
    public function report(): JsonResponse
    {
        $user = Auth::user();

        // Weekly net scores for the last 8 weeks
        $weeklyNets = collect(range(7, 0))->map(function ($weeksAgo) use ($user) {
            $weekStart = Carbon::now()->subWeeks($weeksAgo)->startOfWeek();
            $weekEnd   = $weekStart->copy()->endOfWeek();
            $label     = $weekStart->format('d M');

            $sessions = ExamSession::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereBetween('completed_at', [$weekStart, $weekEnd])
                ->get();

            $netScore = $sessions->avg('net_score') ?? 0;
            return ['label' => $label, 'net' => round((float)$netScore, 1)];
        })->values();

        // Subject performance
        $subjectPerf = QuestionAnswer::where('question_answers.user_id', $user->id)
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->whereNotNull('questions.subject')
            ->select(
                'questions.subject',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN question_answers.is_correct THEN 1 ELSE 0 END) as correct')
            )
            ->groupBy('questions.subject')
            ->limit(8)
            ->get()
            ->map(fn($r) => [
                'subject'  => $r->subject,
                'total'    => $r->total,
                'correct'  => $r->correct,
                'accuracy' => $r->total > 0 ? round(($r->correct / $r->total) * 100, 1) : 0,
            ])->values();

        // Weak achievements
        $weakAchievements = QuestionAnswer::where('question_answers.user_id', $user->id)
            ->where('question_answers.is_correct', false)
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->whereNotNull('questions.kazanim_kodu')
            ->select(
                'questions.kazanim_kodu',
                'questions.subject',
                DB::raw('COUNT(*) as wrong_count'),
                DB::raw('COUNT(DISTINCT question_answers.question_id) as q_count')
            )
            ->groupBy('questions.kazanim_kodu', 'questions.subject')
            ->orderByDesc('wrong_count')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'kazanim_kodu' => $r->kazanim_kodu,
                'subject'      => $r->subject,
                'wrong_count'  => $r->wrong_count,
                'accuracy'     => 0,
            ])->values();

        $totalSessions = ExamSession::where('user_id', $user->id)->where('status', 'completed')->count();
        $avgNet        = ExamSession::where('user_id', $user->id)->where('status', 'completed')->avg('net_score') ?? 0;
        $lastNet       = ExamSession::where('user_id', $user->id)->where('status', 'completed')->orderByDesc('completed_at')->value('net_score') ?? 0;

        return response()->json([
            'success'           => true,
            'weekly_nets'       => $weeklyNets,
            'subject_performance'=> $subjectPerf,
            'weak_achievements' => $weakAchievements,
            'total_exams'       => $totalSessions,
            'average_net'       => round((float)$avgNet, 2),
            'last_net'          => round((float)$lastNet, 2),
            'streak_days'       => $user->streak_days ?? 0,
            'xp_points'         => (int) ($user->xp_points ?? 0),
            'current_net'       => (float) ($user->current_net ?? 0),
            'target_net'        => (float) ($user->target_net ?? 80),
        ]);
    }
}
