<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'merchant_oid',
        'amount',
        'currency',
        'status',
        'payment_method',
        'payment_type',
        'plan_type',
        'billing_period',
        'installment_count',
        'reference_no',
        'paid_at',
        'refunded_at',
        'failed_reason',
        'failed_code',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
        'installment_count' => 'integer',
    ];

    /**
     * User relationship
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Subscription relationship
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    /**
     * Check if payment is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if payment is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if payment is refunded
     */
    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    /**
     * Check if refundable
     */
    public function isRefundable(): bool
    {
        if (!$this->isCompleted()) {
            return false;
        }

        if ($this->paid_at->diffInDays(now()) > 14) {
            return false;
        }

        return true;
    }

    /**
     * Get formatted amount
     */
    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2) . ' ' . $this->currency;
    }

    /**
     * Get plan name
     */
    public function getPlanNameAttribute(): string
    {
        $plans = [
            'bronze' => 'Bronze',
            'plus' => 'Plus',
            'pro' => 'Pro',
        ];

        $periods = [
            'monthly' => 'Aylık',
            'quarterly' => '3 Aylık',
            'yearly' => 'Yıllık',
        ];

        return 'Terence ' . ($plans[$this->plan_type] ?? '') . ' - ' . ($periods[$this->billing_period] ?? '');
    }
}
