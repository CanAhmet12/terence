<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Badge extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'tier',
        'icon_url',
        'requirements',
        'points',
        'is_active',
    ];

    protected $casts = [
        'requirements' => 'array',
        'is_active' => 'boolean',
        'points' => 'integer',
    ];

    /**
     * Users who earned this badge
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_badges')
            ->withPivot(['earned_at', 'progress', 'metadata'])
            ->withTimestamps();
    }

    /**
     * Get badge tier color
     */
    public function getTierColorAttribute(): string
    {
        return match($this->tier) {
            'bronze' => '#CD7F32',
            'silver' => '#C0C0C0',
            'gold' => '#FFD700',
            'platinum' => '#E5E4E2',
            default => '#808080',
        };
    }
}
