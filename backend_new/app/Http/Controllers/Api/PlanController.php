<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyPlan;
use App\Models\PlanTask;
use App\Models\StudySession;
use App\Models\XpLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PlanController extends Controller
{
    // GET /api/plan/today — bugünün planı
    public function today(): JsonResponse
    {
        $user = Auth::user();
        $today = Carbon::today()->toDateString();

        $plan = DailyPlan::with(['tasks' => function ($q) {
            $q->orderBy('priority', 'desc')->orderBy('sort_order');
        }])->firstOrCreate(
            ['user_id' => $user->id, 'plan_date' => $today],
            ['status' => 'active']
        );

        return response()->json(['success' => true, 'plan' => $plan]);
    }

    // GET /api/plan — plan listesi (tarih aralığı)
    public function index(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $from  = $request->get('from', Carbon::now()->startOfWeek()->toDateString());
        $to    = $request->get('to', Carbon::now()->endOfWeek()->toDateString());

        $plans = DailyPlan::with('tasks')
            ->where('user_id', $user->id)
            ->whereBetween('plan_date', [$from, $to])
            ->orderBy('plan_date')
            ->get();

        return response()->json(['success' => true, 'data' => $plans]);
    }

    // POST /api/plan/tasks — görev ekle
    public function addTask(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'title'           => 'required|string|max:255',
            'type'            => 'sometimes|in:video,question,exam,read,repeat,custom',
            'subject'         => 'sometimes|nullable|string',
            'kazanim_code'    => 'sometimes|nullable|string|max:30',
            'target_count'    => 'sometimes|nullable|integer|min:1',
            'planned_minutes' => 'sometimes|integer|min:5|max:480',
            'priority'        => 'sometimes|in:low,normal,high',
            'plan_date'       => 'sometimes|date',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $user  = Auth::user();
        $date  = $request->get('plan_date', Carbon::today()->toDateString());
        $plan  = DailyPlan::firstOrCreate(
            ['user_id' => $user->id, 'plan_date' => $date],
            ['status' => 'active']
        );

        $task = PlanTask::create(array_merge($v->validated(), [
            'daily_plan_id' => $plan->id,
            'user_id'       => $user->id,
        ]));

        // toplam görev sayısını güncelle
        $plan->increment('total_tasks');

        return response()->json(['success' => true, 'task' => $task], 201);
    }

    // PATCH /api/plan/tasks/{id}/complete — görevi tamamla
    public function completeTask(int $taskId): JsonResponse
    {
        $user = Auth::user();
        $task = PlanTask::where('user_id', $user->id)->findOrFail($taskId);

        if ($task->is_completed) {
            return response()->json(['success' => true, 'message' => 'Zaten tamamlandı', 'task' => $task]);
        }

        $task->update([
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        $plan = $task->dailyPlan;
        $plan->increment('completed_tasks');

        // Tüm görevler bittiyse planı tamamla
        if ($plan->completed_tasks >= $plan->total_tasks) {
            $plan->update(['status' => 'completed']);
            // XP ödülü
            $xp = 20;
            XpLog::create(['user_id' => $user->id, 'amount' => $xp, 'reason' => 'daily_plan',
                'sourceable_type' => 'daily_plans', 'sourceable_id' => $plan->id]);
            DB::table('users')->where('id', $user->id)->update(['xp_points' => DB::raw("xp_points + $xp")]);
        }

        return response()->json(['success' => true, 'task' => $task->fresh()]);
    }

    // DELETE /api/plan/tasks/{id}
    public function deleteTask(int $taskId): JsonResponse
    {
        $user = Auth::user();
        $task = PlanTask::where('user_id', $user->id)->findOrFail($taskId);
        $plan = $task->dailyPlan;
        $task->delete();
        $plan->decrement('total_tasks');
        return response()->json(['success' => true, 'message' => 'Görev silindi']);
    }

    // POST /api/plan/study-session/start — çalışma seansı başlat
    public function startStudySession(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'subject'      => 'sometimes|nullable|string',
            'plan_task_id' => 'sometimes|nullable|integer|exists:plan_tasks,id',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $user = Auth::user();
        $session = StudySession::create(array_merge($v->validated(), [
            'user_id'    => $user->id,
            'started_at' => now(),
        ]));

        return response()->json(['success' => true, 'session_id' => $session->id]);
    }

    // POST /api/plan/study-session/{id}/end
    public function endStudySession(int $id): JsonResponse
    {
        $user    = Auth::user();
        $session = StudySession::where('user_id', $user->id)->findOrFail($id);
        $seconds = now()->diffInSeconds($session->started_at);
        $session->update(['ended_at' => now(), 'duration_seconds' => $seconds]);

        // Bugünün planına gerçek süreyi ekle
        $plan = DailyPlan::firstOrCreate(
            ['user_id' => $user->id, 'plan_date' => Carbon::today()->toDateString()],
            ['status' => 'active']
        );
        $plan->increment('study_minutes_actual', (int) round($seconds / 60));

        return response()->json(['success' => true, 'duration_seconds' => $seconds]);
    }

    // GET /api/plan/stats — öğrenci özeti
    public function stats(): JsonResponse
    {
        $user  = Auth::user();
        $today = Carbon::today()->toDateString();

        $todayPlan = DailyPlan::where('user_id', $user->id)->where('plan_date', $today)->first();

        $weekStart   = Carbon::now()->startOfWeek()->toDateString();
        $weeklyStudy = StudySession::where('user_id', $user->id)
            ->where('started_at', '>=', $weekStart)
            ->sum('duration_seconds');

        $weeklyNets  = ExamSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->where('started_at', '>=', Carbon::now()->subWeeks(6))
            ->selectRaw('YEAR(started_at) y, WEEK(started_at) w, AVG(net_score) net')
            ->groupByRaw('YEAR(started_at), WEEK(started_at)')
            ->orderByRaw('y, w')
            ->limit(6)
            ->pluck('net')
            ->map(fn($n) => round((float)$n, 1))
            ->values()
            ->toArray();

        return response()->json([
            'success'                    => true,
            'tasks_done_today'           => $todayPlan?->completed_tasks ?? 0,
            'tasks_total_today'          => $todayPlan?->total_tasks ?? 0,
            'study_time_today_seconds'   => ($todayPlan?->study_minutes_actual ?? 0) * 60,
            'study_time_weekly_seconds'  => (int) $weeklyStudy,
            'xp_points'                  => $user->xp_points,
            'level'                      => $user->level,
            'current_net'                => $user->current_net,
            'target_net'                 => $user->target_net,
            'weekly_nets'                => $weeklyNets,
        ]);
    }
}

// ExamSession için use
use App\Models\ExamSession;
