<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VideoDRMService;
use App\Services\VideoStreamingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class VideoController extends Controller
{
    public function __construct(
        private VideoDRMService $drmService,
        private VideoStreamingService $streamingService
    ) {}

    /**
     * Get DRM token for video playback
     */
    public function getDRMToken(int $videoId, Request $request): JsonResponse
    {
        $request->validate([
            'platform' => 'required|in:web,android,ios,windows,macos',
        ]);

        $drmConfig = $this->drmService->generateDRMToken(
            Auth::id(),
            $videoId,
            $request->platform
        );

        if (isset($drmConfig['error'])) {
            return response()->json([
                'error' => true,
                'message' => $drmConfig['error'],
            ], 403);
        }

        return response()->json([
            'success' => true,
            'drm_config' => $drmConfig,
        ]);
    }

    /**
     * Get streaming URL
     */
    public function getStreamingURL(int $videoId): JsonResponse
    {
        $streamData = $this->streamingService->getStreamingURL(Auth::id(), $videoId);

        if (isset($streamData['error'])) {
            return response()->json([
                'error' => true,
                'message' => $streamData['error'],
            ], 403);
        }

        return response()->json([
            'success' => true,
            'streaming' => $streamData,
        ]);
    }

    /**
     * Track video playback
     */
    public function trackPlayback(int $videoId, Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
            'location' => 'sometimes|string',
        ]);

        $this->drmService->trackPlayback(Auth::id(), $videoId, $request->all());

        // Check for suspicious activity
        $alerts = $this->drmService->detectSuspiciousActivity(Auth::id(), $videoId);

        if (!empty($alerts)) {
            // Notify admin / take action
            foreach ($alerts as $alert) {
                if ($alert['severity'] === 'high') {
                    // Suspend playback or flag user
                    \Log::channel('security')->warning('Suspicious video activity', [
                        'user_id' => Auth::id(),
                        'video_id' => $videoId,
                        'alert' => $alert,
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'alerts' => $alerts,
        ]);
    }

    /**
     * Track video analytics (watch time, quality, buffering)
     */
    public function trackAnalytics(int $videoId, Request $request): JsonResponse
    {
        $request->validate([
            'duration' => 'required|integer',
            'quality' => 'required|string',
            'buffering_count' => 'sometimes|integer',
            'completion_rate' => 'required|numeric|min:0|max:100',
            'device_type' => 'sometimes|string',
        ]);

        $this->streamingService->trackVideoAnalytics(Auth::id(), $videoId, $request->all());

        return response()->json([
            'success' => true,
            'message' => 'Analytics tracked',
        ]);
    }

    /**
     * Get video encryption key (for HLS decryption)
     */
    public function getEncryptionKey(Request $request): JsonResponse
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $verified = $this->drmService->verifyDRMToken($token);

        if (!$verified) {
            return response()->json(['error' => 'Invalid token'], 403);
        }

        // Return encryption key for HLS segments
        $keyPath = storage_path("app/videos/processed/{$verified['video_id']}/enc.key");
        
        if (!file_exists($keyPath)) {
            return response()->json(['error' => 'Key not found'], 404);
        }

        return response()->file($keyPath);
    }
}
