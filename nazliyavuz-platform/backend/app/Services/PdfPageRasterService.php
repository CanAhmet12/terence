<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

/**
 * PDF dosyasını JPEG sayfalarına böler (poppler pdftoppm veya Imagick).
 */
class PdfPageRasterService
{
    public const MAX_PAGES = 150;

    /**
     * @return list<string> Depo köküne göre göreli yollar (public disk), sıralı
     */
    public function rasterizeToPublicDisk(string $relativePdfPath, int $contentItemId): array
    {
        $disk = Storage::disk('public');
        if (! $disk->exists($relativePdfPath)) {
            throw new \RuntimeException('PDF bulunamadı.');
        }

        $absPdf = $disk->path($relativePdfPath);
        $dir = 'content_item_pages/'.$contentItemId;
        if ($disk->exists($dir)) {
            $disk->deleteDirectory($dir);
        }
        $disk->makeDirectory($dir);

        $paths = $this->rasterWithPdftoppm($absPdf, $disk, $dir);
        if ($paths !== []) {
            return $paths;
        }

        $paths = $this->rasterWithImagick($absPdf, $disk, $dir);
        if ($paths !== []) {
            return $paths;
        }

        throw new \RuntimeException('PDF sayfalara bölünemedi. Sunucuda poppler (pdftoppm) veya Imagick+Ghostscript kurulu olmalı.');
    }

    /**
     * @return list<string>
     */
    private function rasterWithPdftoppm(string $absPdf, \Illuminate\Contracts\Filesystem\Filesystem $disk, string $dir): array
    {
        $bin = $this->resolvePdftoppmBinary();
        if ($bin === null) {
            return [];
        }

        $prefix = $disk->path($dir.'/pg');
        $process = new Process([
            $bin,
            '-jpeg',
            '-r',
            '110',
            '-jpegopt',
            'quality=82',
            '-f',
            '1',
            '-l',
            (string) self::MAX_PAGES,
            $absPdf,
            $prefix,
        ]);
        $process->setTimeout(600);
        $process->run();

        if (! $process->isSuccessful()) {
            Log::warning('pdftoppm başarısız', ['output' => $process->getErrorOutput()]);

            return [];
        }

        $pattern = $disk->path($dir).DIRECTORY_SEPARATOR.'pg-*.jpg';
        $files = glob($pattern) ?: [];
        usort($files, function (string $a, string $b): int {
            return strnatcmp($a, $b);
        });

        $out = [];
        $n = 1;
        foreach ($files as $abs) {
            if ($n > self::MAX_PAGES) {
                break;
            }
            $rel = $dir.'/'.sprintf('%03d.jpg', $n);
            $targetAbs = $disk->path($rel);
            if ($abs !== $targetAbs) {
                File::move($abs, $targetAbs);
            }
            $out[] = $rel;
            $n++;
        }

        // Kalan pg-*.jpg temizliği
        foreach (glob($pattern) ?: [] as $left) {
            if (is_file($left)) {
                @unlink($left);
            }
        }

        return $out;
    }

    /**
     * @return list<string>
     */
    private function rasterWithImagick(string $absPdf, \Illuminate\Contracts\Filesystem\Filesystem $disk, string $dir): array
    {
        if (! class_exists(\Imagick::class)) {
            return [];
        }

        $out = [];
        try {
            $im = new \Imagick();
            $im->setResolution(110, 110);
            $im->readImage($absPdf);
            $n = 0;
            foreach ($im as $page) {
                if ($n >= self::MAX_PAGES) {
                    break;
                }
                $page->setImageFormat('jpeg');
                $page->setImageCompression(\Imagick::COMPRESSION_JPEG);
                $page->setImageCompressionQuality(82);
                $rel = $dir.'/'.sprintf('%03d.jpg', $n + 1);
                $page->writeImage($disk->path($rel));
                $out[] = $rel;
                $n++;
            }
            $im->clear();
            $im->destroy();
        } catch (\Throwable $e) {
            Log::warning('Imagick PDF raster başarısız', ['message' => $e->getMessage()]);

            return [];
        }

        return $out;
    }

    private function resolvePdftoppmBinary(): ?string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            return null;
        }

        $p = Process::fromShellCommandline('command -v pdftoppm 2>/dev/null');
        $p->run();
        $line = trim($p->getOutput());
        if ($line !== '' && is_executable($line)) {
            return $line;
        }

        foreach (['/usr/bin/pdftoppm', '/usr/local/bin/pdftoppm'] as $bin) {
            if (is_executable($bin)) {
                return $bin;
            }
        }

        return null;
    }
}
