<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamTemplate extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'exam_type',
        'grade',
        'duration_minutes',
        'description',
        'is_active',
        'sort_order',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function templateQuestions(): HasMany
    {
        return $this->hasMany(ExamTemplateQuestion::class);
    }
}
