<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Parent Dashboard Service
 * Comprehensive parent monitoring and tracking system
 */
class ParentDashboardService
{
    /**
     * Get comprehensive overview for parent
     */
    public function getParentOverview(User $parent): array
    {
        $children = $parent->approvedChildren()->get();

        $overview = [
            'total_children' => $children->count(),
            'children' => [],
        ];

        foreach ($children as $child) {
            $overview['children'][] = [
                'id' => $child->id,
                'name' => $child->name,
                'email' => $child->email,
                'grade' => $child->grade,
                'profile_image' => $child->profile_image,
                'level' => $child->level,
                'xp' => $child->xp,
                'subscription_plan' => $child->subscription_plan,
                'subscription_expires_at' => $child->subscription_expires_at,
                'last_active' => $child->last_login_at,
                'summary' => $this->getChildSummary($child),
            ];
        }

        return $overview;
    }

    /**
     * Get detailed child summary
     */
    private function getChildSummary(User $child): array
    {
        $today = Carbon::today();
        $thisWeek = Carbon::today()->startOfWeek();
        $thisMonth = Carbon::today()->startOfMonth();

        return [
            'today' => [
                'questions_solved' => $this->getQuestionsSolved($child, $today),
                'study_time_minutes' => $this->getStudyTime($child, $today),
                'exams_completed' => $this->getExamsCompleted($child, $today),
            ],
            'this_week' => [
                'questions_solved' => $this->getQuestionsSolved($child, $thisWeek),
                'study_time_minutes' => $this->getStudyTime($child, $thisWeek),
                'exams_completed' => $this->getExamsCompleted($child, $thisWeek),
                'login_days' => $this->getLoginDays($child, $thisWeek),
            ],
            'this_month' => [
                'questions_solved' => $this->getQuestionsSolved($child, $thisMonth),
                'study_time_minutes' => $this->getStudyTime($child, $thisMonth),
                'exams_completed' => $this->getExamsCompleted($child, $thisMonth),
                'accuracy_rate' => $this->getAccuracyRate($child, $thisMonth),
            ],
            'current_streak' => $this->getCurrentStreak($child),
        ];
    }

    /**
     * Get detailed child progress report
     */
    public function getChildProgress(int $childId, User $parent): array
    {
        $child = $parent->approvedChildren()->find($childId);

        if (!$child) {
            return ['error' => 'Çocuk bulunamadı veya erişim yok'];
        }

        return [
            'student' => [
                'id' => $child->id,
                'name' => $child->name,
                'grade' => $child->grade,
                'level' => $child->level,
                'xp' => $child->xp,
            ],
            'performance' => $this->getPerformanceMetrics($child),
            'subject_analysis' => $this->getSubjectAnalysis($child),
            'topic_strengths' => $this->getTopicStrengths($child),
            'topic_weaknesses' => $this->getTopicWeaknesses($child),
            'study_patterns' => $this->getStudyPatterns($child),
            'achievements' => $this->getRecentAchievements($child),
            'upcoming_exams' => $this->getUpcomingExams($child),
            'recommendations' => $this->getRecommendations($child),
        ];
    }

    /**
     * Get performance metrics
     */
    private function getPerformanceMetrics(User $child): array
    {
        $last30Days = Carbon::today()->subDays(30);

        $totalQuestions = DB::table('question_answers')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $last30Days)
            ->count();

