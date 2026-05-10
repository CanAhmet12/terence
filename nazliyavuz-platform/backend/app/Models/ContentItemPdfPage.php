<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentItemPdfPage extends Model
{
    protected $fillable = ['content_item_id', 'page_number', 'path'];

    protected $casts = [
        'content_item_id' => 'integer',
        'page_number' => 'integer',
    ];

    public function contentItem(): BelongsTo
    {
        return $this->belongsTo(ContentItem::class);
    }
}
