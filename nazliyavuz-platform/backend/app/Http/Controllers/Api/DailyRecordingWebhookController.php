<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LiveSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Daily.co kayıt webhook’u — `DAILY_WEBHOOK_SECRET` tanımlıysa `X-Daily-Webhook-Secret` başlığı zorunlu.
 * Gövde şekli hesaba göre değişebilir; `room_name` + `download_link` veya iç içe `payload` anahtarları desteklenir.
 */
class DailyRecordingWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $secret = env('DAILY_WEBHOOK_SECRET');
        if (is_string($secret) && $secret !== '') {
            $hdr = (string) $request->header('X-Daily-Webhook-Secret', '');
            if (!hash_equals($secret, $hdr)) {
                return response()->json(['error' => true, 'message' => 'Unauthorized'], 401);
            }
        }

        $payload = $request->all();
        $roomName = $request->input('room_name')
            ?? data_get($payload, 'payload.room_name')
            ?? data_get($payload, 'room.name');
        $download = $request->input('download_link')
            ?? $request->input('recording_url')
            ?? data_get($payload, 'payload.recording.download_link')
            ?? data_get($payload, 'download_link');

        if (!$roomName || !$download) {
            return response()->json(['ok' => true, 'skipped' => true]);
        }

        $session = LiveSession::query()->where('daily_room_name', $roomName)->first();
        if ($session) {
            $session->update(['recording_url' => $download]);
        }

        return response()->json(['ok' => true]);
    }
}
