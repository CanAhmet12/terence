<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiRequestLogger
{
    /**
     * Handle an incoming request
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $requestId = uniqid('req_', true);
        
        // Attach request ID to request
        $request->attributes->set('request_id', $requestId);

        // Log incoming request
        $this->logRequest($request, $requestId);

        // Process request
        $response = $next($request);

        // Calculate execution time
        $executionTime = round((microtime(true) - $startTime) * 1000, 2);

        // Log response
        $this->logResponse($request, $response, $requestId, $executionTime);

        // Add custom headers
        $response->headers->set('X-Request-ID', $requestId);
        $response->headers->set('X-Execution-Time', $executionTime . 'ms');

        return $response;
    }

    /**
     * Log incoming request
     */
    private function logRequest(Request $request, string $requestId): void
    {
        $user = $request->user();
        
        $context = [
            'request_id' => $requestId,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => $user?->id,
            'user_role' => $user?->role,
        ];

        // Log request body for non-GET requests (exclude sensitive data)
        if (!$request->isMethod('GET')) {
            $body = $request->except(['password', 'password_confirmation', 'current_password', 'token']);
            $context['body'] = $body;
        }

        // Log query parameters
        if ($request->query()) {
            $context['query'] = $request->query();
        }

        Log::channel('api')->info('API Request', $context);
    }

    /**
     * Log response
     */
    private function logResponse(Request $request, Response $response, string $requestId, float $executionTime): void
    {
        $statusCode = $response->getStatusCode();
        $logLevel = $this->getLogLevel($statusCode);

        $context = [
            'request_id' => $requestId,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status_code' => $statusCode,
            'execution_time_ms' => $executionTime,
            'memory_usage_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
        ];

        // Log response body for errors
        if ($statusCode >= 400) {
            $content = $response->getContent();
            if ($content) {
                $context['response'] = json_decode($content, true) ?? $content;
            }
        }

        // Performance warning
        if ($executionTime > 1000) {
            $context['warning'] = 'Slow API response (>1s)';
        }

        Log::channel('api')->{$logLevel}('API Response', $context);

        // Track slow queries separately
        if ($executionTime > 2000) {
            Log::channel('performance')->warning('Slow API Request', $context);
        }
    }

    /**
     * Get log level based on status code
     */
    private function getLogLevel(int $statusCode): string
    {
        return match(true) {
            $statusCode >= 500 => 'error',
            $statusCode >= 400 => 'warning',
            default => 'info',
        };
    }
}
