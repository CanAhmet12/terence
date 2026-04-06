<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class DynamicRateLimitMiddleware
{
    /**
     * Handle an incoming request with dynamic rate limiting
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $limiterName = 'api'): Response
    {
        $key = $this->resolveRequestSignature($request);

        if (RateLimiter::tooManyAttempts($key, $this->getMaxAttempts($limiterName))) {
            return $this->buildRateLimitResponse($request, $key, $limiterName);
        }

        RateLimiter::hit($key, $this->getDecaySeconds($limiterName));

        $response = $next($request);

        return $this->addRateLimitHeaders($response, $key, $limiterName);
    }

    /**
     * Resolve request signature
     */
    protected function resolveRequestSignature(Request $request): string
    {
        $user = $request->user();
        
        if ($user) {
            return "user:{$user->id}";
        }

        return "ip:{$request->ip()}";
    }

    /**
     * Get max attempts based on limiter name
     */
    protected function getMaxAttempts(string $limiterName): int
    {
        return match($limiterName) {
            'auth' => 5,
            'payment' => 3,
            'upload' => 10,
            'ai' => 10,
            'exam' => 10,
            'questions' => 120,
            'admin' => 120,
            'search' => 30,
            'live_lesson' => 5,
            default => 60,
        };
    }

    /**
     * Get decay time in seconds
     */
    protected function getDecaySeconds(string $limiterName): int
    {
        return match($limiterName) {
            'auth' => 60,
            'payment' => 60,
            'upload' => 60,
            'ai' => 3600,
            'exam' => 3600,
            'questions' => 60,
            'admin' => 60,
            'search' => 60,
            'live_lesson' => 3600,
            default => 60,
        };
    }

    /**
     * Build rate limit exceeded response
     */
    protected function buildRateLimitResponse(Request $request, string $key, string $limiterName): Response
    {
        $retryAfter = RateLimiter::availableIn($key);

        return response()->json([
            'error' => [
                'code' => 'RATE_LIMIT_EXCEEDED',
                'message' => $this->getRateLimitMessage($limiterName),
                'retry_after' => $retryAfter,
            ]
        ], 429, [
            'Retry-After' => $retryAfter,
            'X-RateLimit-Limit' => $this->getMaxAttempts($limiterName),
            'X-RateLimit-Remaining' => 0,
        ]);
    }

    /**
     * Get rate limit message
     */
    protected function getRateLimitMessage(string $limiterName): string
    {
        return match($limiterName) {
            'auth' => 'Çok fazla giriş denemesi. Lütfen bekleyin.',
            'payment' => 'Ödeme işlemi için çok fazla istek.',
            'upload' => 'Çok fazla dosya yükleme isteği.',
            'ai' => 'AI koç limitiniz doldu.',
            'exam' => 'Çok fazla deneme başlatma isteği.',
            'questions' => 'Çok hızlı soru çözüyorsunuz.',
            'live_lesson' => 'Çok fazla canlı ders başlatma isteği.',
            default => 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
        };
    }

    /**
     * Add rate limit headers to response
     */
    protected function addRateLimitHeaders(Response $response, string $key, string $limiterName): Response
    {
        $maxAttempts = $this->getMaxAttempts($limiterName);
        $remainingAttempts = RateLimiter::remaining($key, $maxAttempts);

        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => max(0, $remainingAttempts),
        ]);

        return $response;
    }
}
