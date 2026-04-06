<?php

namespace App\Services;

use App\Models\User;
use App\Models\Question;
use App\Models\QuestionAnswer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * Spaced Repetition System using SM-2 Algorithm
 * Based on SuperMemo 2 algorithm and Ebbinghaus Forgetting Curve
 */
class SpacedRepetitionService
{
    /**
     * SM-2 Algorithm: Calculate next review interval
     * 
     * @param int $repetitionNumber - Number of successful reviews
     * @param float $easeFactor - Current ease factor (starts at 2.5)
     * @param int $previousInterval - Previous interval in days
     * @param int $quality - Quality of response (0-5)
     * @return array ['interval' => days, 'easeFactor' => float, 'repetitions' => int]
     */
    public function calculateNextReview(int $repetitionNumber, float $easeFactor, int $previousInterval, int $quality): array
    {
        // Quality: 0-5 scale
        // 0: Complete blackout
        // 1: Incorrect response
        // 2: Incorrect but remembered
        // 3: Correct but difficult
        // 4: Correct with hesitation
        // 5: Perfect response

        // If quality < 3, reset repetitions
        if ($quality < 3) {
            return [
                'interval' => 1, // Start over with 1 day
                'easeFactor' => max(1.3, $easeFactor - 0.2), // Decrease ease factor
                'repetitions' => 0,
            ];
        }

        // Update ease factor
        $newEaseFactor = $easeFactor + (0.1 - (5 - $quality) * (0.08 + (5 - $quality) * 0.02));
        $newEaseFactor = max(1.3, $newEaseFactor); // Minimum ease factor

        // Calculate new interval
        $newRepetitions = $repetitionNumber + 1;
        
        if ($newRepetitions === 1) {
            $interval = 1;
        } elseif ($newRepetitions === 2) {
            $interval = 6;
        } else {
            $interval = round($previousInterval * $newEaseFactor);
        }

        return [
            'interval' => $interval,
            'easeFactor' => $newEaseFactor,
            'repetitions' => $newRepetitions,
        ];
    }

    /**
     * Get questions due for review for a user
     */
    public function getDueQuestions(User $user, int $limit = 20): array
    {
        $today = Carbon::today();

        $dueReviews = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('next_review_date', '<=', $today)
            ->where('is_active', true)
            ->orderBy('next_review_date')
            ->orderBy('ease_factor') // Harder cards first
            ->limit($limit)
            ->get();

        $questionIds = $dueReviews->pluck('question_id')->toArray();
        $questions = Question::whereIn('id', $questionIds)->get();

        return [
            'questions' => $questions,
            'due_count' => $dueReviews->count(),
            'total_active_cards' => DB::table('spaced_repetition_cards')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->count(),
        ];
    }

