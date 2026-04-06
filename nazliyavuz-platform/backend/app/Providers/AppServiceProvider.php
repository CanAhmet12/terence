<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register CacheService
        $this->app->singleton(\App\Services\CacheService::class, function ($app) {
            return new \App\Services\CacheService();
        });
        
        // Register SecurityLogger
        $this->app->singleton(\App\Services\SecurityLogger::class, function ($app) {
            return new \App\Services\SecurityLogger();
        });
        
        // Register PerformanceMonitor
        $this->app->singleton(\App\Services\PerformanceMonitor::class, function ($app) {
            return new \App\Services\PerformanceMonitor();
        });
        
        // Register PayTRService
        $this->app->singleton(\App\Services\PayTRService::class, function ($app) {
            return new \App\Services\PayTRService();
        });
        
        // Register GamificationService
        $this->app->singleton(\App\Services\GamificationService::class, function ($app) {
            return new \App\Services\GamificationService();
        });
        
        // Register SpacedRepetitionService
        $this->app->singleton(\App\Services\SpacedRepetitionService::class, function ($app) {
            return new \App\Services\SpacedRepetitionService();
        });
        
        // Register AICoachService
        $this->app->singleton(\App\Services\AICoachService::class, function ($app) {
            return new \App\Services\AICoachService();
        });
        
        // Register FCMService
        $this->app->singleton(\App\Services\FCMService::class, function ($app) {
            return new \App\Services\FCMService();
        });
        
        // Register ParentDashboardService
        $this->app->singleton(\App\Services\ParentDashboardService::class, function ($app) {
            return new \App\Services\ParentDashboardService();
        });
        
        // Register AnalyticsService
        $this->app->singleton(\App\Services\AnalyticsService::class, function ($app) {
            return new \App\Services\AnalyticsService();
        });
        
        // Register VideoDRMService
        $this->app->singleton(\App\Services\VideoDRMService::class, function ($app) {
            return new \App\Services\VideoDRMService();
        });
        
        // Register VideoStreamingService
        $this->app->singleton(\App\Services\VideoStreamingService::class, function ($app) {
            return new \App\Services\VideoStreamingService();
        });
        
        // Register MailService
        $this->app->singleton(\App\Services\MailService::class, function ($app) {
            return new \App\Services\MailService();
        });
        
        // Register PushNotificationService
        $this->app->singleton(\App\Services\PushNotificationService::class, function ($app) {
            return new \App\Services\PushNotificationService();
        });
        
        // Register RealTimeChatService
        $this->app->singleton(\App\Services\RealTimeChatService::class, function ($app) {
            return new \App\Services\RealTimeChatService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Assignment Observer for cache invalidation
        \App\Models\Assignment::observe(\App\Observers\AssignmentObserver::class);
        
        // Register Reservation Observer for cache invalidation and auto-calculations
        \App\Models\Reservation::observe(\App\Observers\ReservationObserver::class);
        
        // Configure Rate Limiters
        $this->configureRateLimiters();
    }

    /**
     * Configure API rate limiters
     */
    private function configureRateLimiters(): void
    {
        // General API rate limiter (default)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'error' => [
                            'code' => 'RATE_LIMIT_EXCEEDED',
                            'message' => 'Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyin.',
                            'retry_after' => $headers['Retry-After'] ?? 60,
                        ]
                    ], 429, $headers);
                });
        });

        // Authentication endpoints (strict)
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'error' => [
                            'code' => 'AUTH_RATE_LIMIT_EXCEEDED',
                            'message' => 'Çok fazla giriş denemesi. 1 dakika sonra tekrar deneyin.',
                            'retry_after' => $headers['Retry-After'] ?? 60,
                        ]
                    ], 429, $headers);
                });
        });

        // Question answering (moderate)
        RateLimiter::for('questions', function (Request $request) {
            return Limit::perMinute(120)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'error' => [
                            'code' => 'QUESTION_RATE_LIMIT_EXCEEDED',
                            'message' => 'Çok hızlı soru çözüyorsunuz. Biraz yavaşlayın.',
                            'retry_after' => $headers['Retry-After'] ?? 60,
                        ]
                    ], 429, $headers);
                });
        });

        // Exam endpoints (prevent abuse)
        RateLimiter::for('exam', function (Request $request) {
            return Limit::perHour(10)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'error' => [
                            'code' => 'EXAM_RATE_LIMIT_EXCEEDED',
                            'message' => 'Saatte maksimum 10 deneme başlatabilirsiniz.',
                            'retry_after' => $headers['Retry-After'] ?? 3600,
                        ]
                    ], 429, $headers);
                });
        });

        // File upload endpoints (bandwidth protection)
        RateLimiter::for('upload', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'error' => [
                            'code' => 'UPLOAD_RATE_LIMIT_EXCEEDED',
                            'message' => 'Çok fazla dosya yükleme isteği. Lütfen bekleyin.',
                            'retry_after' => $headers['Retry-After'] ?? 60,
                        ]
                    ], 429, $headers);
                });
        });

        // Admin endpoints (more lenient)
        RateLimiter::for('admin', function (Request $request) {
            return Limit::perMinute(120)
                ->by($request->user()?->id ?: $request->ip());
        });

        // Payment endpoints (critical)
        RateLimiter::for('payment', function (Request $request) {
            return Limit::perMinute(3)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'error' => [
                            'code' => 'PAYMENT_RATE_LIMIT_EXCEEDED',
                            'message' => 'Ödeme işlemi için çok fazla istek. Lütfen bekleyin.',
                            'retry_after' => $headers['Retry-After'] ?? 60,
                        ]
                    ], 429, $headers);
                });
        });

        // AI endpoints (resource intensive)
        RateLimiter::for('ai', function (Request $request) {
            $user = $request->user();
            
            // Premium users get more requests
            $limit = match($user?->subscription_plan ?? 'free') {
                'pro' => 100,
                'plus' => 50,
                'bronze' => 20,
                default => 10,
            };

            return Limit::perHour($limit)
                ->by($user?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) use ($limit) {
                    return response()->json([
                        'error' => [
                            'code' => 'AI_RATE_LIMIT_EXCEEDED',
                            'message' => "AI koç limitiniz doldu. Saatte maksimum {$limit} soru sorabilirsiniz.",
                            'suggestion' => 'Pro pakete geçerek limiti artırabilirsiniz.',
                            'retry_after' => $headers['Retry-After'] ?? 3600,
                        ]
                    ], 429, $headers);
                });
        });

        // Search endpoints
        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(30)
                ->by($request->user()?->id ?: $request->ip());
        });

        // Live lesson endpoints
        RateLimiter::for('live_lesson', function (Request $request) {
            return Limit::perHour(5)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'error' => [
                            'code' => 'LIVE_LESSON_RATE_LIMIT_EXCEEDED',
                            'message' => 'Saatte maksimum 5 canlı ders başlatabilirsiniz.',
                            'retry_after' => $headers['Retry-After'] ?? 3600,
                        ]
                    ], 429, $headers);
                });
        });
    }
}
