<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamTemplateQuestion extends Model
{
    protected $fillable = [
        'exam_template_id',
        'question_id',
        'sort_order',
        'section',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ExamTemplate::class, 'exam_template_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
