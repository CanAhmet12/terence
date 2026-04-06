<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ParentDashboardService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ParentDashboardController extends Controller
{
    public function __construct(private ParentDashboardService $dashboardService) {}

    /**
     * Get parent overview (all children summary)
     */
    public function overview(): JsonResponse
    {
        $parent = Auth::user();

        if (!$parent->isParent()) {
            return response()->json([
                'error' => true,
                'message' => 'Bu özellik sadece veliler için',
            ], 403);
        }

        $overview = $this->dashboardService->getParentOverview($parent);

        return response()->json([
            'success' => true,
            'overview' => $overview,
        ]);
    }

    /**
     * Get detailed child progress
     */
    public function childProgress(int $childId): JsonResponse
    {
        $parent = Auth::user();

        if (!$parent->isParent()) {
            return response()->json([
                'error' => true,
                'message' => 'Bu özellik sadece veliler için',
            ], 403);
        }

        $progress = $this->dashboardService->getChildProgress($childId, $parent);

        if (isset($progress['error'])) {
            return response()->json([
                'error' => true,
                'message' => $progress['error'],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'progress' => $progress,
        ]);
    }

    /**
     * Get parent notifications
     */
    public function getNotifications(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 20);
        $unreadOnly = $request->input('unread_only', false);

        $query = \DB::table('parent_notifications')
            ->where('parent_id', Auth::id())
            ->orderBy('created_at', 'desc');

        if ($unreadOnly) {
            $query->where('is_read', false);
        }

        $notifications = $query->limit($limit)->get();

        $unreadCount = \DB::table('parent_notifications')
            ->where('parent_id', Auth::id())
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markNotificationAsRead(int $notificationId): JsonResponse
    {
        $updated = \DB::table('parent_notifications')
            ->where('id', $notificationId)
            ->where('parent_id', Auth::id())
            ->update(['is_read' => true, 'read_at' => now()]);

        if ($updated) {
            return response()->json([
                'success' => true,
                'message' => 'Bildirim okundu',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => 'Bildirim bulunamadı',
        ], 404);
    }

    /**
     * Get performance alerts
     */
    public function getAlerts(Request $request): JsonResponse
    {
        $unresolvedOnly = $request->input('unresolved_only', true);

        $query = \DB::table('performance_alerts')
            ->where('parent_id', Auth::id())
            ->orderBy('severity', 'desc')
            ->orderBy('created_at', 'desc');

        if ($unresolvedOnly) {
            $query->where('is_resolved', false);
        }

        $alerts = $query->get();

        return response()->json([
            'success' => true,
            'alerts' => $alerts,
            'total_unresolved' => \DB::table('performance_alerts')
                ->where('parent_id', Auth::id())
                ->where('is_resolved', false)
                ->count(),
        ]);
    }

    /**
     * Resolve alert
     */
    public function resolveAlert(int $alertId): JsonResponse
    {
        $updated = \DB::table('performance_alerts')
            ->where('id', $alertId)
            ->where('parent_id', Auth::id())
            ->update([
                'is_resolved' => true,
                'resolved_at' => now(),
            ]);

        if ($updated) {
            return response()->json([
                'success' => true,
                'message' => 'Uyarı çözüldü',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => 'Uyarı bulunamadı',
        ], 404);
    }

    /**
     * Update parent settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'notify_low_performance' => 'boolean',
            'notify_streak_broken' => 'boolean',
            'notify_achievements' => 'boolean',
            'notify_exam_results' => 'boolean',
            'notify_weekly_report' => 'boolean',
            'report_frequency' => 'in:daily,weekly,monthly',
            'report_time' => 'date_format:H:i',
            'email_reports' => 'boolean',
            'sms_reports' => 'boolean',
            'accuracy_threshold' => 'integer|min:0|max:100',
            'study_time_threshold' => 'integer|min:0',
            'streak_broken_threshold' => 'integer|min:1',
        ]);

        \DB::table('parent_settings')->updateOrInsert(
            ['parent_id' => Auth::id()],
            array_merge($request->all(), [
                'updated_at' => now(),
            ])
        );

        return response()->json([
            'success' => true,
            'message' => 'Ayarlar güncellendi',
        ]);
    }

    /**
     * Get parent settings
     */
    public function getSettings(): JsonResponse
    {
        $settings = \DB::table('parent_settings')
            ->where('parent_id', Auth::id())
            ->first();

        if (!$settings) {
            // Return defaults
            $settings = (object)[
                'notify_low_performance' => true,
                'notify_streak_broken' => true,
                'notify_achievements' => true,
                'notify_exam_results' => true,
                'notify_weekly_report' => true,
                'report_frequency' => 'weekly',
                'report_time' => '20:00:00',
                'email_reports' => true,
                'sms_reports' => false,
                'accuracy_threshold' => 60,
                'study_time_threshold' => 30,
                'streak_broken_threshold' => 3,
            ];
        }

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    /**
     * Request weekly report manually
     */
    public function requestWeeklyReport(int $childId): JsonResponse
    {
        $parent = Auth::user();
        $child = $parent->approvedChildren()->find($childId);

        if (!$child) {
            return response()->json([
                'error' => true,
                'message' => 'Çocuk bulunamadı',
            ], 404);
        }

        // Generate and return report
        $report = $this->dashboardService->getChildProgress($childId, $parent);

        return response()->json([
            'success' => true,
            'report' => $report,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Compare children performance
     */
    public function compareChildren(): JsonResponse
    {
        $parent = Auth::user();
        $children = $parent->approvedChildren()->get();

        $comparison = [];

        foreach ($children as $child) {
            $summary = $this->dashboardService->getChildProgress($child->id, $parent);
            
            $comparison[] = [
                'student_id' => $child->id,
                'student_name' => $child->name,
                'performance' => $summary['performance'] ?? null,
                'study_time_week' => $summary['performance']['last_30_days']['total_study_hours'] ?? 0,
                'accuracy_rate' => $summary['performance']['last_30_days']['accuracy_rate'] ?? 0,
                'current_streak' => $summary['summary']['current_streak'] ?? 0,
            ];
        }

        return response()->json([
            'success' => true,
            'comparison' => $comparison,
        ]);
    }
}
