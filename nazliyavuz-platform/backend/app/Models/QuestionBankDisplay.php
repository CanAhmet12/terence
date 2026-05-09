<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionBankDisplay extends Model
{
    protected $fillable = [
        'subject',
        'grade',
        'badge_label',
        'year_label',
        'brand_label',
        'title_override',
        'footer_label',
        'cta_label',
        'cover_hex',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'grade' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];
}
