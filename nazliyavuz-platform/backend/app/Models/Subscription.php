<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'payment_id',
        'plan_type',
        'billing_period',
        'status',
        'started_at',
        'expires_at',
        'cancelled_at',
        'auto_renew',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'auto_renew' => 'boolean',
    ];

    /**
     * User relationship
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Payment relationship
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Check if subscription is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && 
               $this->expires_at->isFuture();
    }

    /**
     * Check if subscription is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Get days remaining
     */
    public function daysRemaining(): int
    {
        if ($this->isExpired()) {
            return 0;
        }

        return now()->diffInDays($this->expires_at, false);
    }

    /**
     * Cancel subscription
     */
    public function cancel(): void
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'auto_renew' => false,
        ]);
    }

    /**
     * Get plan features
     */
    public function getPlanFeatures(): array
    {
        return match($this->plan_type) {
            'bronze' => [
                'video_access' => true,
                'question_limit' => 1000,
                'exam_limit' => 10,
                'ai_coach_limit' => 20,
                'live_lessons' => false,
                'priority_support' => false,
            ],
            'plus' => [
                'video_access' => true,
                'question_limit' => 5000,
                'exam_limit' => 50,
                'ai_coach_limit' => 50,
                'live_lessons' => true,
                'priority_support' => false,
            ],
            'pro' => [
                'video_access' => true,
                'question_limit' => -1, // Unlimited
                'exam_limit' => -1, // Unlimited
                'ai_coach_limit' => 100,
                'live_lessons' => true,
                'priority_support' => true,
            ],
            default => [
                'video_access' => false,
                'question_limit' => 100,
                'exam_limit' => 2,
                'ai_coach_limit' => 10,
                'live_lessons' => false,
                'priority_support' => false,
            ],
        };
    }

    /**
     * Check if user has access to feature
     */
    public function hasFeature(string $feature): bool
    {
        $features = $this->getPlanFeatures();
        return $features[$feature] ?? false;
    }

    /**
     * Get usage limits
     */
    public function getUsageLimit(string $resource): int
    {
        $features = $this->getPlanFeatures();
        return $features["{$resource}_limit"] ?? 0;
    }
}
