<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class SecurityLogger
{
    /**
     * Log authentication attempt
     */
    public function logAuthAttempt(string $email, bool $success, ?string $reason = null, ?Request $request = null): void
    {
        $context = [
            'email' => $email,
            'success' => $success,
            'ip' => $request?->ip() ?? request()->ip(),
            'user_agent' => $request?->userAgent() ?? request()->userAgent(),
        ];

        if (!$success && $reason) {
            $context['failure_reason'] = $reason;
        }

        $level = $success ? 'info' : 'warning';
        Log::channel('security')->{$level}('Authentication Attempt', $context);
    }

    /**
     * Log suspicious activity
     */
    public function logSuspiciousActivity(string $type, string $description, array $context = []): void
    {
        Log::channel('security')->warning('Suspicious Activity Detected', array_merge([
            'type' => $type,
            'description' => $description,
            'ip' => request()->ip(),
            'user_id' => auth()->id(),
            'url' => request()->fullUrl(),
        ], $context));
    }

    /**
     * Log rate limit exceeded
     */
    public function logRateLimitExceeded(string $limiter, string $key, int $retryAfter): void
    {
        Log::channel('security')->warning('Rate Limit Exceeded', [
            'limiter' => $limiter,
            'key' => $key,
            'retry_after' => $retryAfter,
            'ip' => request()->ip(),
            'url' => request()->fullUrl(),
        ]);
    }

    /**
     * Log unauthorized access attempt
     */
    public function logUnauthorizedAccess(string $resource, ?string $requiredRole = null): void
    {
        Log::channel('security')->warning('Unauthorized Access Attempt', [
            'resource' => $resource,
            'required_role' => $requiredRole,
            'user_id' => auth()->id(),
            'user_role' => auth()->user()?->role,
            'ip' => request()->ip(),
            'url' => request()->fullUrl(),
        ]);
    }

    /**
     * Log password change
     */
    public function logPasswordChange(int $userId, bool $success): void
    {
        Log::channel('security')->info('Password Change', [
            'user_id' => $userId,
            'success' => $success,
            'ip' => request()->ip(),
        ]);
    }

    /**
     * Log token refresh
     */
    public function logTokenRefresh(int $userId, string $deviceId = null): void
    {
        Log::channel('security')->info('Token Refresh', [
            'user_id' => $userId,
            'device_id' => $deviceId,
            'ip' => request()->ip(),
        ]);
    }

    /**
     * Log admin action
     */
    public function logAdminAction(string $action, array $context = []): void
    {
        Log::channel('admin')->info('Admin Action', array_merge([
            'action' => $action,
            'admin_id' => auth()->id(),
            'ip' => request()->ip(),
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Log data export
     */
    public function logDataExport(string $type, int $recordCount): void
    {
        Log::channel('admin')->info('Data Export', [
            'type' => $type,
            'record_count' => $recordCount,
            'user_id' => auth()->id(),
            'ip' => request()->ip(),
        ]);
    }

    /**
     * Log failed validation (potential attack)
     */
    public function logFailedValidation(string $endpoint, array $errors): void
    {
        Log::channel('security')->info('Validation Failed', [
            'endpoint' => $endpoint,
            'errors' => $errors,
            'ip' => request()->ip(),
            'user_id' => auth()->id(),
        ]);
    }

    /**
     * Log SQL injection attempt
     */
    public function logSqlInjectionAttempt(string $input, string $field): void
    {
        Log::channel('security')->critical('SQL Injection Attempt Detected', [
            'field' => $field,
            'input' => $input,
            'ip' => request()->ip(),
            'user_id' => auth()->id(),
            'url' => request()->fullUrl(),
        ]);
    }

    /**
     * Log XSS attempt
     */
    public function logXssAttempt(string $input, string $field): void
    {
        Log::channel('security')->critical('XSS Attempt Detected', [
            'field' => $field,
            'input' => $input,
            'ip' => request()->ip(),
            'user_id' => auth()->id(),
            'url' => request()->fullUrl(),
        ]);
    }
}
