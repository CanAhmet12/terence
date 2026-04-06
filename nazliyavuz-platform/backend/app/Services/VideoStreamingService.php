<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use FFMpeg\FFMpeg;
use FFMpeg\Format\Video\X264;

/**
 * Video Streaming Service
 * HLS, adaptive bitrate, CDN integration
 */
class VideoStreamingService
{
    private array $qualities = [
        '360p' => ['width' => 640, 'height' => 360, 'bitrate' => 800],
        '480p' => ['width' => 854, 'height' => 480, 'bitrate' => 1400],
        '720p' => ['width' => 1280, 'height' => 720, 'bitrate' => 2800],
        '1080p' => ['width' => 1920, 'height' => 1080, 'bitrate' => 5000],
    ];

    /**
     * Process video for adaptive streaming (HLS)
     */
    public function processVideoForStreaming(string $videoPath, int $videoId): array
    {
        $outputDir = storage_path("app/videos/processed/{$videoId}");
        
        if (!file_exists($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $results = [];

        // Generate HLS streams for each quality
        foreach ($this->qualities as $quality => $settings) {
            $hlsPath = $this->generateHLS($videoPath, $quality, $settings, $outputDir);
            
            if ($hlsPath) {
                $results[$quality] = [
                    'playlist' => $hlsPath,
                    'resolution' => "{$settings['width']}x{$settings['height']}",
                    'bitrate' => $settings['bitrate'],
                ];
            }
        }

        // Generate master playlist
        $masterPlaylist = $this->generateMasterPlaylist($results, $outputDir);

        // Upload to CDN (Cloudflare Stream)
        $cdnUrl = $this->uploadToCDN($outputDir, $videoId);

        return [
            'video_id' => $videoId,
            'master_playlist' => $masterPlaylist,
            'cdn_url' => $cdnUrl,
            'qualities' => $results,
            'processed_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Generate HLS stream for specific quality
     */
    private function generateHLS(string $input, string $quality, array $settings, string $outputDir): string|bool
    {
        $outputFile = "{$outputDir}/{$quality}.m3u8";

        // FFmpeg command for HLS with encryption
        $command = sprintf(
            'ffmpeg -i %s -vf scale=%d:%d -c:v libx264 -b:v %dk -c:a aac -b:a 128k ' .
            '-hls_time 6 -hls_playlist_type vod -hls_segment_filename "%s/%s_%%03d.ts" ' .
            '-hls_key_info_file %s %s',
            escapeshellarg($input),
            $settings['width'],
            $settings['height'],
            $settings['bitrate'],
            $outputDir,
            $quality,
            $this->generateKeyInfoFile($outputDir),
            escapeshellarg($outputFile)
        );

        exec($command, $output, $returnCode);

        if ($returnCode === 0 && file_exists($outputFile)) {
            return $outputFile;
        }

        Log::error('HLS generation failed', [
            'quality' => $quality,
            'command' => $command,
            'output' => $output,
        ]);

        return false;
    }

    /**
     * Generate key info file for HLS encryption
     */
    private function generateKeyInfoFile(string $outputDir): string
    {
        $keyFile = "{$outputDir}/enc.key";
        $keyInfoFile = "{$outputDir}/enc.keyinfo";
        
        // Generate random key
        $key = bin2hex(random_bytes(16));
        file_put_contents($keyFile, hex2bin($key));

        // Key info format:
        // key URI
        // key file path
        // IV (optional)
        $keyInfo = sprintf(
            "%s\n%s\n%s",
            url("/api/v1/videos/key/{$outputDir}"),
            $keyFile,
            bin2hex(random_bytes(16))
        );

        file_put_contents($keyInfoFile, $keyInfo);

        return $keyInfoFile;
    }

    /**
     * Generate master playlist for adaptive bitrate
     */
    private function generateMasterPlaylist(array $qualities, string $outputDir): string
    {
        $masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n";

        foreach ($qualities as $quality => $data) {
            $masterPlaylist .= sprintf(
                "#EXT-X-STREAM-INF:BANDWIDTH=%d,RESOLUTION=%s\n%s.m3u8\n",
                $data['bitrate'] * 1000,
                $data['resolution'],
                $quality
            );
        }

        $masterFile = "{$outputDir}/master.m3u8";
        file_put_contents($masterFile, $masterPlaylist);

        return $masterFile;
    }

    /**
     * Upload processed video to CDN
     */
    private function uploadToCDN(string $localDir, int $videoId): string
    {
        // Upload to Cloudflare Stream or custom CDN
        $cdnPath = "videos/{$videoId}/";

        // Get all files in directory
        $files = glob("{$localDir}/*");

        foreach ($files as $file) {
            $filename = basename($file);
            Storage::disk('cdn')->put("{$cdnPath}{$filename}", file_get_contents($file));
        }

        // Return CDN URL
        return config('video.cdn_url') . $cdnPath . 'master.m3u8';
    }

    /**
     * Get streaming URL with token
     */
    public function getStreamingURL(int $userId, int $videoId): array
    {
        // Verify user has access
        if (!$this->verifyAccess($userId, $videoId)) {
            return ['error' => 'Access denied'];
        }

        $video = \DB::table('videos')->find($videoId);

        // Generate secure token
        $token = $this->generateStreamToken($userId, $videoId);

        return [
            'streaming_url' => "{$video->cdn_url}?token={$token}",
            'expires_in' => 3600, // 1 hour
            'qualities' => $this->getAvailableQualities($videoId),
        ];
    }

    /**
     * Generate secure streaming token
     */
    private function generateStreamToken(int $userId, int $videoId): string
    {
        $data = [
            'user_id' => $userId,
            'video_id' => $videoId,
            'expires' => time() + 3600,
        ];

        $signature = hash_hmac('sha256', json_encode($data), config('app.key'));

        return base64_encode(json_encode($data) . '.' . $signature);
    }

    /**
     * Verify user access to video
     */
    private function verifyAccess(int $userId, int $videoId): bool
    {
        // Check subscription
        $user = \DB::table('users')->find($userId);
        
        if (!$user->subscription_plan || $user->subscription_expires_at < now()) {
            return false;
        }

        // Check course enrollment
        $video = \DB::table('videos')
            ->join('course_content_items', 'videos.content_item_id', '=', 'course_content_items.id')
            ->join('topics', 'course_content_items.topic_id', '=', 'topics.id')
            ->join('units', 'topics.unit_id', '=', 'units.id')
            ->where('videos.id', $videoId)
            ->select('units.course_id')
            ->first();

        if (!$video) {
            return false;
        }

        $enrolled = \DB::table('course_enrollments')
            ->where('user_id', $userId)
            ->where('course_id', $video->course_id)
            ->exists();

        return $enrolled;
    }

    /**
     * Get available qualities for video
     */
    private function getAvailableQualities(int $videoId): array
    {
        $video = \DB::table('videos')->find($videoId);
        
        return [
            'auto' => 'Otomatik',
            '360p' => '360p',
            '480p' => '480p',
            '720p' => '720p HD',
            '1080p' => '1080p Full HD',
        ];
    }

    /**
     * Track video analytics
     */
    public function trackVideoAnalytics(int $userId, int $videoId, array $data): void
    {
        \DB::table('video_analytics')->insert([
            'user_id' => $userId,
            'video_id' => $videoId,
            'watch_duration' => $data['duration'] ?? 0,
            'quality_used' => $data['quality'] ?? 'auto',
            'buffering_count' => $data['buffering_count'] ?? 0,
            'completion_rate' => $data['completion_rate'] ?? 0,
            'device_type' => $data['device_type'] ?? 'unknown',
            'created_at' => now(),
        ]);
    }
}
