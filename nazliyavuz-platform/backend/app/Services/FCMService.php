<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FCMService
{
    private string $serverKey;
    private string $senderId;
    private string $fcmUrl;

    public function __construct()
    {
        $this->serverKey = config('services.fcm.server_key');
        $this->senderId = config('services.fcm.sender_id');
        $this->fcmUrl = 'https://fcm.googleapis.com/fcm/send';
    }

    /**
     * Send notification to a single user
     */
    public function sendToUser(User $user, array $notification, array $data = []): bool
    {
        if (!$user->fcm_token) {
            Log::channel('external_api')->warning('User has no FCM token', [
                'user_id' => $user->id,
            ]);
            return false;
        }

        return $this->send($user->fcm_token, $notification, $data);
    }

    /**
     * Send notification to multiple users
     */
    public function sendToUsers(array $users, array $notification, array $data = []): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        foreach ($users as $user) {
            if ($this->sendToUser($user, $notification, $data)) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = $user->id;
            }
        }

        return $results;
    }

    /**
     * Send notification to a topic
     */
    public function sendToTopic(string $topic, array $notification, array $data = []): bool
    {
        return $this->send("/topics/{$topic}", $notification, $data);
    }

    /**
     * Subscribe user to topic
     */
    public function subscribeToTopic(string $fcmToken, string $topic): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post('https://iid.googleapis.com/iid/v1/' . $fcmToken . '/rel/topics/' . $topic);

            return $response->successful();
        } catch (\Exception $e) {
            Log::channel('external_api')->error('FCM topic subscription failed', [
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Unsubscribe user from topic
     */
    public function unsubscribeFromTopic(string $fcmToken, string $topic): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->delete('https://iid.googleapis.com/iid/v1/' . $fcmToken . '/rel/topics/' . $topic);

            return $response->successful();
        } catch (\Exception $e) {
            Log::channel('external_api')->error('FCM topic unsubscription failed', [
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send FCM notification
     */
    private function send(string $to, array $notification, array $data): bool
    {
        try {
            $payload = [
                'to' => $to,
                'notification' => [
                    'title' => $notification['title'] ?? '',
                    'body' => $notification['body'] ?? '',
                    'icon' => $notification['icon'] ?? '/icon-192x192.png',
                    'click_action' => $notification['click_action'] ?? 'FLUTTER_NOTIFICATION_CLICK',
                    'sound' => $notification['sound'] ?? 'default',
                ],
                'priority' => $notification['priority'] ?? 'high',
                'data' => array_merge($data, [
                    'timestamp' => time(),
                ]),
            ];

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $payload);

            if ($response->successful()) {
                $result = $response->json();
                
                Log::channel('external_api')->info('FCM notification sent', [
                    'success' => $result['success'] ?? 0,
                    'failure' => $result['failure'] ?? 0,
                ]);

                return ($result['success'] ?? 0) > 0;
            }

            Log::channel('external_api')->error('FCM send failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::channel('external_api')->error('FCM exception', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send silent data message (no notification)
     */
    public function sendDataMessage(string $to, array $data): bool
    {
        try {
            $payload = [
                'to' => $to,
                'data' => array_merge($data, [
                    'timestamp' => time(),
                ]),
                'priority' => 'high',
            ];

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $payload);

            return $response->successful();
        } catch (\Exception $e) {
            Log::channel('external_api')->error('FCM data message exception', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Predefined notification types
     */
    public function sendExamReminder(User $user, string $examTitle, string $startTime): bool
    {
        return $this->sendToUser($user, [
            'title' => '🎯 Deneme Hatırlatması',
            'body' => "{$examTitle} {$startTime} başlayacak!",
        ], [
            'type' => 'exam_reminder',
            'exam_title' => $examTitle,
            'start_time' => $startTime,
        ]);
    }

    public function sendDailyPlanReminder(User $user): bool
    {
        return $this->sendToUser($user, [
            'title' => '📚 Günlük Plan',
            'body' => 'Bugünkü çalışma planın hazır!',
        ], [
            'type' => 'daily_plan',
        ]);
    }

    public function sendStreakReminder(User $user, int $currentStreak): bool
    {
        return $this->sendToUser($user, [
            'title' => '🔥 Seri Devam Ediyor!',
            'body' => "{$currentStreak} günlük seriniz devam ediyor. Bugün de giriş yapın!",
        ], [
            'type' => 'streak_reminder',
            'current_streak' => $currentStreak,
        ]);
    }

    public function sendBadgeEarned(User $user, string $badgeName): bool
    {
        return $this->sendToUser($user, [
            'title' => '🏆 Yeni Rozet!',
            'body' => "\"{$badgeName}\" rozetini kazandınız!",
        ], [
            'type' => 'badge_earned',
            'badge_name' => $badgeName,
        ]);
    }

    public function sendLevelUp(User $user, int $newLevel): bool
    {
        return $this->sendToUser($user, [
            'title' => '⚡ Seviye Atladın!',
            'body' => "Tebrikler! Seviye {$newLevel}'e ulaştınız!",
        ], [
            'type' => 'level_up',
            'new_level' => $newLevel,
        ]);
    }

    public function sendNewMessage(User $user, string $senderName): bool
    {
        return $this->sendToUser($user, [
            'title' => '💬 Yeni Mesaj',
            'body' => "{$senderName} size mesaj gönderdi",
        ], [
            'type' => 'new_message',
            'sender_name' => $senderName,
        ]);
    }

    public function sendSubscriptionExpiring(User $user, int $daysRemaining): bool
    {
        return $this->sendToUser($user, [
            'title' => '⚠️ Abonelik Bitiyor',
            'body' => "Aboneliğiniz {$daysRemaining} gün içinde sona erecek",
        ], [
            'type' => 'subscription_expiring',
            'days_remaining' => $daysRemaining,
        ]);
    }
}
