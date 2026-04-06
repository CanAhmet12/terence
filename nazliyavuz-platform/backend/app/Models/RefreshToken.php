<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RefreshToken extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'token',
        'device_name',
        'device_id',
        'ip_address',
        'user_agent',
        'expires_at',
        'last_used_at',
        'is_revoked',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'last_used_at' => 'datetime',
            'is_revoked' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the refresh token
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if token is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if token is valid (not expired and not revoked)
     */
    public function isValid(): bool
    {
        return !$this->is_revoked && !$this->isExpired();
    }

    /**
     * Revoke the token
     */
    public function revoke(): void
    {
        $this->update(['is_revoked' => true]);
    }

    /**
     * Mark token as used
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Generate a new refresh token
     */
    public static function generate(
        int $userId,
        ?string $deviceName = null,
        ?string $deviceId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        int $ttlDays = 30
    ): self {
        // Revoke old tokens for same device (rotation)
        if ($deviceId) {
            static::where('user_id', $userId)
                ->where('device_id', $deviceId)
                ->where('is_revoked', false)
                ->update(['is_revoked' => true]);
        }

        return static::create([
            'user_id' => $userId,
            'token' => static::generateUniqueToken(),
            'device_name' => $deviceName,
            'device_id' => $deviceId,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'expires_at' => now()->addDays($ttlDays),
        ]);
    }

    /**
     * Generate a unique token string
     */
    private static function generateUniqueToken(): string
    {
        do {
            $token = Str::random(128);
        } while (static::where('token', $token)->exists());

        return $token;
    }

    /**
     * Find by token string
     */
    public static function findByToken(string $token): ?self
    {
        return static::where('token', $token)->first();
    }

    /**
     * Clean up expired tokens
     */
    public static function cleanExpired(): int
    {
        return static::where('expires_at', '<', now())
            ->orWhere(function ($query) {
                $query->where('is_revoked', true)
                    ->where('updated_at', '<', now()->subDays(7));
            })
            ->delete();
    }

    /**
     * Revoke all tokens for a user
     */
    public static function revokeAllForUser(int $userId): void
    {
        static::where('user_id', $userId)
            ->where('is_revoked', false)
            ->update(['is_revoked' => true]);
    }

    /**
     * Revoke all tokens for a device
     */
    public static function revokeAllForDevice(int $userId, string $deviceId): void
    {
        static::where('user_id', $userId)
            ->where('device_id', $deviceId)
            ->where('is_revoked', false)
            ->update(['is_revoked' => true]);
    }
}
