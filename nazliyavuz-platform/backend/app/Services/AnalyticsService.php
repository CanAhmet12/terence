<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

/**
 * Advanced Analytics Service
 * Comprehensive metrics, charts, and export functionality
 */
class AnalyticsService
{
    /**
     * Get admin dashboard analytics
     */
    public function getAdminDashboard(): array
    {
        return Cache::remember('analytics:admin_dashboard', 300, function () {
            return [
                'overview' => $this->getOverviewMetrics(),
                'user_metrics' => $this->getUserMetrics(),
                'engagement_metrics' => $this->getEngagementMetrics(),
                'revenue_metrics' => $this->getRevenueMetrics(),
                'content_metrics' => $this->getContentMetrics(),
                'performance_metrics' => $this->getPerformanceMetrics(),
            ];
        });
    }

    /**
     * Get overview metrics
     */
    private function getOverviewMetrics(): array
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $last30Days = Carbon::today()->subDays(30);

        // Total users
        $totalUsers = User::count();
        $usersYesterday = User::where('created_at', '<', $today)->count();
        $userGrowth = $usersYesterday > 0 ? (($totalUsers - $usersYesterday) / $usersYesterday) * 100 : 0;

        // Active users
        $activeUsersToday = User::where('last_login_at', '>=', $today)->count();
        $activeUsersYesterday = User::whereBetween('last_login_at', [$yesterday, $today])->count();

        // Questions solved
        $questionsSolvedToday = DB::table('question_answers')
            ->where('created_at', '>=', $today)
            ->count();

        $questionsSolvedYesterday = DB::table('question_answers')
            ->whereBetween('created_at', [$yesterday, $today])
            ->count();

        // Revenue
        $revenueToday = DB::table('payments')
            ->where('status', 'completed')
            ->where('paid_at', '>=', $today)
            ->sum('amount');

        $revenueYesterday = DB::table('payments')
            ->where('status', 'completed')
            ->whereBetween('paid_at', [$yesterday, $today])
            ->sum('amount');