    /**
     * Process answer and update spaced repetition card
     */
    public function processAnswer(User $user, int $questionId, bool $isCorrect, int $timeSpentSeconds): array
    {
        // Get or create card
        $card = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('question_id', $questionId)
            ->first();

        // Calculate quality based on correctness and time
        $quality = $this->calculateQuality($isCorrect, $timeSpentSeconds);

        if (!$card) {
            // Create new card
            $result = $this->calculateNextReview(0, 2.5, 1, $quality);
            
            DB::table('spaced_repetition_cards')->insert([
                'user_id' => $user->id,
                'question_id' => $questionId,
                'ease_factor' => $result['easeFactor'],
                'interval_days' => $result['interval'],
                'repetitions' => $result['repetitions'],
                'last_review_date' => Carbon::today(),
                'next_review_date' => Carbon::today()->addDays($result['interval']),
                'last_quality' => $quality,
                'total_reviews' => 1,
                'total_correct' => $isCorrect ? 1 : 0,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return [
                'next_review_date' => Carbon::today()->addDays($result['interval']),
                'interval_days' => $result['interval'],
                'ease_factor' => $result['easeFactor'],
                'is_new_card' => true,
            ];
        }

        // Update existing card
        $result = $this->calculateNextReview(
            $card->repetitions,
            $card->ease_factor,
            $card->interval_days,
            $quality
        );

        DB::table('spaced_repetition_cards')
            ->where('id', $card->id)
            ->update([
                'ease_factor' => $result['easeFactor'],
                'interval_days' => $result['interval'],
                'repetitions' => $result['repetitions'],
                'last_review_date' => Carbon::today(),
                'next_review_date' => Carbon::today()->addDays($result['interval']),
                'last_quality' => $quality,
                'total_reviews' => $card->total_reviews + 1,
                'total_correct' => $card->total_correct + ($isCorrect ? 1 : 0),
                'updated_at' => now(),
            ]);

        return [
            'next_review_date' => Carbon::today()->addDays($result['interval']),
            'interval_days' => $result['interval'],
            'ease_factor' => $result['easeFactor'],
            'is_new_card' => false,
        ];
    }

    /**
     * Calculate quality score (0-5) based on correctness and time
     */
    private function calculateQuality(bool $isCorrect, int $timeSpentSeconds): int
    {
        if (!$isCorrect) {
            return $timeSpentSeconds > 120 ? 0 : 1; // 0: blackout, 1: incorrect
        }

        // Correct answer - quality based on time
        if ($timeSpentSeconds <= 30) {
            return 5; // Perfect
        } elseif ($timeSpentSeconds <= 60) {
            return 4; // Good
        } else {
            return 3; // Acceptable
        }
    }

    /**
     * Get user's spaced repetition statistics
     */
    public function getStatistics(User $user): array
    {
        $totalCards = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->count();

        $dueToday = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('next_review_date', '<=', Carbon::today())
            ->where('is_active', true)
            ->count();

        $masteredCards = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('repetitions', '>=', 5)
            ->where('ease_factor', '>=', 2.5)
            ->where('is_active', true)
            ->count();

        $averageEaseFactor = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->avg('ease_factor');

        $totalReviews = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->sum('total_reviews');

        $totalCorrect = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->sum('total_correct');

        $accuracyRate = $totalReviews > 0 ? ($totalCorrect / $totalReviews) * 100 : 0;

        return [
            'total_cards' => $totalCards,
            'due_today' => $dueToday,
            'mastered_cards' => $masteredCards,
            'average_ease_factor' => round($averageEaseFactor, 2),
            'total_reviews' => $totalReviews,
            'accuracy_rate' => round($accuracyRate, 2),
            'retention_rate' => $this->calculateRetentionRate($user),
        ];
    }

    /**
     * Calculate retention rate using Ebbinghaus forgetting curve
     */
    private function calculateRetentionRate(User $user): float
    {
        // Get recent reviews (last 30 days)
        $recentCards = DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('last_review_date', '>=', Carbon::today()->subDays(30))
            ->where('is_active', true)
            ->get();

        if ($recentCards->isEmpty()) {
            return 0;
        }

        $retentionSum = 0;
        foreach ($recentCards as $card) {
            // Ebbinghaus formula: R = e^(-t/S)
            // R = retention, t = time since review, S = strength (ease factor)
            $daysSinceReview = Carbon::parse($card->last_review_date)->diffInDays(Carbon::today());
            $strength = $card->ease_factor * 10; // Scale for meaningful calculation
            $retention = exp(-$daysSinceReview / $strength);
            $retentionSum += $retention;
        }

        return round(($retentionSum / $recentCards->count()) * 100, 2);
    }

    /**
     * Get recommended study plan for today
     */
    public function getStudyPlan(User $user): array
    {
        $dueQuestions = $this->getDueQuestions($user, 50);
        
        // Categorize by difficulty (ease factor)
        $easy = [];
        $medium = [];
        $hard = [];

        foreach ($dueQuestions['questions'] as $question) {
            $card = DB::table('spaced_repetition_cards')
                ->where('user_id', $user->id)
                ->where('question_id', $question->id)
                ->first();

            if (!$card) continue;

            if ($card->ease_factor >= 2.5) {
                $easy[] = $question;
            } elseif ($card->ease_factor >= 2.0) {
                $medium[] = $question;
            } else {
                $hard[] = $question;
            }
        }

        return [
            'total_due' => $dueQuestions['due_count'],
            'recommended_order' => [
                'hard' => count($hard),
                'medium' => count($medium),
                'easy' => count($easy),
            ],
            'estimated_time_minutes' => $this->estimateStudyTime($dueQuestions['due_count']),
            'suggestion' => $this->getStudySuggestion($dueQuestions['due_count']),
        ];
    }

    /**
     * Estimate study time based on due count
     */
    private function estimateStudyTime(int $dueCount): int
    {
        // Average 2 minutes per question (including review)
        return $dueCount * 2;
    }

    /**
     * Get study suggestion
     */
    private function getStudySuggestion(int $dueCount): string
    {
        if ($dueCount === 0) {
            return 'Harika! Bugün için tekrar edilecek soru yok. Yeni konulara geçebilirsin.';
        } elseif ($dueCount <= 10) {
            return 'Az sayıda tekrar var. Kısa bir çalışmayla bitir!';
        } elseif ($dueCount <= 30) {
            return 'Orta seviyede tekrar var. Zor soruları önce çözmeyi dene.';
        } else {
            return 'Çok fazla tekrar birikmiş! Önce en zor soruları çöz, sonra kolay olanları.';
        }
    }

    /**
     * Reset a card (start over)
     */
    public function resetCard(User $user, int $questionId): bool
    {
        return DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('question_id', $questionId)
            ->update([
                'ease_factor' => 2.5,
                'interval_days' => 1,
                'repetitions' => 0,
                'next_review_date' => Carbon::tomorrow(),
                'updated_at' => now(),
            ]) > 0;
    }

    /**
     * Suspend a card (temporarily disable)
     */
    public function suspendCard(User $user, int $questionId): bool
    {
        return DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('question_id', $questionId)
            ->update([
                'is_active' => false,
                'updated_at' => now(),
            ]) > 0;
    }

    /**
     * Unsuspend a card
     */
    public function unsuspendCard(User $user, int $questionId): bool
    {
        return DB::table('spaced_repetition_cards')
            ->where('user_id', $user->id)
            ->where('question_id', $questionId)
            ->update([
                'is_active' => true,
                'next_review_date' => Carbon::tomorrow(),
                'updated_at' => now(),
            ]) > 0;
    }
}
