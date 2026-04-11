<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumSubject extends Model
{
    protected $fillable = [
        'name', 'slug', 'icon', 'color',
        'grade', 'exam_type', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function units(): HasMany
    {
        return $this->hasMany(CurriculumUnit::class, 'subject_id')->orderBy('sort_order');
    }

    // Filtreleme: kullanıcının grade ve exam_type'ına göre dersleri getir
    public function scopeForUser($query, ?string $grade, ?string $examType)
    {
        return $query->where('is_active', true)
            ->where(function ($q) use ($grade) {
                $q->where('grade', 'all')
                  ->orWhere('grade', $grade);
            })
            ->where(function ($q) use ($examType) {
                $q->where('exam_type', 'all')
                  ->orWhere('exam_type', $examType)
                  ->orWhere('exam_type', 'Genel');
            })
            ->orderBy('sort_order');
    }

    public function toApiArray(bool $withUnits = false): array
    {
        $data = [
            'id'         => $this->id,
            'name'       => $this->name,
            'slug'       => $this->slug,
            'icon'       => $this->icon,
            'color'      => $this->color,
            'grade'      => $this->grade,
            'exam_type'  => $this->exam_type,
            'sort_order' => $this->sort_order,
        ];

        if ($withUnits) {
            $data['units'] = $this->units->map(fn($u) => $u->toApiArray(true))->values()->toArray();
        }

        return $data;
    }
}
