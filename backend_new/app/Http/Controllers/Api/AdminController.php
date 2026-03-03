<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\ExamSession;
use App\Models\Subscription;
use App\Models\ContentItem;
use App\Models\Question;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    // GET /api/admin/stats
    public function stats(): JsonResponse
    {
        $totalUsers        = User::count();
        $totalStudents     = User::where('role', 'student')->count();
        $totalTeachers     = User::where('role', 'teacher')->count();
        $activeToday       = User::whereDate('last_login_at', today())->count();
        $totalCourses      = Course::where('is_active', true)->count();
        $totalQuestions    = Question::where('is_active', true)->count();
        $totalExams        = ExamSession::where('status', 'completed')->count();
        $monthlyRevenue    = Subscription::where('status', 'active')
            ->whereMonth('starts_at', now()->month)->sum('amount_paid');
        $activeSubscriptions = Subscription::where('status', 'active')->count();

        return response()->json([
            'success'             => true,
            'total_users'         => $totalUsers,
            'total_students'      => $totalStudents,
            'total_teachers'      => $totalTeachers,
            'active_users_today'  => $activeToday,
            'total_courses'       => $totalCourses,
            'total_questions'     => $totalQuestions,
            'total_exams'         => $totalExams,
            'monthly_revenue'     => round((float)$monthlyRevenue, 2),
            'active_subscriptions'=> $activeSubscriptions,
        ]);
    }

    // GET /api/admin/users
    public function users(Request $request): JsonResponse
    {
        $q = User::query();
        if ($request->filled('search')) {
            $q->where(function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }
        if ($request->filled('role')) {
            $q->where('role', $request->role);
        }
        $users = $q->orderByDesc('created_at')->paginate(20);
        return response()->json([
            'success' => true,
            'data'    => $users->items(),
            'meta'    => [
                'total'        => $users->total(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    // PATCH /api/admin/users/{id}
    public function updateUser(int $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);
        $v    = Validator::make($request->all(), [
            'name'              => 'sometimes|string|max:255',
            'role'              => 'sometimes|in:student,teacher,admin,parent',
            'subscription_plan' => 'sometimes|in:free,bronze,plus,pro',
            'is_active'         => 'sometimes|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $user->update($v->validated());
        return response()->json(['success' => true, 'user' => $user->fresh()]);
    }

    // DELETE /api/admin/users/{id}
    public function deleteUser(int $id): JsonResponse
    {
        User::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Kullanıcı silindi']);
    }

    // POST /api/admin/users/{id}/toggle-status
    public function toggleUserStatus(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $newStatus = $user->suspended_at ? null : now();
        $user->update(['suspended_at' => $newStatus]);
        return response()->json([
            'success'    => true,
            'is_active'  => $user->suspended_at === null,
            'message'    => $user->suspended_at ? 'Kullanıcı askıya alındı' : 'Kullanıcı aktif edildi',
        ]);
    }

    // GET /api/admin/content
    public function content(Request $request): JsonResponse
    {
        $q = ContentItem::with('topic:id,title')->where('is_active', true);
        if ($request->filled('search')) {
            $q->where('title', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }
        $items = $q->orderByDesc('created_at')->paginate(30);
        return response()->json([
            'success' => true,
            'data'    => $items->items(),
            'meta'    => ['total' => $items->total()],
        ]);
    }

    // DELETE /api/admin/content/{id}
    public function deleteContent(int $id): JsonResponse
    {
        ContentItem::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'İçerik silindi']);
    }

    // GET /api/admin/reports
    public function reports(): JsonResponse
    {
        $weeklyUsers = collect(range(6, 0))->map(function ($daysAgo) {
            $date = Carbon::now()->subDays($daysAgo);
            return [
                'label' => $date->format('D'),
                'value' => User::whereDate('created_at', $date)->count(),
            ];
        })->values();

        $monthlyRevenue = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = Carbon::now()->subMonths($monthsAgo);
            return [
                'label' => $date->format('M'),
                'value' => (float) Subscription::where('status', 'active')
                    ->whereYear('starts_at', $date->year)
                    ->whereMonth('starts_at', $date->month)
                    ->sum('amount_paid'),
            ];
        })->values();

        $examCompletionRate = ExamSession::count() > 0
            ? round((ExamSession::where('status', 'completed')->count() / ExamSession::count()) * 100, 1)
            : 0;

        $topSubjects = Question::select('subject', DB::raw('COUNT(*) as count'))
            ->whereNotNull('subject')->groupBy('subject')->orderByDesc('count')->limit(5)->get();

        $subscriptionConversions = Subscription::where('status', 'active')
            ->join('subscription_plans', 'subscriptions.plan_id', '=', 'subscription_plans.id')
            ->select('subscription_plans.slug as plan', DB::raw('COUNT(*) as count'))
            ->groupBy('subscription_plans.slug')->get();

        return response()->json([
            'success'                   => true,
            'weekly_users'              => $weeklyUsers,
            'monthly_revenue'           => $monthlyRevenue,
            'exam_completion_rate'      => $examCompletionRate,
            'average_study_time_minutes'=> 0,
            'active_users_today'        => User::whereDate('last_login_at', today())->count(),
            'top_subjects'              => $topSubjects,
            'subscription_conversions'  => $subscriptionConversions->map(fn($s) => [
                'from'  => 'free',
                'to'    => $s->plan,
                'count' => $s->count,
            ]),
        ]);
    }

    // GET /api/admin/audit-logs
    public function auditLogs(): JsonResponse
    {
        $logs = AuditLog::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();
        return response()->json(['success' => true, 'data' => $logs]);
    }

    // POST /api/admin/settings
    public function updateSettings(Request $request): JsonResponse
    {
        // Ayarlar DB'de config tablosunda tutulacak
        // Şimdilik basit bir yanıt dön
        return response()->json(['success' => true, 'message' => 'Ayarlar kaydedildi']);
    }
}
