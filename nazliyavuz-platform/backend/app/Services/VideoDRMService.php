<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Video DRM Service
 * Widevine, FairPlay, PlayReady integration
 */
class VideoDRMService
{
    private string $widevineProvider = 'https://license.pallycon.com/ri/licenseManager.do';
    private string $fairPlayCertUrl;
    private string $playReadyUrl;

    public function __construct()
    {
        $this->fairPlayCertUrl = config('video.fairplay_cert_url');
        $this->playReadyUrl = config('video.playready_url');
    }

    /**
     * Generate DRM token for video
     */
    public function generateDRMToken(int $userId, int $videoId, string $platform = 'web'): array
    {
        $video = \DB::table('videos')->find($videoId);
        
        if (!$video || !$video->drm_enabled) {
            return ['error' => 'DRM not enabled for this video'];
        }

        $token = $this->createSecureToken($userId, $videoId);

        // Platform-specific DRM
        $drmConfig = match($platform) {
            'android', 'windows' => $this->getWidevineDRM($videoId, $token),
            'ios', 'macos' => $this->getFairPlayDRM($videoId, $token),
            'web' => $this->getMultiDRM($videoId, $token),
            default => ['error' => 'Unsupported platform'],
        };

        // Add watermark configuration
        $drmConfig['watermark'] = $this->getWatermarkConfig($userId, $videoId);

        // Log DRM request
        $this->logDRMRequest($userId, $videoId, $platform);

        return $drmConfig;
    }

    /**
     * Widevine DRM configuration
     */
    private function getWidevineDRM(int $videoId, string $token): array
    {
        return [
            'type' => 'widevine',
            'license_url' => $this->widevineProvider,
            'headers' => [
                'X-DRM-Token' => $token,
                'X-Video-ID' => $videoId,
            ],
            'certificate_url' => config('video.widevine_cert_url'),
        ];
    }

    /**
     * FairPlay DRM configuration
     */
    private function getFairPlayDRM(int $videoId, string $token): array
    {
        return [
            'type' => 'fairplay',
            'license_url' => config('video.fairplay_license_url'),
            'certificate_url' => $this->fairPlayCertUrl,
            'headers' => [
                'X-DRM-Token' => $token,
                'X-Video-ID' => $videoId,
            ],
        ];
    }

    /**
     * Multi-DRM (for web browsers)
     */
    private function getMultiDRM(int $videoId, string $token): array
    {
        return [
            'widevine' => $this->getWidevineDRM($videoId, $token),
            'fairplay' => $this->getFairPlayDRM($videoId, $token),
            'playready' => [
                'type' => 'playready',
                'license_url' => $this->playReadyUrl,
                'headers' => [
                    'X-DRM-Token' => $token,
                    'X-Video-ID' => $videoId,
                ],
            ],
        ];
    }

    /**
     * Get dynamic watermark configuration
     */
    private function getWatermarkConfig(int $userId, int $videoId): array
    {
        $user = \DB::table('users')->find($userId);

        return [
            'enabled' => true,
            'text' => "{$user->name} - {$user->email}",
            'position' => 'random', // Changes position periodically
            'opacity' => 0.3,
            'font_size' => 24,
            'color' => '#FFFFFF',
            'interval' => 30, // Move every 30 seconds
            'user_id' => $userId,
            'timestamp' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Create secure token for DRM
     */
    private function createSecureToken(int $userId, int $videoId): string
    {
        $data = [
            'user_id' => $userId,
            'video_id' => $videoId,
            'timestamp' => time(),
            'expires' => time() + 3600, // 1 hour
        ];

        $jsonData = json_encode($data);
        $signature = hash_hmac('sha256', $jsonData, config('app.key'));

        return base64_encode($jsonData . '.' . $signature);
    }

    /**
     * Verify DRM token
     */
    public function verifyDRMToken(string $token): bool|array
    {
        try {
            $decoded = base64_decode($token);
            [$jsonData, $signature] = explode('.', $decoded);

            $expectedSignature = hash_hmac('sha256', $jsonData, config('app.key'));

            if (!hash_equals($expectedSignature, $signature)) {
                return false;
            }

            $data = json_decode($jsonData, true);

            if ($data['expires'] < time()) {
                return false;
            }

            return $data;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Track video playback for security
     */
    public function trackPlayback(int $userId, int $videoId, array $metadata): void
    {
        \DB::table('video_playbacks')->insert([
            'user_id' => $userId,
            'video_id' => $videoId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'device_id' => $metadata['device_id'] ?? null,
            'location' => $metadata['location'] ?? null,
            'started_at' => Carbon::now(),
            'created_at' => Carbon::now(),
        ]);
    }

    /**
     * Detect suspicious playback (screen recording, multiple devices)
     */
    public function detectSuspiciousActivity(int $userId, int $videoId): array
    {
        $recentPlaybacks = \DB::table('video_playbacks')
            ->where('user_id', $userId)
            ->where('video_id', $videoId)
            ->where('started_at', '>=', Carbon::now()->subMinutes(5))
            ->get();

        $alerts = [];

        // Multiple simultaneous playbacks
        if ($recentPlaybacks->count() > 2) {
            $alerts[] = [
                'type' => 'multiple_devices',
                'severity' => 'high',
                'message' => 'Video aynı anda birden fazla cihazda izleniyor',
            ];
        }

        // Different locations in short time
        $locations = $recentPlaybacks->pluck('location')->unique();
        if ($locations->count() > 1) {
            $alerts[] = [
                'type' => 'location_jump',
                'severity' => 'medium',
                'message' => 'Farklı konumlardan erişim tespit edildi',
            ];
        }

        return $alerts;
    }

    /**
     * Log DRM requests
     */
    private function logDRMRequest(int $userId, int $videoId, string $platform): void
    {
        Log::channel('security')->info('DRM token generated', [
            'user_id' => $userId,
            'video_id' => $videoId,
            'platform' => $platform,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
