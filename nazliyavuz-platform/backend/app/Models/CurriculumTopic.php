<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumTopic extends Model
{
    protected $fillable = [
        'unit_id', 'title', 'description',
        'meb_code', 'sort_order', 'is_active', 'linked_topic_id',
    ];

    protected $casts = [
        'is_active'       => 'boolean',
        'sort_order'      => 'integer',
        'linked_topic_id' => 'integer',
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(CurriculumUnit::class, 'unit_id');
    }

    // Mevcut topics tablosuna bağlantı (içerik için)
    public function linkedTopic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'linked_topic_id');
    }

    // Bu konunun öğrenci ilerlemesi
    public function progress(): HasMany
    {
        return $this->hasMany(CurriculumTopicProgress::class, 'topic_id');
    }

    public function toApiArray(?int $userId = null): array
    {
        $data = [
            'id'              => $this->id,
            'unit_id'         => $this->unit_id,
            'title'           => $this->title,
            'description'     => $this->description,
            'meb_code'        => $this->meb_code,
            'sort_order'      => $this->sort_order,
            'linked_topic_id' => $this->linked_topic_id,
            'status'          => 'not_started',
        ];

        // İçerik bağlantısı varsa içerikleri de ekle
        if ($this->relationLoaded('linkedTopic') && $this->linkedTopic) {
            $lt = $this->linkedTopic;
            if ($lt->relationLoaded('contentItems')) {
                $data['content_items'] = $lt->contentItems->map(function ($ci) {
                    return [
                        'id'    => $ci->id,
                        'type'  => $ci->type,
                        'title' => $ci->title,
                        'url'   => $ci->url,
                        'is_free' => $ci->is_free,
                        'duration_seconds' => $ci->duration_seconds,
                    ];
                })->values()->toArray();
            }
        }

        return $data;
    }
}
