<?php

namespace App\Models;

use App\Services\CurriculumThumbnailService;
use Illuminate\Database\Eloquent\Model;

class ContentItem extends Model
{
    protected $fillable = ['topic_id', 'type', 'title', 'url', 'thumbnail_url', 'duration_seconds', 'size_bytes', 'sort_order', 'is_free', 'is_active', 'description'];

    protected $casts = ['is_free' => 'boolean', 'is_active' => 'boolean'];

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function progress()
    {
        return $this->hasMany(StudentProgress::class);
    }

    public function video()
    {
        return $this->hasOne(Video::class, 'content_item_id');
    }

    /**
     * Video kartları için: content_items.thumbnail_url > Video.thumbnail_url > YouTube otomatik.
     */
    public function resolvedVideoDisplayThumbnail(): ?string
    {
        $direct = isset($this->thumbnail_url) ? trim((string) $this->thumbnail_url) : '';
        if ($direct !== '') {
            return $direct;
        }
        $v = $this->relationLoaded('video') ? $this->video : $this->video()->first();
        if ($v && ! empty($v->thumbnail_url)) {
            return $v->thumbnail_url;
        }

        return app(CurriculumThumbnailService::class)->youtubeThumbnailFromVideoUrl($this->url);
    }
}
