<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    /**
     * Get admin dashboard analytics
     */
    public function adminDashboard(): JsonResponse
    {
        $data = $this->analytics->getAdminDashboard();

        return response()->json([
            'success' => true,
            'analytics' => $data,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get user analytics
     */
    public function userAnalytics(int $userId = null): JsonResponse
    {
        $user = $userId ? \App\Models\User::findOrFail($userId) : Auth::user();

        // Check permission
        if ($userId && Auth::id() !== $userId && !Auth::user()->isAdmin()) {
            return response()->json([
                'error' => true,
                'message' => 'Bu verilere erişim yetkiniz yok',
            ], 403);
        }

        $data = $this->analytics->getUserAnalytics($user);

        return response()->json([
            'success' => true,
            'analytics' => $data,
        ]);
    }

    /**
     * Get subject analytics
     */
    public function subjectAnalytics(Request $request): JsonResponse
    {
        $subject = $request->input('subject');
        
        $data = [
            'subject' => $subject,
            'total_questions' => \DB::table('questions')->where('subject', $subject)->count(),
            'total_attempts' => \DB::table('question_answers')
                ->join('questions', 'question_answers.question_id', '=', 'questions.id')
                ->where('questions.subject', $subject)
                ->count(),
            'overall_accuracy' => $this->getSubjectAccuracy($subject),
            'difficulty_distribution' => $this->getSubjectDifficultyDistribution($subject),
            'top_performers' => $this->getSubjectTopPerformers($subject),
        ];

        return response()->json([
            'success' => true,
            'analytics' => $data,
        ]);
    }

    /**
     * Get real-time metrics
     */
    public function realTimeMetrics(): JsonResponse
    {
        $data = [
            'active_users_now' => \DB::table('users')
                ->where('last_activity_at', '>=', now()->subMinutes(5))
                ->count(),
            'active_exams_now' => \DB::table('exam_sessions')
                ->where('status', 'in_progress')
                ->count(),
            'questions_solved_last_hour' => \DB::table('question_answers')
                ->where('created_at', '>=', now()->subHour())
                ->count(),
            'api_requests_last_minute' => \DB::table('api_request_logs')
                ->where('created_at', '>=', now()->subMinute())
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'metrics' => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Export analytics data
     */
    public function export(Request $request): JsonResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $request->validate([
            'type' => 'required|in:users,questions,exams,payments,study_sessions',
            'format' => 'required|in:json,csv,excel',
            'filters' => 'sometimes|array',
        ]);

        $data = $this->analytics->exportData(
            $request->type,
            $request->filters ?? []
        );

        if (isset($data['error'])) {
            return response()->json([
                'error' => true,
                'message' => $data['error'],
            ], 400);
        }

        // Format response
        if ($request->format === 'json') {
            return response()->json([
                'success' => true,
                'data' => $data,
                'count' => count($data),
            ]);
        }

        if ($request->format === 'csv') {
            return $this->exportAsCSV($data, $request->type);
        }

        // Excel export would require PhpSpreadsheet
        return response()->json([
            'error' => true,
            'message' => 'Excel export not yet implemented',
        ], 501);
    }

    /**
     * Get engagement report
     */
    public function engagementReport(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $dailyEngagement = \DB::table('study_sessions')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                \DB::raw('DATE(created_at) as date'),
                \DB::raw('COUNT(DISTINCT user_id) as active_users'),
                \DB::raw('SUM(duration_minutes) as total_study_time'),
                \DB::raw('COUNT(*) as total_sessions')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'engagement' => $dailyEngagement,
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
        ]);
    }

    /**
     * Get retention analysis
     */
    public function retentionAnalysis(): JsonResponse
    {
        // Cohort analysis - users who signed up in each week
        $cohorts = [];
        
        for ($i = 0; $i < 12; $i++) {
            $weekStart = now()->subWeeks($i)->startOfWeek();
            $weekEnd = now()->subWeeks($i)->endOfWeek();

            $cohortSize = \DB::table('users')
                ->whereBetween('created_at', [$weekStart, $weekEnd])
                ->count();

            $retained = [];
            for ($week = 0; $week <= $i; $week++) {
                $checkStart = now()->subWeeks($i - $week)->startOfWeek();
                $checkEnd = now()->subWeeks($i - $week)->endOfWeek();

                $activeCount = \DB::table('users')
                    ->whereBetween('created_at', [$weekStart, $weekEnd])
                    ->whereBetween('last_login_at', [$checkStart, $checkEnd])
                    ->count();

                $retentionRate = $cohortSize > 0 ? ($activeCount / $cohortSize) * 100 : 0;
                $retained["week_{$week}"] = round($retentionRate, 2);
            }

            $cohorts[] = [
                'cohort' => $weekStart->format('Y-m-d'),
                'size' => $cohortSize,
                'retention' => $retained,
            ];
        }

        return response()->json([
            'success' => true,
            'cohorts' => array_reverse($cohorts),
        ]);
    }

    /**
     * Helper: Export as CSV
     */
    private function exportAsCSV(array $data, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filepath = storage_path("app/exports/{$filename}_" . time() . '.csv');
        
        $file = fopen($filepath, 'w');
        
        if (!empty($data)) {
            // Headers
            fputcsv($file, array_keys((array)$data[0]));
            
            // Data
            foreach ($data as $row) {
                fputcsv($file, (array)$row);
            }
        }
        
        fclose($file);

        return Response::download($filepath)->deleteFileAfterSend(true);
    }

    /**
     * Helper: Get subject accuracy
     */
    private function getSubjectAccuracy(string $subject): float
    {
        $total = \DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->where('questions.subject', $subject)
            ->count();

        if ($total === 0) return 0;

        $correct = \DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->where('questions.subject', $subject)
            ->where('question_answers.is_correct', true)
            ->count();

        return round(($correct / $total) * 100, 2);
    }

    /**
     * Helper: Get subject difficulty distribution
     */
    private function getSubjectDifficultyDistribution(string $subject): array
    {
        return \DB::table('questions')
            ->where('subject', $subject)
            ->select('difficulty', \DB::raw('COUNT(*) as count'))
            ->groupBy('difficulty')
            ->pluck('count', 'difficulty')
            ->toArray();
    }

    /**
     * Helper: Get subject top performers
     */
    private function getSubjectTopPerformers(string $subject, int $limit = 10): array
    {
        $performers = \DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->join('users', 'question_answers.user_id', '=', 'users.id')
            ->where('questions.subject', $subject)
            ->select(
                'users.id',
                'users.name',
                \DB::raw('COUNT(*) as total'),
                \DB::raw('SUM(CASE WHEN question_answers.is_correct THEN 1 ELSE 0 END) as correct')
            )
            ->groupBy('users.id', 'users.name')
            ->havingRaw('COUNT(*) >= 20') // At least 20 questions
            ->orderByRaw('(SUM(CASE WHEN question_answers.is_correct THEN 1 ELSE 0 END) / COUNT(*)) DESC')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'user_id' => $item->id,
                    'name' => $item->name,
                    'total_questions' => $item->total,
                    'correct_answers' => $item->correct,
                    'accuracy_rate' => round(($item->correct / $item->total) * 100, 2),
                ];
            })
            ->toArray();

        return $performers;
    }
}
