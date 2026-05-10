<?php

namespace App\Jobs;

use App\Models\ContentItem;
use App\Models\ContentItemPdfPage;
use App\Services\CacheService;
use App\Services\PdfPageRasterService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class ProcessContentItemPdfPagesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 700;

    public function __construct(public int $contentItemId)
    {
    }

    public function handle(PdfPageRasterService $raster, CacheService $cache): void
    {
        $item = ContentItem::query()->with(['topic.unit'])->find($this->contentItemId);
        if (! $item || $item->type !== 'pdf') {
            return;
        }

        $rel = $item->storage_path;
        if ($rel === null || $rel === '') {
            Log::info('PDF sayfa işleme atlandı (storage_path yok)', ['id' => $this->contentItemId]);

            return;
        }

        try {
            ContentItemPdfPage::where('content_item_id', $item->id)->delete();
            $paths = $raster->rasterizeToPublicDisk($rel, $item->id);
            $base = rtrim(URL::to('/'), '/');
            $firstThumb = null;
            foreach ($paths as $i => $path) {
                $pageNum = $i + 1;
                ContentItemPdfPage::create([
                    'content_item_id' => $item->id,
                    'page_number' => $pageNum,
                    'path' => $path,
                ]);
                if ($pageNum === 1) {
                    $firstThumb = $base.'/storage/'.$path;
                }
            }
            if ($firstThumb !== null) {
                $item->thumbnail_url = $firstThumb;
                $item->save();
            }
            if ($item->topic && $item->topic->unit) {
                $cache->invalidateCourse((int) $item->topic->unit->course_id);
            }
        } catch (\Throwable $e) {
            Log::error('ProcessContentItemPdfPagesJob hata', [
                'id' => $this->contentItemId,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
