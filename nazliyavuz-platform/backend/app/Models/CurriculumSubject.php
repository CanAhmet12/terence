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

    /**
     * Kullanıcının grade ve exam_type'ına göre dersleri filtrele.
     * DB'de grade STRING ('8') saklanıyor, user.grade INTEGER (8) gelebilir.
     */
    public function scopeForUser($query, ?string $grade, ?string $examType)
    {
        // Her iki formatta da eşleştir: "8" ve 8
        $gradeStr = $grade ? (string) intval($grade) : null;

        return $query->where('is_active', true)
            ->where(function ($q) use ($grade, $gradeStr) {
                $q->where('grade', 'all')
                  ->orWhere('grade', $grade)
                  ->orWhere('grade', $gradeStr);
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
