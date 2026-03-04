<?php

namespace App\Services;

use App\Models\User;
use App\Models\Reservation;
use App\Models\Category;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AdminAnalyticsService
{
    protected $cacheTimeout = 300; // 5 minutes

    /**
     * Get comprehensive dashboard statistics
     */
    public function getDashboardStats(): array
    {
        return Cache::remember('admin_dashboard_stats', $this->cacheTimeout, function () {
            return [
                'users' => $this->getUserStats(),
                'reservations' => $this->getReservationStats(),
                'revenue' => $this->getRevenueStats(),
                'growth' => $this->getGrowthStats(),
                'performance' => $this->getPerformanceStats(),
            ];
        });
    }

    /**
     * Get user statistics
     */
    private function getUserStats(): array
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $suspendedUsers = User::where('status', 'suspended')->count();
        $teachers = User::where('role', 'teacher')->count();
        $students = User::where('role', 'student')->count();
        $pendingTeachers = User::where('role', 'teacher')
            ->where('teacher_status', 'pending')
            ->count();

        return [
            'total' => $totalUsers,
            'active' => $activeUsers,
            'suspended' => $suspendedUsers,
            'teachers' => $teachers,
            'students' => $students,
            'pending_teachers' => $pendingTeachers,
            'active_percentage' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 2) : 0,
        ];
    }

    /**
     * Get reservation statistics
     */
    private function getReservationStats(): array
    {
        $totalReservations = Reservation::count();
        $pendingReservations = Reservation::where('status', 'pending')->count();
        $confirmedReservations = Reservation::where('status', 'confirmed')->count();
        $completedReservations = Reservation::where('status', 'completed')->count();
        $cancelledReservations = Reservation::where('status', 'cancelled')->count();

        return [
            'total' => $totalReservations,
            'pending' => $pendingReservations,
            'confirmed' => $confirmedReservations,
            'completed' => $completedReservations,
            'cancelled' => $cancelledReservations,
            'completion_rate' => $totalReservations > 0 ? round(($completedReservations / $totalReservations) * 100, 2) : 0,
        ];
    }

    /**
     * Get revenue statistics
     */
    private function getRevenueStats(): array
    {
        $totalRevenue = Reservation::where('status', 'completed')->sum('price') ?? 0;
        $monthlyRevenue = Reservation::where('status', 'completed')
            ->where('created_at', '>=', now()->subMonth())
            ->sum('price') ?? 0;
        $weeklyRevenue = Reservation::where('status', 'completed')
            ->where('created_at', '>=', now()->subWeek())
            ->sum('price') ?? 0;
        $dailyRevenue = Reservation::where('status', 'completed')
            ->whereDate('created_at', today())
            ->sum('price') ?? 0;

        return [
            'total' => $totalRevenue,
            'monthly' => $monthlyRevenue,
            'weekly' => $weeklyRevenue,
            'daily' => $dailyRevenue,
            'average_per_reservation' => $this->getAverageRevenuePerReservation(),
        ];
    }

    /**
     * Get growth statistics
     */
    private function getGrowthStats(): array
    {
        $userGrowth = $this->getUserGrowthData();
        $reservationGrowth = $this->getReservationGrowthData();
        $revenueGrowth = $this->getRevenueGrowthData();

        return [
            'users' => $userGrowth,
            'reservations' => $reservationGrowth,
            'revenue' => $revenueGrowth,
        ];
    }

    /**
     * Get performance statistics
     */
    private function getPerformanceStats(): array
    {
        $topTeachers = $this->getTopTeachers();
        $categoryStats = $this->getCategoryStats();
        $recentActivities = $this->getRecentActivities();

        return [
            'top_teachers' => $topTeachers,
            'categories' => $categoryStats,
            'recent_activities' => $recentActivities,
        ];
    }

    /**
     * Get user growth data for the last 12 months
     */
    private function getUserGrowthData(): array
    {
        $data = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $data[] = [
                'month' => $date->format('M Y'),
                'users' => User::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'teachers' => User::where('role', 'teacher')
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'students' => User::where('role', 'student')
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        }
        return $data;
    }

    /**
     * Get reservation growth data for the last 30 days
     */
    private function getReservationGrowthData(): array
    {
        $data = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $data[] = [
                'date' => $date->format('Y-m-d'),
                'reservations' => Reservation::whereDate('created_at', $date)->count(),
                'completed' => Reservation::where('status', 'completed')
                    ->whereDate('created_at', $date)
                    ->count(),
            ];
        }
        return $data;
    }

    /**
     * Get revenue growth data for the last 30 days
     */
    private function getRevenueGrowthData(): array
    {
        $data = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $data[] = [
                'date' => $date->format('Y-m-d'),
                'revenue' => Reservation::where('status', 'completed')
                    ->whereDate('created_at', $date)
                    ->sum('price') ?? 0,
            ];
        }
        return $data;
    }

    /**
     * Get top performing teachers
     */
    private function getTopTeachers(): array
    {
        return DB::table('users')
            ->join('teachers', 'users.id', '=', 'teachers.user_id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'teachers.rating_avg',
                'teachers.rating_count',
                DB::raw('COUNT(reservations.id) as total_lessons')
            )
            ->leftJoin('reservations', function ($join) {
                $join->on('users.id', '=', 'reservations.teacher_id')
                     ->where('reservations.status', '=', 'completed');
            })
            ->where('users.role', 'teacher')
            ->where('users.teacher_status', 'approved')
            ->groupBy('users.id', 'users.name', 'users.email', 'teachers.rating_avg', 'teachers.rating_count')
            ->orderBy('teachers.rating_avg', 'desc')
            ->orderBy('total_lessons', 'desc')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Get category statistics
     */
    private function getCategoryStats(): array
    {
        return Category::withCount('reservations')
            ->orderBy('reservations_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'reservations_count' => $category->reservations_count ?? 0,
                ];
            })
            ->toArray();
    }

    /**
     * Get recent activities
     */
    private function getRecentActivities(): array
    {
        return AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'user_name' => $log->user->name ?? 'Sistem',
                    'created_at' => $log->created_at,
                ];
            })
            ->toArray();
    }

    /**
     * Get average revenue per reservation
     */
    private function getAverageRevenuePerReservation(): float
    {
        $completedReservations = Reservation::where('status', 'completed')->count();
        $totalRevenue = Reservation::where('status', 'completed')->sum('price') ?? 0;
        
        return $completedReservations > 0 ? round($totalRevenue / $completedReservations, 2) : 0;
    }

    /**
     * Clear analytics cache
     */
    public function clearCache(): void
    {
        Cache::forget('admin_dashboard_stats');
    }

    /**
     * Get real-time statistics (not cached)
     */
    public function getRealTimeStats(): array
    {
        return [
            'online_users' => $this->getOnlineUsersCount(),
            'pending_approvals' => $this->getPendingApprovalsCount(),
            'system_health' => $this->getSystemHealthStatus(),
        ];
    }

    /**
     * Get online users count (simplified implementation)
     */
    private function getOnlineUsersCount(): int
    {
        // This would typically check a sessions table or cache
        // For now, return a placeholder
        return User::where('last_activity_at', '>=', now()->subMinutes(15))->count();
    }

    /**
     * Get pending approvals count
     */
    private function getPendingApprovalsCount(): int
    {
        return User::where('role', 'teacher')
            ->where('teacher_status', 'pending')
            ->count();
    }

    /**
     * Get system health status
     */
    private function getSystemHealthStatus(): array
    {
        return [
            'database' => $this->checkDatabaseHealth(),
            'cache' => $this->checkCacheHealth(),
            'storage' => $this->checkStorageHealth(),
        ];
    }

    /**
     * Check database health
     */
    private function checkDatabaseHealth(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check cache health
     */
    private function checkCacheHealth(): bool
    {
        try {
            Cache::put('health_check', 'ok', 1);
            return Cache::get('health_check') === 'ok';
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check storage health
     */
    private function checkStorageHealth(): bool
    {
        try {
            return is_writable(storage_path());
        } catch (\Exception $e) {
            return false;
        }
    }
}