        return [
            'total_users' => $totalUsers,
            'user_growth_rate' => round($userGrowth, 2),
            'active_users_today' => $activeUsersToday,
            'active_users_yesterday' => $activeUsersYesterday,
            'questions_solved_today' => $questionsSolvedToday,
            'questions_solved_yesterday' => $questionsSolvedYesterday,
            'revenue_today' => round($revenueToday, 2),
            'revenue_yesterday' => round($revenueYesterday, 2),
        ];
    }

    /**
     * Get user metrics with detailed breakdown
     */
    private function getUserMetrics(): array
    {
        $totalUsers = User::count();

        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();

        $usersBySubscription = User::select('subscription_plan', DB::raw('count(*) as count'))
            ->groupBy('subscription_plan')
            ->pluck('count', 'subscription_plan')
            ->toArray();

        // New users trend (last 30 days)
        $newUsersTrend = User::where('created_at', '>=', Carbon::today()->subDays(30))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->date => $item->count];
            });

        // Active users (last 7 days)
        $activeUsers7Days = User::where('last_login_at', '>=', Carbon::today()->subDays(7))->count();
        $activeUsers30Days = User::where('last_login_at', '>=', Carbon::today()->subDays(30))->count();

        // Churn rate (users who haven't logged in for 30 days)
        $churnedUsers = User::where('last_login_at', '<', Carbon::today()->subDays(30))
            ->where('created_at', '<', Carbon::today()->subDays(30))
            ->count();
        $churnRate = $totalUsers > 0 ? ($churnedUsers / $totalUsers) * 100 : 0;

        return [
            'total_users' => $totalUsers,
            'users_by_role' => $usersByRole,
            'users_by_subscription' => $usersBySubscription,
            'active_users_7_days' => $activeUsers7Days,
            'active_users_30_days' => $activeUsers30Days,
            'churn_rate' => round($churnRate, 2),
            'new_users_trend' => $newUsersTrend,
        ];
    }

    /**
     * Get engagement metrics
     */
    private function getEngagementMetrics(): array
    {
        $last30Days = Carbon::today()->subDays(30);

        // Questions answered
        $totalQuestionsAnswered = DB::table('question_answers')
            ->where('created_at', '>=', $last30Days)
            ->count();

        $correctAnswers = DB::table('question_answers')
            ->where('created_at', '>=', $last30Days)
            ->where('is_correct', true)
            ->count();

        $overallAccuracy = $totalQuestionsAnswered > 0 
            ? ($correctAnswers / $totalQuestionsAnswered) * 100 
            : 0;

        // Exams
        $examsStarted = DB::table('exam_sessions')
            ->where('created_at', '>=', $last30Days)
            ->count();

        $examsCompleted = DB::table('exam_sessions')
            ->where('created_at', '>=', $last30Days)
            ->where('status', 'completed')
            ->count();

        $examCompletionRate = $examsStarted > 0 
            ? ($examsCompleted / $examsStarted) * 100 
            : 0;

        // Course enrollments
        $courseEnrollments = DB::table('course_enrollments')
            ->where('created_at', '>=', $last30Days)
            ->count();

        $courseCompletions = DB::table('course_enrollments')
            ->where('created_at', '>=', $last30Days)
            ->whereNotNull('completed_at')
            ->count();

        // Study time
        $totalStudyTime = DB::table('study_sessions')
            ->where('created_at', '>=', $last30Days)
            ->sum('duration_minutes');

        $avgStudyTimePerUser = User::where('last_login_at', '>=', $last30Days)
            ->count() > 0
            ? $totalStudyTime / User::where('last_login_at', '>=', $last30Days)->count()
            : 0;

        // Engagement by day
        $engagementTrend = DB::table('study_sessions')
            ->where('created_at', '>=', $last30Days)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(DISTINCT user_id) as active_users'),
                DB::raw('SUM(duration_minutes) as total_minutes')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'questions' => [
                'total_answered' => $totalQuestionsAnswered,
                'correct_answers' => $correctAnswers,
                'overall_accuracy' => round($overallAccuracy, 2),
            ],
            'exams' => [
                'started' => $examsStarted,
                'completed' => $examsCompleted,
                'completion_rate' => round($examCompletionRate, 2),
            ],
            'courses' => [
                'enrollments' => $courseEnrollments,
                'completions' => $courseCompletions,
            ],
            'study_time' => [
                'total_hours' => round($totalStudyTime / 60, 2),
                'avg_per_user_hours' => round($avgStudyTimePerUser / 60, 2),
            ],
            'engagement_trend' => $engagementTrend,
        ];
    }

    /**
     * Get revenue metrics
     */
    private function getRevenueMetrics(): array
    {
        $last30Days = Carbon::today()->subDays(30);

        // Total revenue
        $totalRevenue = DB::table('payments')
            ->where('status', 'completed')
            ->sum('amount');

        $revenue30Days = DB::table('payments')
            ->where('status', 'completed')
            ->where('paid_at', '>=', $last30Days)
            ->sum('amount');

        // Revenue by plan
        $revenueByPlan = DB::table('payments')
            ->where('status', 'completed')
            ->where('paid_at', '>=', $last30Days)
            ->select('plan_type', DB::raw('SUM(amount) as revenue'), DB::raw('COUNT(*) as count'))
            ->groupBy('plan_type')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->plan_type => [
                    'revenue' => round($item->revenue, 2),
                    'count' => $item->count,
                ]];
            });

        // Revenue trend
        $revenueTrend = DB::table('payments')
            ->where('status', 'completed')
            ->where('paid_at', '>=', $last30Days)
            ->select(
                DB::raw('DATE(paid_at) as date'),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as transactions')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Active subscriptions
        $activeSubscriptions = DB::table('subscriptions')
            ->where('status', 'active')
            ->where('expires_at', '>', Carbon::now())
            ->count();

        // MRR (Monthly Recurring Revenue)
        $monthlyRevenue = DB::table('subscriptions')
            ->where('status', 'active')
            ->where('expires_at', '>', Carbon::now())
            ->where('billing_period', 'monthly')
            ->join('payments', 'subscriptions.payment_id', '=', 'payments.id')
            ->sum('payments.amount');

        // ARPU (Average Revenue Per User)
        $totalPaidUsers = DB::table('payments')
            ->where('status', 'completed')
            ->distinct('user_id')
            ->count('user_id');

        $arpu = $totalPaidUsers > 0 ? $totalRevenue / $totalPaidUsers : 0;

        return [
            'total_revenue' => round($totalRevenue, 2),
            'revenue_last_30_days' => round($revenue30Days, 2),
            'revenue_by_plan' => $revenueByPlan,
            'revenue_trend' => $revenueTrend,
            'active_subscriptions' => $activeSubscriptions,
            'mrr' => round($monthlyRevenue, 2),
            'arpu' => round($arpu, 2),
            'conversion_rate' => $this->calculateConversionRate(),
        ];
    }

    /**
     * Get content metrics
     */
    private function getContentMetrics(): array
    {
        $totalCourses = DB::table('courses')->where('is_active', true)->count();
        $totalQuestions = DB::table('questions')->count();
        $totalExams = DB::table('exams')->where('is_active', true)->count();

        // Most popular courses
        $popularCourses = DB::table('course_enrollments')
            ->join('courses', 'course_enrollments.course_id', '=', 'courses.id')
            ->select('courses.id', 'courses.title', DB::raw('COUNT(*) as enrollment_count'))
            ->groupBy('courses.id', 'courses.title')
            ->orderBy('enrollment_count', 'desc')
            ->limit(10)
            ->get();

        // Most attempted questions
        $popularQuestions = DB::table('question_answers')
            ->select('question_id', DB::raw('COUNT(*) as attempt_count'))
            ->groupBy('question_id')
            ->orderBy('attempt_count', 'desc')
            ->limit(10)
            ->get();

        // Questions by difficulty distribution
        $questionsByDifficulty = DB::table('questions')
            ->select('difficulty', DB::raw('COUNT(*) as count'))
            ->groupBy('difficulty')
            ->pluck('count', 'difficulty')
            ->toArray();

        // Content completion rates
        $avgCourseCompletion = DB::table('course_enrollments')
            ->avg('completion_percentage');

        return [
            'total_courses' => $totalCourses,
            'total_questions' => $totalQuestions,
            'total_exams' => $totalExams,
            'popular_courses' => $popularCourses,
            'popular_questions' => $popularQuestions,
            'questions_by_difficulty' => $questionsByDifficulty,
            'avg_course_completion' => round($avgCourseCompletion ?? 0, 2),
        ];
    }

    /**
     * Get system performance metrics
     */
    private function getPerformanceMetrics(): array
    {
        $last24Hours = Carbon::now()->subHours(24);

        // API response times (from logs)
        $avgResponseTime = DB::table('api_request_logs')
            ->where('created_at', '>=', $last24Hours)
            ->avg('response_time_ms');

        // Error rate
        $totalRequests = DB::table('api_request_logs')
            ->where('created_at', '>=', $last24Hours)
            ->count();

        $errorRequests = DB::table('api_request_logs')
            ->where('created_at', '>=', $last24Hours)
            ->where('status_code', '>=', 500)
            ->count();

        $errorRate = $totalRequests > 0 ? ($errorRequests / $totalRequests) * 100 : 0;

        // Cache hit rate
        $cacheStats = app(CacheService::class)->stats();

        // Database query stats
        $slowQueries = DB::table('slow_query_log')
            ->where('created_at', '>=', $last24Hours)
            ->count();

        return [
            'avg_response_time_ms' => round($avgResponseTime ?? 0, 2),
            'total_api_requests' => $totalRequests,
            'error_rate' => round($errorRate, 2),
            'cache_hit_rate' => $cacheStats['hit_rate'] ?? 'N/A',
            'slow_queries_24h' => $slowQueries,
            'system_health' => $this->getSystemHealth(),
        ];
    }

    /**
     * Get user-specific analytics
     */
    public function getUserAnalytics(User $user): array
    {
        return Cache::remember("analytics:user:{$user->id}", 300, function () use ($user) {
            return [
                'overview' => $this->getUserOverview($user),
                'subject_performance' => $this->getUserSubjectPerformance($user),
                'study_time_analysis' => $this->getUserStudyTimeAnalysis($user),
                'progress_timeline' => $this->getUserProgressTimeline($user),
                'predictions' => $this->getUserPredictions($user),
            ];
        });
    }

    /**
     * Get user overview
     */
    private function getUserOverview(User $user): array
    {
        $last30Days = Carbon::today()->subDays(30);

        return [
            'total_questions' => DB::table('question_answers')->where('user_id', $user->id)->count(),
            'total_correct' => DB::table('question_answers')->where('user_id', $user->id)->where('is_correct', true)->count(),
            'overall_accuracy' => $this->calculateUserAccuracy($user->id),
            'total_exams' => DB::table('exam_sessions')->where('user_id', $user->id)->where('status', 'completed')->count(),
            'avg_exam_score' => DB::table('exam_sessions')->where('user_id', $user->id)->where('status', 'completed')->avg('score'),
            'total_study_hours' => round(($user->total_study_minutes ?? 0) / 60, 2),
            'current_level' => $user->level,
            'current_xp' => $user->xp,
            'current_streak' => DB::table('streaks')->where('user_id', $user->id)->where('type', 'daily_login')->value('current_count') ?? 0,
        ];
    }

    /**
     * Get subject performance with trends
     */
    private function getUserSubjectPerformance(User $user): array
    {
        $subjects = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->where('question_answers.user_id', $user->id)
            ->select(
                'questions.subject',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN question_answers.is_correct THEN 1 ELSE 0 END) as correct'),
                DB::raw('AVG(question_answers.time_spent_seconds) as avg_time')
            )
            ->groupBy('questions.subject')
            ->get();

        $performance = [];
        foreach ($subjects as $subject) {
            $accuracy = $subject->total > 0 ? ($subject->correct / $subject->total) * 100 : 0;
            
            $performance[$subject->subject] = [
                'total_questions' => $subject->total,
                'correct_answers' => $subject->correct,
                'accuracy_rate' => round($accuracy, 2),
                'avg_time_seconds' => round($subject->avg_time, 0),
                'trend' => $this->getSubjectTrend($user->id, $subject->subject),
                'weekly_progress' => $this->getSubjectWeeklyProgress($user->id, $subject->subject),
            ];
        }

        return $performance;
    }

    /**
     * Get study time analysis with patterns
     */
    private function getUserStudyTimeAnalysis(User $user): array
    {
        $last30Days = Carbon::today()->subDays(30);

        // Total study time
        $totalMinutes = DB::table('study_sessions')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $last30Days)
            ->sum('duration_minutes');

        // Daily average
        $studyDays = DB::table('study_sessions')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $last30Days)
            ->distinct('DATE(created_at)')
            ->count(DB::raw('DISTINCT DATE(created_at)'));

        $avgDailyMinutes = $studyDays > 0 ? $totalMinutes / $studyDays : 0;

        // By activity type
        $byActivityType = DB::table('study_sessions')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $last30Days)
            ->select('activity_type', DB::raw('SUM(duration_minutes) as minutes'))
            ->groupBy('activity_type')
            ->pluck('minutes', 'activity_type')
            ->toArray();

        // Peak study hours
        $peakHours = DB::table('study_sessions')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $last30Days)
            ->select(DB::raw('HOUR(started_at) as hour'), DB::raw('SUM(duration_minutes) as minutes'))
            ->groupBy('hour')
            ->orderBy('minutes', 'desc')
            ->limit(3)
            ->pluck('minutes', 'hour')
            ->toArray();

        // Study consistency (days studied / total days)
        $consistency = round(($studyDays / 30) * 100, 2);

        return [
            'total_hours_30_days' => round($totalMinutes / 60, 2),
            'avg_daily_minutes' => round($avgDailyMinutes, 0),
            'study_days_count' => $studyDays,
            'consistency_score' => $consistency,
            'by_activity_type' => $byActivityType,
            'peak_study_hours' => $peakHours,
        ];
    }

    /**
     * Get progress timeline (last 90 days)
     */
    private function getUserProgressTimeline(User $user): array
    {
        $last90Days = Carbon::today()->subDays(90);

        $timeline = [];
        
        // Weekly aggregation
        for ($i = 0; $i < 13; $i++) {
            $weekStart = Carbon::today()->subWeeks($i)->startOfWeek();
            $weekEnd = Carbon::today()->subWeeks($i)->endOfWeek();

            $questions = DB::table('question_answers')
                ->where('user_id', $user->id)
                ->whereBetween('created_at', [$weekStart, $weekEnd])
                ->count();

            $correct = DB::table('question_answers')
                ->where('user_id', $user->id)
                ->where('is_correct', true)
                ->whereBetween('created_at', [$weekStart, $weekEnd])
                ->count();

            $studyTime = DB::table('study_sessions')
                ->where('user_id', $user->id)
                ->whereBetween('created_at', [$weekStart, $weekEnd])
                ->sum('duration_minutes');

            $accuracy = $questions > 0 ? ($correct / $questions) * 100 : 0;

            $timeline[] = [
                'week_label' => $weekStart->format('M d') . ' - ' . $weekEnd->format('M d'),
                'questions_solved' => $questions,
                'accuracy_rate' => round($accuracy, 2),
                'study_minutes' => $studyTime,
            ];
        }

        return array_reverse($timeline);
    }

    /**
     * Get AI-powered predictions
     */
    private function getUserPredictions(User $user): array
    {
        $performance = $this->getUserOverview($user);
        $subjectPerf = $this->getUserSubjectPerformance($user);

        // Simple prediction model
        $predictions = [];

        // Exam score prediction
        if ($performance['total_exams'] >= 3) {
            $recentScores = DB::table('exam_sessions')
                ->where('user_id', $user->id)
                ->where('status', 'completed')
                ->orderBy('completed_at', 'desc')
                ->limit(5)
                ->pluck('score')
                ->toArray();

            $avgScore = array_sum($recentScores) / count($recentScores);
            $trend = $this->calculateTrend($recentScores);

            $predictions['next_exam_score'] = [
                'predicted_score' => round($avgScore + ($trend * 2), 2),
                'confidence' => 'medium',
                'based_on' => count($recentScores) . ' recent exams',
            ];
        }

        // Goal achievement prediction
        $currentAccuracy = $performance['overall_accuracy'];
        $targetAccuracy = 85;
        $improvement = max(0, $targetAccuracy - $currentAccuracy);
        
        $estimatedDays = $improvement > 0 ? round($improvement * 7) : 0;

        $predictions['goal_achievement'] = [
            'goal' => 'Reach 85% accuracy',
            'current_value' => $currentAccuracy,
            'target_value' => $targetAccuracy,
            'estimated_days' => $estimatedDays,
            'confidence' => $improvement < 10 ? 'high' : 'medium',
        ];

        return $predictions;
    }

    /**
     * Export analytics data
     */
    public function exportData(string $type, array $filters = []): array
    {
        return match($type) {
            'users' => $this->exportUsers($filters),
            'questions' => $this->exportQuestions($filters),
            'exams' => $this->exportExams($filters),
            'payments' => $this->exportPayments($filters),
            'study_sessions' => $this->exportStudySessions($filters),
            default => ['error' => 'Invalid export type'],
        };
    }

    /**
     * Helper methods
     */
    private function calculateUserAccuracy(int $userId): float
    {
        $total = DB::table('question_answers')->where('user_id', $userId)->count();
        if ($total === 0) return 0;

        $correct = DB::table('question_answers')->where('user_id', $userId)->where('is_correct', true)->count();
        return round(($correct / $total) * 100, 2);
    }

    private function calculateConversionRate(): float
    {
        $totalUsers = User::count();
        $paidUsers = DB::table('payments')->where('status', 'completed')->distinct('user_id')->count('user_id');
        
        return $totalUsers > 0 ? round(($paidUsers / $totalUsers) * 100, 2) : 0;
    }

    private function getSubjectTrend(int $userId, string $subject): string
    {
        // Compare last week vs previous week
        $lastWeek = $this->getSubjectAccuracyForPeriod($userId, $subject, 7);
        $previousWeek = $this->getSubjectAccuracyForPeriod($userId, $subject, 14, 7);

        if ($lastWeek > $previousWeek + 5) return 'improving';
        if ($lastWeek < $previousWeek - 5) return 'declining';
        return 'stable';
    }

    private function getSubjectAccuracyForPeriod(int $userId, string $subject, int $daysAgo, int $periodLength = 7): float
    {
        $start = Carbon::today()->subDays($daysAgo);
        $end = Carbon::today()->subDays($daysAgo - $periodLength);

        $total = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->where('question_answers.user_id', $userId)
            ->where('questions.subject', $subject)
            ->whereBetween('question_answers.created_at', [$start, $end])
            ->count();

        if ($total === 0) return 0;

        $correct = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->where('question_answers.user_id', $userId)
            ->where('questions.subject', $subject)
            ->where('question_answers.is_correct', true)
            ->whereBetween('question_answers.created_at', [$start, $end])
            ->count();

        return ($correct / $total) * 100;
    }

    private function getSubjectWeeklyProgress(int $userId, string $subject): array
    {
        $progress = [];
        
        for ($i = 0; $i < 4; $i++) {
            $weekStart = Carbon::today()->subWeeks($i)->startOfWeek();
            $weekEnd = Carbon::today()->subWeeks($i)->endOfWeek();

            $accuracy = $this->getSubjectAccuracyForPeriod(
                $userId, 
                $subject, 
                $i * 7, 
                7
            );

            $progress[] = [
                'week' => 'Week ' . (4 - $i),
                'accuracy' => round($accuracy, 2),
            ];
        }

        return array_reverse($progress);
    }

    private function calculateTrend(array $values): float
    {
        $n = count($values);
        if ($n < 2) return 0;

        // Simple linear regression
        $sumX = 0;
        $sumY = 0;
        $sumXY = 0;
        $sumX2 = 0;

        foreach ($values as $i => $y) {
            $x = $i + 1;
            $sumX += $x;
            $sumY += $y;
            $sumXY += $x * $y;
            $sumX2 += $x * $x;
        }

        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);
        return $slope;
    }

    private function getSystemHealth(): string
    {
        // Simple health check
        try {
            DB::connection()->getPdo();
            Cache::get('health_check');
            return 'healthy';
        } catch (\Exception $e) {
            return 'degraded';
        }
    }

    // Export methods
    private function exportUsers(array $filters): array
    {
        $query = User::query();
        
        if (isset($filters['role'])) {
            $query->where('role', $filters['role']);
        }
        
        if (isset($filters['subscription'])) {
            $query->where('subscription_plan', $filters['subscription']);
        }

        return $query->get()->toArray();
    }

    private function exportQuestions(array $filters): array
    {
        return DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->join('users', 'question_answers.user_id', '=', 'users.id')
            ->select(
                'users.name as student_name',
                'questions.subject',
                'questions.difficulty',
                'question_answers.is_correct',
                'question_answers.time_spent_seconds',
                'question_answers.created_at'
            )
            ->when(isset($filters['subject']), function ($q) use ($filters) {
                $q->where('questions.subject', $filters['subject']);
            })
            ->when(isset($filters['start_date']), function ($q) use ($filters) {
                $q->where('question_answers.created_at', '>=', $filters['start_date']);
            })
            ->when(isset($filters['end_date']), function ($q) use ($filters) {
                $q->where('question_answers.created_at', '<=', $filters['end_date']);
            })
            ->get()
            ->toArray();
    }

    private function exportExams(array $filters): array
    {
        return DB::table('exam_sessions')
            ->join('exams', 'exam_sessions.exam_id', '=', 'exams.id')
            ->join('users', 'exam_sessions.user_id', '=', 'users.id')
            ->select(
                'users.name as student_name',
                'exams.title as exam_title',
                'exam_sessions.score',
                'exam_sessions.net_score',
                'exam_sessions.started_at',
                'exam_sessions.completed_at'
            )
            ->where('exam_sessions.status', 'completed')
            ->when(isset($filters['start_date']), function ($q) use ($filters) {
                $q->where('exam_sessions.completed_at', '>=', $filters['start_date']);
            })
            ->get()
            ->toArray();
    }

    private function exportPayments(array $filters): array
    {
        return DB::table('payments')
            ->join('users', 'payments.user_id', '=', 'users.id')
            ->select(
                'users.name',
                'users.email',
                'payments.amount',
                'payments.plan_type',
                'payments.billing_period',
                'payments.status',
                'payments.paid_at'
            )
            ->when(isset($filters['status']), function ($q) use ($filters) {
                $q->where('payments.status', $filters['status']);
            })
            ->get()
            ->toArray();
    }

    private function exportStudySessions(array $filters): array
    {
        return DB::table('study_sessions')
            ->join('users', 'study_sessions.user_id', '=', 'users.id')
            ->select(
                'users.name',
                'study_sessions.activity_type',
                'study_sessions.duration_minutes',
                'study_sessions.started_at',
                'study_sessions.ended_at'
            )
            ->when(isset($filters['start_date']), function ($q) use ($filters) {
                $q->where('study_sessions.started_at', '>=', $filters['start_date']);
            })
            ->get()
            ->toArray();
    }
}
