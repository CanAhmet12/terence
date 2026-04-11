<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumUnit extends Model
{
    protected $fillable = [
        'subject_id', 'title', 'description',
        'meb_code', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(CurriculumSubject::class, 'subject_id');
    }

    public function topics(): HasMany
    {
        return $this->hasMany(CurriculumTopic::class, 'unit_id')->orderBy('sort_order');
    }

    public function toApiArray(bool $withTopics = false): array
    {
        $data = [
            'id'          => $this->id,
            'subject_id'  => $this->subject_id,
            'title'       => $this->title,
            'description' => $this->description,
            'meb_code'    => $this->meb_code,
            'sort_order'  => $this->sort_order,
        ];

        if ($withTopics) {
            $data['topics'] = $this->topics->map(fn($t) => $t->toApiArray())->values()->toArray();
        }

        return $data;
    }
}
