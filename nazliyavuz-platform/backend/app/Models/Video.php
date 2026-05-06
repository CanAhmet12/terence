<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    protected $fillable = [
        'content_item_id',
        'title',
        'description',
        'original_file_path',
        'cdn_url',
        'duration_seconds',
        'thumbnail_url',
        'drm_enabled',
        'is_processed',
        'available_qualities',
    ];

    protected $casts = [
        'drm_enabled' => 'boolean',
        'is_processed' => 'boolean',
        'available_qualities' => 'array',
    ];

    public function contentItem()
    {
        return $this->belongsTo(ContentItem::class, 'content_item_id');
    }
}