        $correctQuestions = DB::table('question_answers')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $last30Days)
            ->where('is_correct', true)
            ->count();

        $accuracyRate = $totalQuestions > 0 ? ($correctQuestions / $totalQuestions) * 100 : 0;

        $totalExams = DB::table('exam_sessions')
            ->where('user_id', $child->id)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $last30Days)
            ->count();

        $avgExamScore = DB::table('exam_sessions')
            ->where('user_id', $child->id)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $last30Days)
            ->avg('score');

        $totalStudyTime = DB::table('study_sessions')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $last30Days)
            ->sum('duration_minutes');

        $coursesEnrolled = DB::table('course_enrollments')
            ->where('user_id', $child->id)
            ->count();

        $coursesCompleted = DB::table('course_enrollments')
            ->where('user_id', $child->id)
            ->whereNotNull('completed_at')
            ->count();

        return [
            'last_30_days' => [
                'total_questions' => $totalQuestions,
                'correct_questions' => $correctQuestions,
                'accuracy_rate' => round($accuracyRate, 2),
                'total_exams' => $totalExams,
                'avg_exam_score' => round($avgExamScore ?? 0, 2),
                'total_study_hours' => round($totalStudyTime / 60, 2),
            ],
            'courses' => [
                'enrolled' => $coursesEnrolled,
                'completed' => $coursesCompleted,
                'completion_rate' => $coursesEnrolled > 0 ? round(($coursesCompleted / $coursesEnrolled) * 100, 2) : 0,
            ],
        ];
    }

    /**
     * Get subject-wise analysis
     */
    private function getSubjectAnalysis(User $child): array
    {
        $last30Days = Carbon::today()->subDays(30);

        $subjectData = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->where('question_answers.user_id', $child->id)
            ->where('question_answers.created_at', '>=', $last30Days)
            ->select(
                'questions.subject',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN question_answers.is_correct THEN 1 ELSE 0 END) as correct'),
                DB::raw('AVG(question_answers.time_spent_seconds) as avg_time')
            )
            ->groupBy('questions.subject')
            ->get();

        $analysis = [];
        foreach ($subjectData as $data) {
            $accuracy = $data->total > 0 ? ($data->correct / $data->total) * 100 : 0;
            
            $analysis[$data->subject] = [
                'total_questions' => $data->total,
                'correct_answers' => $data->correct,
                'accuracy_rate' => round($accuracy, 2),
                'avg_time_seconds' => round($data->avg_time, 0),
                'performance_level' => $this->getPerformanceLevel($accuracy),
                'trend' => $this->getSubjectTrend($child->id, $data->subject),
            ];
        }

        return $analysis;
    }

    /**
     * Get topic strengths (top 5)
     */
    private function getTopicStrengths(User $child): array
    {
        $last30Days = Carbon::today()->subDays(30);

        $topicData = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->join('topics', 'questions.topic_id', '=', 'topics.id')
            ->where('question_answers.user_id', $child->id)
            ->where('question_answers.created_at', '>=', $last30Days)
            ->select(
                'topics.id',
                'topics.title',
                'questions.subject',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN question_answers.is_correct THEN 1 ELSE 0 END) as correct')
            )
            ->groupBy('topics.id', 'topics.title', 'questions.subject')
            ->havingRaw('COUNT(*) >= 5')
            ->get();

        $strengths = $topicData
            ->map(function ($item) {
                $accuracy = $item->total > 0 ? ($item->correct / $item->total) * 100 : 0;
                return [
                    'topic_id' => $item->id,
                    'topic_name' => $item->title,
                    'subject' => $item->subject,
                    'accuracy_rate' => round($accuracy, 2),
                    'total_questions' => $item->total,
                ];
            })
            ->sortByDesc('accuracy_rate')
            ->take(5)
            ->values()
            ->toArray();

        return $strengths;
    }

    /**
     * Get topic weaknesses (bottom 5)
     */
    private function getTopicWeaknesses(User $child): array
    {
        $last30Days = Carbon::today()->subDays(30);

        $topicData = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->join('topics', 'questions.topic_id', '=', 'topics.id')
            ->where('question_answers.user_id', $child->id)
            ->where('question_answers.created_at', '>=', $last30Days)
            ->select(
                'topics.id',
                'topics.title',
                'questions.subject',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN question_answers.is_correct THEN 1 ELSE 0 END) as correct')
            )
            ->groupBy('topics.id', 'topics.title', 'questions.subject')
            ->havingRaw('COUNT(*) >= 5')
            ->get();

        $weaknesses = $topicData
            ->map(function ($item) {
                $accuracy = $item->total > 0 ? ($item->correct / $item->total) * 100 : 0;
                return [
                    'topic_id' => $item->id,
                    'topic_name' => $item->title,
                    'subject' => $item->subject,
                    'accuracy_rate' => round($accuracy, 2),
                    'total_questions' => $item->total,
                    'needs_practice' => $accuracy < 60,
                ];
            })
            ->sortBy('accuracy_rate')
            ->take(5)
            ->values()
            ->toArray();

        return $weaknesses;
    }

    /**
     * Get study patterns and habits
     */
    private function getStudyPatterns(User $child): array
    {
        $last30Days = Carbon::today()->subDays(30);

        // Study time by day of week
        $studyByDayOfWeek = DB::table('study_sessions')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $last30Days)
            ->select(
                DB::raw('DAYOFWEEK(created_at) as day_of_week'),
                DB::raw('SUM(duration_minutes) as total_minutes'),
                DB::raw('COUNT(*) as session_count')
            )
            ->groupBy('day_of_week')
            ->get()
            ->mapWithKeys(function ($item) {
                $days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                return [$days[$item->day_of_week - 1] => [
                    'total_minutes' => $item->total_minutes,
                    'session_count' => $item->session_count,
                    'avg_session_minutes' => round($item->total_minutes / $item->session_count, 0),
                ]];
            });

        // Study time by hour of day
        $studyByHour = DB::table('study_sessions')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $last30Days)
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(duration_minutes) as total_minutes')
            )
            ->groupBy('hour')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->hour . ':00' => $item->total_minutes];
            });

        // Most productive time
        $mostProductiveHour = $studyByHour->sortDesc()->keys()->first();

        // Average session duration
        $avgSessionDuration = DB::table('study_sessions')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $last30Days)
            ->avg('duration_minutes');

        // Longest study streak
        $longestStreak = DB::table('streaks')
            ->where('user_id', $child->id)
            ->where('type', 'daily_login')
            ->value('longest_count') ?? 0;

        return [
            'by_day_of_week' => $studyByDayOfWeek,
            'by_hour' => $studyByHour,
            'most_productive_time' => $mostProductiveHour,
            'avg_session_duration_minutes' => round($avgSessionDuration ?? 0, 0),
            'longest_study_streak' => $longestStreak,
            'consistency_score' => $this->calculateConsistencyScore($child),
        ];
    }

    /**
     * Get recent achievements
     */
    private function getRecentAchievements(User $child): array
    {
        $recentBadges = DB::table('user_badges')
            ->join('badges', 'user_badges.badge_id', '=', 'badges.id')
            ->where('user_badges.user_id', $child->id)
            ->orderBy('user_badges.earned_at', 'desc')
            ->limit(5)
            ->select('badges.name', 'badges.description', 'badges.tier', 'user_badges.earned_at')
            ->get();

        $recentAchievements = DB::table('user_achievements')
            ->join('achievements', 'user_achievements.achievement_id', '=', 'achievements.id')
            ->where('user_achievements.user_id', $child->id)
            ->orderBy('user_achievements.achieved_at', 'desc')
            ->limit(5)
            ->select('achievements.name', 'achievements.description', 'achievements.xp_reward', 'user_achievements.achieved_at')
            ->get();

        return [
            'recent_badges' => $recentBadges,
            'recent_achievements' => $recentAchievements,
            'total_badges' => DB::table('user_badges')->where('user_id', $child->id)->count(),
            'total_achievements' => DB::table('user_achievements')->where('user_id', $child->id)->count(),
        ];
    }

    /**
     * Get upcoming exams
     */
    private function getUpcomingExams(User $child): array
    {
        $upcomingExams = DB::table('exam_sessions')
            ->join('exams', 'exam_sessions.exam_id', '=', 'exams.id')
            ->where('exam_sessions.user_id', $child->id)
            ->where('exam_sessions.status', 'scheduled')
            ->where('exam_sessions.scheduled_at', '>=', Carbon::now())
            ->orderBy('exam_sessions.scheduled_at')
            ->select('exams.title', 'exams.exam_type', 'exam_sessions.scheduled_at')
            ->limit(5)
            ->get();

        return $upcomingExams->toArray();
    }

    /**
     * Get AI-powered recommendations for parent
     */
    private function getRecommendations(User $child): array
    {
        $weaknesses = $this->getTopicWeaknesses($child);
        $performance = $this->getPerformanceMetrics($child);
        $patterns = $this->getStudyPatterns($child);

        $recommendations = [];

        // Study time recommendation
        if ($performance['last_30_days']['total_study_hours'] < 10) {
            $recommendations[] = [
                'type' => 'study_time',
                'priority' => 'high',
                'title' => 'Çalışma Süresini Artırın',
                'description' => 'Çocuğunuz ayda sadece ' . $performance['last_30_days']['total_study_hours'] . ' saat çalışıyor. Hedef en az 20 saat olmalı.',
                'action' => 'Günlük çalışma planı oluşturun',
            ];
        }

        // Accuracy recommendation
        if ($performance['last_30_days']['accuracy_rate'] < 60) {
            $recommendations[] = [
                'type' => 'accuracy',
                'priority' => 'high',
                'title' => 'Doğruluk Oranını Geliştirin',
                'description' => 'Doğruluk oranı %' . $performance['last_30_days']['accuracy_rate'] . '. Hedef en az %70.',
                'action' => 'Zayıf konulara odaklanın',
            ];
        }

        // Weak topics recommendation
        if (!empty($weaknesses)) {
            $weakTopics = array_slice($weaknesses, 0, 3);
            $topicNames = array_column($weakTopics, 'topic_name');
            
            $recommendations[] = [
                'type' => 'weak_topics',
                'priority' => 'medium',
                'title' => 'Zayıf Konular',
                'description' => 'Şu konularda daha fazla çalışma gerekiyor: ' . implode(', ', $topicNames),
                'action' => 'Bu konularda ek kaynak sağlayın',
            ];
        }

        // Consistency recommendation
        if ($patterns['consistency_score'] < 50) {
            $recommendations[] = [
                'type' => 'consistency',
                'priority' => 'medium',
                'title' => 'Düzenli Çalışma',
                'description' => 'Çalışma düzeni yetersiz. Daha tutarlı bir program oluşturun.',
                'action' => 'Sabit çalışma saatleri belirleyin',
            ];
        }

        return $recommendations;
    }

    /**
     * Helper methods
     */
    private function getQuestionsSolved(User $child, Carbon $since): int
    {
        return DB::table('question_answers')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $since)
            ->count();
    }

    private function getStudyTime(User $child, Carbon $since): int
    {
        return DB::table('study_sessions')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $since)
            ->sum('duration_minutes') ?? 0;
    }

    private function getExamsCompleted(User $child, Carbon $since): int
    {
        return DB::table('exam_sessions')
            ->where('user_id', $child->id)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $since)
            ->count();
    }

    private function getLoginDays(User $child, Carbon $since): int
    {
        return DB::table('study_sessions')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $since)
            ->distinct('DATE(created_at)')
            ->count(DB::raw('DISTINCT DATE(created_at)'));
    }

    private function getAccuracyRate(User $child, Carbon $since): float
    {
        $total = DB::table('question_answers')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $since)
            ->count();

        if ($total === 0) return 0;

        $correct = DB::table('question_answers')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $since)
            ->where('is_correct', true)
            ->count();

        return round(($correct / $total) * 100, 2);
    }

    private function getCurrentStreak(User $child): int
    {
        return DB::table('streaks')
            ->where('user_id', $child->id)
            ->where('type', 'daily_login')
            ->value('current_count') ?? 0;
    }

    private function getPerformanceLevel(float $accuracy): string
    {
        return match(true) {
            $accuracy >= 90 => 'Mükemmel',
            $accuracy >= 80 => 'Çok İyi',
            $accuracy >= 70 => 'İyi',
            $accuracy >= 60 => 'Orta',
            default => 'Geliştirilmeli',
        };
    }

    private function getSubjectTrend(int $childId, string $subject): string
    {
        $lastWeek = Carbon::today()->subDays(7);
        $previousWeek = Carbon::today()->subDays(14);

        $lastWeekAccuracy = $this->getSubjectAccuracy($childId, $subject, $lastWeek, Carbon::today());
        $previousWeekAccuracy = $this->getSubjectAccuracy($childId, $subject, $previousWeek, $lastWeek);

        if ($lastWeekAccuracy > $previousWeekAccuracy + 5) return 'improving';
        if ($lastWeekAccuracy < $previousWeekAccuracy - 5) return 'declining';
        return 'stable';
    }

    private function getSubjectAccuracy(int $childId, string $subject, Carbon $start, Carbon $end): float
    {
        $total = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->where('question_answers.user_id', $childId)
            ->where('questions.subject', $subject)
            ->whereBetween('question_answers.created_at', [$start, $end])
            ->count();

        if ($total === 0) return 0;

        $correct = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->where('question_answers.user_id', $childId)
            ->where('questions.subject', $subject)
            ->where('question_answers.is_correct', true)
            ->whereBetween('question_answers.created_at', [$start, $end])
            ->count();

        return ($correct / $total) * 100;
    }

    private function calculateConsistencyScore(User $child): int
    {
        $last30Days = Carbon::today()->subDays(30);
        
        $studyDays = DB::table('study_sessions')
            ->where('user_id', $child->id)
            ->where('created_at', '>=', $last30Days)
            ->distinct('DATE(created_at)')
            ->count(DB::raw('DISTINCT DATE(created_at)'));

        // Score out of 100
        return min(100, round(($studyDays / 30) * 100));
    }

    /**
     * Send weekly report to parent
     */
    public function sendWeeklyReport(User $parent): bool
    {
        $children = $parent->approvedChildren()->get();
        
        foreach ($children as $child) {
            $report = $this->generateWeeklyReport($child);
            // Send email with report (implement mail service)
            // Email::to($parent->email)->send(new WeeklyProgressReport($child, $report));
        }

        return true;
    }

    /**
     * Generate weekly report
     */
    private function generateWeeklyReport(User $child): array
    {
        $thisWeek = Carbon::today()->startOfWeek();

        return [
            'student_name' => $child->name,
            'week_summary' => $this->getChildSummary($child)['this_week'],
            'highlights' => $this->getWeekHighlights($child),
            'areas_of_concern' => $this->getAreasOfConcern($child),
        ];
    }

    private function getWeekHighlights(User $child): array
    {
        // Implement highlights logic
        return [];
    }

    private function getAreasOfConcern(User $child): array
    {
        // Implement concerns logic
        return [];
    }
}
