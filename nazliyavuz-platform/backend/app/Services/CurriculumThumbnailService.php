<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Müfredat video kapakları: YouTube önizleme URL’si + yüklenen görseli (GD ile) sıkıştırıp public storage’a yazar.
 */
class CurriculumThumbnailService
{
    private const MAX_EDGE = 1600;

    private const JPEG_QUALITY = 86;

    public function extractYouTubeId(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }
        $patterns = [
            '~(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})~',
            '~youtube\.com/watch\?[^#]*\bv=([a-zA-Z0-9_-]{11})~',
        ];
        foreach ($patterns as $p) {
            if (preg_match($p, $url, $m)) {
                return $m[1];
            }
        }

        return null;
    }

    public function youtubeThumbnailFromVideoUrl(?string $videoUrl): ?string
    {
        $id = $videoUrl ? $this->extractYouTubeId($videoUrl) : null;

        return $id ? 'https://img.youtube.com/vi/'.$id.'/hqdefault.jpg' : null;
    }

    /**
     * Kapak görselini (mümkünse GD ile) JPEG’e çevirip kaydeder; olmazsa ham dosyayı public’e yazar.
     *
     * @return string Tam HTTP URL (/storage/...)
     */
    public function storeOptimizedCover(UploadedFile $file, Request $request, int $topicId): string
    {
        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $safe = 'cv_'.$topicId.'_'.time().'_'.Str::lower(Str::random(8)).'.jpg';
        $dir = 'curriculum_thumbnails';

        $tmpPath = $file->getRealPath();
        if ($this->gdAvailable() && $tmpPath && is_readable($tmpPath)) {
            $blob = $this->resizeFileToJpegMaxEdge($tmpPath);
            if ($blob !== null) {
                $path = $dir.'/'.$safe;
                Storage::disk('public')->put($path, $blob);

                return rtrim($request->getSchemeAndHttpHost(), '/').'/storage/'.$path;
            }
        }

        $fallback = $file->storeAs($dir, 'raw_'.$topicId.'_'.time().'_'.Str::lower(Str::random(6)).'.'.$ext, 'public');

        return rtrim($request->getSchemeAndHttpHost(), '/').'/storage/'.$fallback;
    }

    private function gdAvailable(): bool
    {
        return extension_loaded('gd')
            && function_exists('imagecreatetruecolor')
            && function_exists('getimagesize');
    }

    /**
     * En uzun kenarı self::MAX_EDGE ile sınırla, en-boy oranını koru, JPEG çıktı.
     */
    private function resizeFileToJpegMaxEdge(string $path): ?string
    {
        $info = @getimagesize($path);
        if (! is_array($info) || empty($info[0]) || empty($info[1]) || empty($info[2])) {
            return null;
        }
        $type = (int) $info[2];
        $src = match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => (defined('IMG_WEBP') && (imagetypes() & IMG_WEBP)) ? @imagecreatefromwebp($path) : null,
            default => null,
        };
        if ($src === false) {
            return null;
        }

        $w = imagesx($src);
        $h = imagesy($src);
        if ($w < 1 || $h < 1) {
            imagedestroy($src);

            return null;
        }

        $scale = min(1.0, self::MAX_EDGE / max($w, $h));
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $dst = imagescale($src, $nw, $nh, IMG_BILINEAR_FIXED);
        imagedestroy($src);
        if ($dst === false) {
            return null;
        }

        ob_start();
        if (function_exists('imageinterlace')) {
            imageinterlace($dst, true);
        }
        imagejpeg($dst, null, self::JPEG_QUALITY);
        imagedestroy($dst);
        $jpeg = ob_get_clean();

        return $jpeg !== false && $jpeg !== '' ? $jpeg : null;
    }
}
