<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ParentStudent;
use App\Models\StudySession;
use App\Models\DailyPlan;
use App\Models\ExamSession;
use App\Models\ExamAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ParentController extends Controller
{
    // GET /api/parent/children
    public function children(): JsonResponse
    {
        $parent   = Auth::user();
        $students = $parent->children()->where('parent_students.status', 'approved')->get();
        $result   = $students->map(fn($s) => $this->buildChildSummary($s));
        return response()->json(['success' => true, 'data' => $result]);
    }

    // GET /api/parent/children/{id}/summary
    public function childSummary(int $childId): JsonResponse
    {
        $parent = Auth::user();
        ParentStudent::where('parent_id', $parent->id)
            ->where('student_id', $childId)
            ->where('status', 'approved')
            ->firstOrFail();

        $student = User::findOrFail($childId);
        return response()->json(['success' => true, 'data' => $this->buildChildSummary($student)]);
    }

    // POST /api/parent/link
    public function linkChild(Request $request): JsonResponse
    {
        $request->validate(['invite_code' => 'required|string|max:20']);
        $parent = Auth::user();

        $link = ParentStudent::where('invite_code', $request->invite_code)
            ->where('status', 'pending')->first();

        if (!$link) {
            return response()->json([
                'error'   => true,
                'code'    => 'INVALID_CODE',
                'message' => 'GeÃ§ersiz veya sÃ¼resi dolmuÅŸ davet kodu',
            ], 404);
        }

        $link->update(['parent_id' => $parent->id, 'status' => 'approved']);
        return response()->json(['success' => true, 'message' => 'Ã‡ocuk hesabÄ± baÄŸlandÄ±']);
    }

    // POST /api/student/generate-parent-code
    public function generateParentCode(): JsonResponse
    {
        $student = Auth::user();
        $code    = strtoupper(Str::random(8));

        ParentStudent::updateOrCreate(
            ['student_id' => $student->id, 'status' => 'pending'],
            ['parent_id' => null, 'invite_code' => $code]
        );

        return response()->json(['success' => true, 'invite_code' => $code]);
    }

    // GET /api/parent/child-report
    public function childReport(): JsonResponse
    {
        $parent   = Auth::user();
        $students = $parent->children()->where('parent_students.status', 'approved')->get();

        if ($students->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'BaÄŸlÄ± Ã¶ÄŸrenci bulunamadÄ±'], 404);
        }

        $student = $students->first();
        $report  = $this->buildChildReport($student);

        return response()->json(['success' => true, 'report' => $report]);
    }

    // GET /api/parent/notification-settings
    public function getNotificationSettings(): JsonResponse
    {
        $parent   = Auth::user();
        $settings = DB::table('parent_notification_settings')
            ->where('parent_id', $parent->id)
            ->first();

        if (!$settings) {
            // Return defaults
            $defaults = $this->defaultSettings($parent);
            return response()->json(['success' => true, 'settings' => $defaults]);
        }

        return response()->json(['success' => true, 'settings' => [
            'sms_enabled'          => (bool) $settings->sms_enabled,
            'email_enabled'        => (bool) $settings->email_enabled,
            'push_enabled'         => (bool) $settings->push_enabled,
            'inactivity_alert'     => (bool) $settings->inactivity_alert,
            'inactivity_days'      => (int)  $settings->inactivity_days,
            'risk_alert'           => (bool) $settings->risk_alert,
            'exam_results'         => (bool) $settings->exam_results,
            'live_lesson_reminder' => (bool) $settings->live_lesson_reminder,
            'homework_reminder'    => (bool) $settings->homework_reminder,
            'phone'                => $parent->phone,
            'email'                => $parent->email,
        ]]);
    }

    // PATCH /api/parent/notification-settings
    public function updateNotificationSettings(Request $request): JsonResponse
    {
        $parent = Auth::user();

        $v = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'sms_enabled'          => 'sometimes|boolean',
            'email_enabled'        => 'sometimes|boolean',
            'push_enabled'         => 'sometimes|boolean',
            'inactivity_alert'     => 'sometimes|boolean',
            'inactivity_days'      => 'sometimes|integer|min:1|max:30',
            'risk_alert'           => 'sometimes|boolean',
            'exam_results'         => 'sometimes|boolean',
            'live_lesson_reminder' => 'sometimes|boolean',
            'homework_reminder'    => 'sometimes|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $data = array_merge($v->validated(), [
            'parent_id'  => $parent->id,
            'updated_at' => now(),
        ]);

        $exists = DB::table('parent_notification_settings')->where('parent_id', $parent->id)->exists();
        if ($exists) {
            DB::table('parent_notification_settings')->where('parent_id', $parent->id)->update($data);
        } else {
            DB::table('parent_notification_settings')->insert(array_merge($data, ['created_at' => now()]));
        }

        // Re-fetch the saved settings
        $saved = DB::table('parent_notification_settings')->where('parent_id', $parent->id)->first();

        return response()->json(['success' => true, 'settings' => [
            'sms_enabled'          => (bool) ($saved->sms_enabled ?? false),
            'email_enabled'        => (bool) ($saved->email_enabled ?? true),
            'push_enabled'         => (bool) ($saved->push_enabled ?? true),
            'inactivity_alert'     => (bool) ($saved->inactivity_alert ?? true),
            'inactivity_days'      => (int)  ($saved->inactivity_days ?? 3),
            'risk_alert'           => (bool) ($saved->risk_alert ?? true),
            'exam_results'         => (bool) ($saved->exam_results ?? true),
            'live_lesson_reminder' => (bool) ($saved->live_lesson_reminder ?? true),
            'homework_reminder'    => (bool) ($saved->homework_reminder ?? true),
            'phone'                => $parent->phone,
            'email'                => $parent->email,
        ]]);
    }

    // -------------------------------------------------------
    private function buildChildSummary(User $student): array
    {
        $today = Carbon::today()->toDateString();

        $todayPlan = DailyPlan::where('user_id', $student->id)->where('plan_date', $today)->first();
        $todayStudy = \App\Models\StudySession::where('user_id', $student->id)
            ->whereDate('started_at', $today)->sum('duration_seconds');

        $weeklyNets = ExamSession::where('user_id', $student->id)
            ->where('status', 'completed')
            ->where('started_at', '>=', Carbon::now()->subWeeks(6))
            ->selectRaw('WEEK(started_at) w, AVG(net_score) net')
            ->groupBy('w')->orderBy('w')->limit(6)
            ->pluck('net')->map(fn($n) => round((float)$n, 1))->values()->toArray();

        $lastActive = \App\Models\StudySession::where('user_id', $student->id)
            ->orderByDesc('started_at')->value('started_at');

        $net   = (float) $student->current_net;
        $days  = $lastActive ? now()->diffInDays($lastActive) : 999;
        $risk  = 'green';
        if ($days > 7 || $net < 20)  $risk = 'red';
        elseif ($days > 3 || $net < 40) $risk = 'yellow';

        // Recent exams
        $recentExams = ExamSession::where('user_id', $student->id)
            ->where('status', 'completed')
            ->orderByDesc('finished_at')
            ->limit(5)
            ->get(['id', 'title', 'exam_type', 'finished_at', 'net_score', 'correct_count', 'wrong_count'])
            ->map(fn($e) => [
                'title'       => $e->title,
                'finished_at' => $e->finished_at,
                'net_score'   => (float) $e->net_score,
            ])->toArray();

        return [
            'child' => [
                'id'                => $student->id,
                'name'              => $student->name,
                'email'             => $student->email,
                'grade'             => $student->grade,
                'subscription_plan' => $student->subscription_plan,
                'profile_photo_url' => $student->profile_photo_url,
            ],
            'net_today'                => $net,
            'study_time_today_seconds' => (int) $todayStudy,
            'tasks_done_today'         => $todayPlan?->completed_tasks ?? 0,
            'tasks_total_today'        => $todayPlan?->total_tasks ?? 0,
            'risk_level'               => $risk,
            'last_active_at'           => $lastActive,
            'weekly_nets'              => $weeklyNets,
            'recent_exams'             => $recentExams,
        ];
    }

    private function buildChildReport(User $student): array
    {
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd   = Carbon::now()->endOfWeek();

        // Weekly study time
        $weeklyStudy = \App\Models\StudySession::where('user_id', $student->id)
            ->whereBetween('started_at', [$weekStart, $weekEnd])
            ->sum('duration_seconds');

        // Tasks done this week
        $tasksDoneThisWeek = \App\Models\PlanTask::where('user_id', $student->id)
            ->where('is_completed', true)
            ->whereBetween('completed_at', [$weekStart, $weekEnd])
            ->count();

        // Weekly net scores (last 6 weeks)
        $weeklyNets = ExamSession::where('user_id', $student->id)
            ->where('status', 'completed')
            ->where('started_at', '>=', Carbon::now()->subWeeks(6))
            ->selectRaw('WEEK(started_at) w, AVG(net_score) net')
            ->groupBy('w')->orderBy('w')->limit(6)
            ->pluck('net')->map(fn($n) => round((float)$n, 1))->values()->toArray();

        // Recent exams
        $recentExams = ExamSession::where('user_id', $student->id)
            ->where('status', 'completed')
            ->orderByDesc('finished_at')
            ->limit(5)
            ->get(['id', 'title', 'exam_type', 'finished_at', 'net_score', 'correct_count', 'wrong_count'])
            ->map(fn($e) => [
                'title'       => $e->title,
                'finished_at' => $e->finished_at,
                'net_score'   => (float) $e->net_score,
            ])->toArray();

        // Subject analysis from exam answers this month
        $subjectAnalysis = DB::table('exam_answers as ea')
            ->join('questions as q', 'ea.question_id', '=', 'q.id')
            ->where('ea.user_id', $student->id)
            ->where('ea.created_at', '>=', Carbon::now()->subDays(30))
            ->whereNotNull('q.subject')
            ->selectRaw('q.subject, COUNT(*) as total, SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END) as correct_count, SUM(CASE WHEN NOT ea.is_correct AND ea.selected_option IS NOT NULL THEN 1 ELSE 0 END) as wrong_count')
            ->groupBy('q.subject')
            ->get()
            ->map(fn($r) => [
                'subject'       => $r->subject,
                'correct'       => (int) $r->correct_count,
                'wrong'         => (int) $r->wrong_count,
                'net'           => round((int)$r->correct_count - ((int)$r->wrong_count / 4), 2),
            ])->toArray();

        return [
            'child' => [
                'id'    => $student->id,
                'name'  => $student->name,
                'email' => $student->email,
            ],
            'weekly_nets'                => $weeklyNets,
            'current_net'                => (float) $student->current_net,
            'target_net'                 => (float) $student->target_net,
            'study_time_weekly_seconds'  => (int) $weeklyStudy,
            'tasks_done_this_week'       => $tasksDoneThisWeek,
            'subject_analysis'           => $subjectAnalysis,
            'recent_exams'               => $recentExams,
        ];
    }

    private function defaultSettings(User $parent): array
    {
        return [
            'sms_enabled'          => false,
            'email_enabled'        => true,
            'push_enabled'         => true,
            'inactivity_alert'     => true,
            'inactivity_days'      => 3,
            'risk_alert'           => true,
            'exam_results'         => true,
            'live_lesson_reminder' => true,
            'homework_reminder'    => true,
            'phone'                => $parent->phone,
            'email'                => $parent->email,
        ];
    }
}