<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FCMService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function __construct(private FCMService $fcm) {}

    /**
     * Register FCM token
     */
    public function registerToken(Request $request): JsonResponse
    {
        $request->validate([
            'fcm_token' => 'required|string',
            'device_type' => 'sometimes|in:android,ios,web',
        ]);

        $user = Auth::user();
        $user->update([
            'fcm_token' => $request->fcm_token,
            'device_type' => $request->device_type ?? 'web',
        ]);

        // Subscribe to user's topic (for targeted broadcasts)
        $this->fcm->subscribeToTopic($request->fcm_token, "user_{$user->id}");

        // Subscribe to role-based topic
        $this->fcm->subscribeToTopic($request->fcm_token, $user->role);

        return response()->json([
            'success' => true,
            'message' => 'FCM token kaydedildi',
        ]);
    }

    /**
     * Unregister FCM token
     */
    public function unregisterToken(): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->fcm_token) {
            // Unsubscribe from topics
            $this->fcm->unsubscribeFromTopic($user->fcm_token, "user_{$user->id}");
            $this->fcm->unsubscribeFromTopic($user->fcm_token, $user->role);
        }

        $user->update(['fcm_token' => null]);

        return response()->json([
            'success' => true,
            'message' => 'FCM token kaldırıldı',
        ]);
    }

    /**
     * Test notification
     */
    public function testNotification(): JsonResponse
    {
        $user = Auth::user();

        $success = $this->fcm->sendToUser($user, [
            'title' => 'Test Bildirimi',
            'body' => 'Bildirimler çalışıyor! 🎉',
        ], [
            'type' => 'test',
        ]);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Test bildirimi gönderildi',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => 'Bildirim gönderilemedi',
        ], 500);
    }

    /**
     * Get user notifications
     */
    public function getNotifications(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 20);
        $offset = $request->input('offset', 0);

        $notifications = \DB::table('notifications')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->offset($offset)
            ->limit($limit)
            ->get();

        $unreadCount = \DB::table('notifications')
            ->where('user_id', Auth::id())
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
    public function markAsRead(int $notificationId): JsonResponse
    {
        $updated = \DB::table('notifications')
            ->where('id', $notificationId)
            ->where('user_id', Auth::id())
            ->update(['is_read' => true, 'read_at' => now()]);

        if ($updated) {
            return response()->json([
                'success' => true,
                'message' => 'Bildirim okundu olarak işaretlendi',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => 'Bildirim bulunamadı',
        ], 404);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        \DB::table('notifications')
            ->where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Tüm bildirimler okundu',
        ]);
    }

    /**
     * Delete notification
     */
    public function delete(int $notificationId): JsonResponse
    {
        $deleted = \DB::table('notifications')
            ->where('id', $notificationId)
            ->where('user_id', Auth::id())
            ->delete();

        if ($deleted) {
            return response()->json([
                'success' => true,
                'message' => 'Bildirim silindi',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => 'Bildirim bulunamadı',
        ], 404);
    }

    /**
     * Update notification preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $request->validate([
            'exam_reminders' => 'boolean',
            'daily_plan_reminders' => 'boolean',
            'streak_reminders' => 'boolean',
            'badge_notifications' => 'boolean',
            'message_notifications' => 'boolean',
        ]);

        Auth::user()->update([
            'notification_preferences' => $request->all(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bildirim tercihleri güncellendi',
        ]);
    }
}
