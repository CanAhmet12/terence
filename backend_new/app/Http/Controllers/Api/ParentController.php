<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ParentStudent;
use App\Models\StudySession;
use App\Models\DailyPlan;
use App\Models\ExamSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ParentController extends Controller
{
    // GET /api/parent/children — bağlı çocuklar
    public function children(): JsonResponse
    {
        $parent   = Auth::user();
        $students = $parent->children()->where('parent_students.status', 'approved')->get();

        $result = $students->map(fn($s) => $this->buildChildSummary($s));

        return response()->json(['success' => true, 'data' => $result]);
    }

    // GET /api/parent/children/{id}/summary
    public function childSummary(int $childId): JsonResponse
    {
        $parent = Auth::user();
        $link   = ParentStudent::where('parent_id', $parent->id)
            ->where('student_id', $childId)
            ->where('status', 'approved')
            ->firstOrFail();

        $student = User::findOrFail($childId);
        return response()->json(['success' => true, 'data' => $this->buildChildSummary($student)]);
    }

    // POST /api/parent/link — çocuk bağla (invite kod ile)
    public function linkChild(Request $request): JsonResponse
    {
        $request->validate(['invite_code' => 'required|string|max:20']);
        $parent  = Auth::user();

        // Kodu öğrenci tarafında ara
        $link = ParentStudent::where('invite_code', $request->invite_code)
            ->where('status', 'pending')->first();

        if (!$link) {
            return response()->json([
                'error'   => true,
                'code'    => 'INVALID_CODE',
                'message' => 'Geçersiz veya süresi dolmuş davet kodu',
            ], 404);
        }

        $link->update(['parent_id' => $parent->id, 'status' => 'approved']);

        return response()->json(['success' => true, 'message' => 'Çocuk hesabı bağlandı']);
    }

    // POST /api/student/generate-parent-code — öğrenci davet kodu üretir
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

    // -------------------------------------------------------
    private function buildChildSummary(User $student): array
    {
        $today = Carbon::today()->toDateString();

        $todayPlan = DailyPlan::where('user_id', $student->id)->where('plan_date', $today)->first();
        $todayStudy = StudySession::where('user_id', $student->id)
            ->whereDate('started_at', $today)->sum('duration_seconds');

        $weeklyNets = ExamSession::where('user_id', $student->id)
            ->where('status', 'completed')
            ->where('started_at', '>=', Carbon::now()->subWeeks(6))
            ->selectRaw('WEEK(started_at) w, AVG(net_score) net')
            ->groupBy('w')->orderBy('w')->limit(6)
            ->pluck('net')->map(fn($n) => round((float)$n, 1))->values()->toArray();

        $lastActive = StudySession::where('user_id', $student->id)
            ->orderByDesc('started_at')->value('started_at');

        $net   = (float) $student->current_net;
        $days  = $lastActive ? now()->diffInDays($lastActive) : 999;
        $risk  = 'green';
        if ($days > 7 || $net < 20)  $risk = 'red';
        elseif ($days > 3 || $net < 40) $risk = 'yellow';

        return [
            'child'                  => [
                'id'    => $student->id,
                'name'  => $student->name,
                'email' => $student->email,
                'grade' => $student->grade,
                'subscription_plan' => $student->subscription_plan,
                'profile_photo_url' => $student->profile_photo_url,
            ],
            'net_today'              => $net,
            'study_time_today_seconds'=> (int) $todayStudy,
            'tasks_done_today'       => $todayPlan?->completed_tasks ?? 0,
            'tasks_total_today'      => $todayPlan?->total_tasks ?? 0,
            'risk_level'             => $risk,
            'last_active_at'         => $lastActive,
            'weekly_nets'            => $weeklyNets,
        ];
    }
}
