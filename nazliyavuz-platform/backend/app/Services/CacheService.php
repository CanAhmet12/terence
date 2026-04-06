<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CacheService
{
    /**
     * Cache key prefixes
     */
    private const PREFIX = 'terence:';
    
    /**
     * Cache durations (in seconds)
     */
    private const DURATIONS = [
        'course_list' => 1800,      // 30 minutes
        'course_detail' => 3600,     // 1 hour
        'question_list' => 900,      // 15 minutes
        'user_profile' => 600,       // 10 minutes
        'exam_list' => 1800,         // 30 minutes
        'plan_today' => 300,         // 5 minutes
        'badges' => 3600,            // 1 hour
        'leaderboard' => 600,        // 10 minutes
        'stats' => 900,              // 15 minutes
        'categories' => 86400,       // 24 hours
        'achievements' => 43200,     // 12 hours
    ];

    /**
     * Get cache with automatic key generation
     */
    public function get(string $type, string $identifier, callable $callback, ?int $ttl = null)
    {
        $key = $this->makeKey($type, $identifier);
        $duration = $ttl ?? ($this->DURATIONS[$type] ?? 600);

        try {
            return Cache::remember($key, $duration, function () use ($callback, $key) {
                Log::debug("Cache miss for key: {$key}");
                return $callback();
            });
        } catch (\Exception $e) {
            Log::error("Cache error for key {$key}: " . $e->getMessage());
            return $callback(); // Fallback to direct call
        }
    }

    /**
     * Get from cache or return null
     */
    public function fetch(string $type, string $identifier)
    {
        $key = $this->makeKey($type, $identifier);
        return Cache::get($key);
    }

    /**
     * Put value into cache
     */
    public function put(string $type, string $identifier, $value, ?int $ttl = null): bool
    {
        $key = $this->makeKey($type, $identifier);
        $duration = $ttl ?? ($this->DURATIONS[$type] ?? 600);

        try {
            return Cache::put($key, $value, $duration);
        } catch (\Exception $e) {
            Log::error("Cache put error for key {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Forget specific cache key
     */
    public function forget(string $type, string $identifier): bool
    {
        $key = $this->makeKey($type, $identifier);
        
        try {
            return Cache::forget($key);
        } catch (\Exception $e) {
            Log::error("Cache forget error for key {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Forget all cache keys matching pattern
     */
    public function forgetByPattern(string $type, ?string $pattern = '*'): void
    {
        $baseKey = $this->makeKey($type, '');
        $fullPattern = $baseKey . $pattern;

        try {
            // For Redis
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $keys = $redis->keys($fullPattern);
                if (!empty($keys)) {
                    $redis->del($keys);
                    Log::info("Cleared " . count($keys) . " cache keys matching: {$fullPattern}");
                }
            }
            // For file/array cache (less efficient)
            else {
                Cache::flush(); // Nuclear option
                Log::warning("Cache flush called for pattern: {$fullPattern}");
            }
        } catch (\Exception $e) {
            Log::error("Cache pattern forget error: " . $e->getMessage());
        }
    }

    /**
     * Invalidate course-related caches
     */
    public function invalidateCourse(int $courseId): void
    {
        $this->forget('course_detail', (string)$courseId);
        $this->forgetByPattern('course_list');
        Log::info("Invalidated cache for course: {$courseId}");
    }

    /**
     * Invalidate user-related caches
     */
    public function invalidateUser(int $userId): void
    {
        $this->forget('user_profile', (string)$userId);
        $this->forget('plan_today', (string)$userId);
        $this->forgetByPattern('stats', "user:{$userId}:*");
        Log::info("Invalidated cache for user: {$userId}");
    }

    /**
     * Invalidate question-related caches
     */
    public function invalidateQuestions(): void
    {
        $this->forgetByPattern('question_list');
        Log::info("Invalidated question list caches");
    }

    /**
     * Invalidate leaderboard cache
     */
    public function invalidateLeaderboard(): void
    {
        $this->forgetByPattern('leaderboard');
        Log::info("Invalidated leaderboard cache");
    }

    /**
     * Warm up cache with common queries
     */
    public function warmup(): void
    {
        Log::info("Starting cache warmup...");

        try {
            // Warm up categories
            $this->get('categories', 'all', function () {
                return \App\Models\Category::with('subcategories')->get();
            });

            // Warm up badges
            $this->get('badges', 'all', function () {
                return \App\Models\Badge::all();
            });

            // Warm up achievements
            $this->get('achievements', 'all', function () {
                return \DB::table('achievements')->get();
            });

            Log::info("Cache warmup completed");
        } catch (\Exception $e) {
            Log::error("Cache warmup error: " . $e->getMessage());
        }
    }

    /**
     * Get cache statistics
     */
    public function stats(): array
    {
        try {
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $info = $redis->info();
                
                return [
                    'driver' => 'redis',
                    'connected' => true,
                    'used_memory' => $info['used_memory_human'] ?? 'N/A',
                    'total_keys' => $redis->dbSize(),
                    'hits' => $info['keyspace_hits'] ?? 0,
                    'misses' => $info['keyspace_misses'] ?? 0,
                    'hit_rate' => $this->calculateHitRate($info),
                ];
            }

            return [
                'driver' => config('cache.default'),
                'connected' => true,
            ];
        } catch (\Exception $e) {
            return [
                'driver' => config('cache.default'),
                'connected' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Clear all cache
     */
    public function clear(): bool
    {
        try {
            Cache::flush();
            Log::warning("All cache cleared");
            return true;
        } catch (\Exception $e) {
            Log::error("Cache clear error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Make cache key
     */
    private function makeKey(string $type, string $identifier): string
    {
        return self::PREFIX . $type . ':' . $identifier;
    }

    /**
     * Calculate hit rate
     */
    private function calculateHitRate(array $info): string
    {
        $hits = $info['keyspace_hits'] ?? 0;
        $misses = $info['keyspace_misses'] ?? 0;
        $total = $hits + $misses;

        if ($total === 0) {
            return '0%';
        }

        return round(($hits / $total) * 100, 2) . '%';
    }

    /**
     * Tag-based cache (for Redis/Memcached)
     */
    public function tags(array $tags): \Illuminate\Cache\TaggedCache
    {
        return Cache::tags(array_map(function ($tag) {
            return self::PREFIX . $tag;
        }, $tags));
    }
}
