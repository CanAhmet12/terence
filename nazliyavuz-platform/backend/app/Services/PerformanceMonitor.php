<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PerformanceMonitor
{
    private array $metrics = [];
    private float $startTime;
    private int $startMemory;

    public function __construct()
    {
        $this->startTime = microtime(true);
        $this->startMemory = memory_get_usage(true);
    }

    /**
     * Start timing a specific operation
     */
    public function startTimer(string $key): void
    {
        $this->metrics[$key] = [
            'start_time' => microtime(true),
            'start_memory' => memory_get_usage(true),
        ];
    }

    /**
     * Stop timing an operation
     */
    public function stopTimer(string $key): ?array
    {
        if (!isset($this->metrics[$key])) {
            return null;
        }

        $metric = $this->metrics[$key];
        $duration = (microtime(true) - $metric['start_time']) * 1000;
        $memoryUsed = (memory_get_usage(true) - $metric['start_memory']) / 1024 / 1024;

        $this->metrics[$key] = [
            'duration_ms' => round($duration, 2),
            'memory_used_mb' => round($memoryUsed, 2),
        ];

        // Log slow operations
        if ($duration > 1000) {
            Log::channel('performance')->warning("Slow Operation: {$key}", $this->metrics[$key]);
        }

        return $this->metrics[$key];
    }

    /**
     * Record a metric
     */
    public function recordMetric(string $key, mixed $value): void
    {
        $this->metrics[$key] = $value;
    }

    /**
     * Get all metrics
     */
    public function getMetrics(): array
    {
        return array_merge($this->metrics, [
            'total_execution_time_ms' => round((microtime(true) - $this->startTime) * 1000, 2),
            'peak_memory_usage_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
        ]);
    }

    /**
     * Log performance summary
     */
    public function logSummary(string $context = 'Request'): void
    {
        $metrics = $this->getMetrics();
        
        $level = match(true) {
            $metrics['total_execution_time_ms'] > 5000 => 'error',
            $metrics['total_execution_time_ms'] > 2000 => 'warning',
            default => 'info',
        };

        Log::channel('performance')->{$level}("{$context} Performance", $metrics);
    }

    /**
     * Monitor database queries
     */
    public function enableQueryLogging(): void
    {
        DB::listen(function ($query) {
            $duration = $query->time;
            
            // Log slow queries
            if ($duration > 100) {
                Log::channel('database')->warning('Slow Query Detected', [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'duration_ms' => $duration,
                ]);
            }

            // Log all queries in debug mode
            if (config('app.debug')) {
                Log::channel('database')->debug('Database Query', [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'duration_ms' => $duration,
                ]);
            }
        });
    }

    /**
     * Monitor external API call
     */
    public function monitorExternalApi(string $service, callable $callback): mixed
    {
        $startTime = microtime(true);
        
        try {
            $result = $callback();
            $duration = (microtime(true) - $startTime) * 1000;

            Log::channel('external_api')->info("External API Call: {$service}", [
                'service' => $service,
                'duration_ms' => round($duration, 2),
                'success' => true,
            ]);

            return $result;
        } catch (\Exception $e) {
            $duration = (microtime(true) - $startTime) * 1000;

            Log::channel('external_api')->error("External API Call Failed: {$service}", [
                'service' => $service,
                'duration_ms' => round($duration, 2),
                'error' => $e->getMessage(),
                'success' => false,
            ]);

            throw $e;
        }
    }

    /**
     * Monitor cache performance
     */
    public function monitorCache(string $operation, string $key, callable $callback): mixed
    {
        $startTime = microtime(true);
        
        try {
            $result = $callback();
            $duration = (microtime(true) - $startTime) * 1000;
            $hit = $result !== null;

            Log::channel('cache')->debug("Cache {$operation}", [
                'key' => $key,
                'hit' => $hit,
                'duration_ms' => round($duration, 2),
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::channel('cache')->error("Cache {$operation} Failed", [
                'key' => $key,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Get system health metrics
     */
    public function getSystemHealth(): array
    {
        return [
            'memory' => [
                'current_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                'peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
                'limit_mb' => ini_get('memory_limit'),
            ],
            'cpu' => [
                'load_average' => sys_getloadavg(),
            ],
            'database' => [
                'connected' => $this->isDatabaseConnected(),
            ],
            'cache' => [
                'connected' => $this->isCacheConnected(),
            ],
        ];
    }

    /**
     * Check database connection
     */
    private function isDatabaseConnected(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check cache connection
     */
    private function isCacheConnected(): bool
    {
        try {
            \Cache::get('health_check');
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
