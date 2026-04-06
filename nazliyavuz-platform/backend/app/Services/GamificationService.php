<?php

namespace App\Services;

use App\Models\User;
use App\Models\Badge;
use App\Models\Achievement;
use App\Models\Streak;
use App\Models\Leaderboard;
use App\Models\LeaderboardEntry;
use App\Models\DailyReward;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class GamificationService
{
    /**
     * Award XP to user
     */
    public function awardXP(User $user, int $amount, string $reason): void
    {
        $oldXP = $user->xp;
        $oldLevel = $user->level;
        
        $user->increment('xp', $amount);
        $user->refresh();

        // Check for level up
        $newLevel = $this->calculateLevel($user->xp);
        if ($newLevel > $oldLevel) {
            $user->update(['level' => $newLevel]);
            $this->onLevelUp($user, $newLevel);
        }

        \Log::channel('user_activity')->info('XP awarded', [
            'user_id' => $user->id,
            'amount' => $amount,
            'reason' => $reason,
            'old_xp' => $oldXP,
            'new_xp' => $user->xp,
            'old_level' => $oldLevel,
            'new_level' => $newLevel,
        ]);
    }

    /**
     * Calculate level from XP
     */
    public function calculateLevel(int $xp): int
    {
        // Level formula: Level = floor(sqrt(XP / 100))
        return max(1, (int) floor(sqrt($xp / 100)));
    }

    /**
     * Get XP required for next level
     */
    public function getXPForNextLevel(int $currentLevel): int
    {
        $nextLevel = $currentLevel + 1;
        return ($nextLevel * $nextLevel) * 100;
    }

    /**
     * Handle level up event
     */
    private function onLevelUp(User $user, int $newLevel): void
    {
        // Award bonus points
        $bonusPoints = $newLevel * 10;
        $user->increment('gamification_points', $bonusPoints);

        // Check for level milestone badges
        $this->checkLevelBadges($user, $newLevel);

        // Notification (implement later)
        // event(new UserLeveledUp($user, $newLevel));
    }

    /**
     * Update user streak
     */
    public function updateStreak(User $user, string $type): array
    {
        $streak = Streak::firstOrCreate(
            ['user_id' => $user->id, 'type' => $type],
            [
                'current_count' => 0,
                'longest_count' => 0,
                'last_activity_date' => null,
                'is_active' => true,
            ]
        );

        $today = Carbon::today();
        $lastActivityDate = $streak->last_activity_date ? Carbon::parse($streak->last_activity_date) : null;

        if (!$lastActivityDate || $lastActivityDate->lt($today)) {
            // New activity day
            if ($lastActivityDate && $lastActivityDate->diffInDays($today) === 1) {
                // Consecutive day
                $streak->increment('current_count');
            } else {
                // Streak broken or first time
                $streak->current_count = 1;
            }

            $streak->last_activity_date = $today;
            $streak->is_active = true;

            // Update longest streak
            if ($streak->current_count > $streak->longest_count) {
                $streak->longest_count = $streak->current_count;
            }

            $streak->save();

            // Award XP for streaks
            if ($streak->current_count >= 7) {
                $this->awardXP($user, 50, "7-day streak: {$type}");
            }
            if ($streak->current_count >= 30) {
                $this->awardXP($user, 200, "30-day streak: {$type}");
            }

            // Check for streak badges
            $this->checkStreakBadges($user, $type, $streak->current_count);
        }

        return [
            'current' => $streak->current_count,
            'longest' => $streak->longest_count,
            'is_new_day' => true,
        ];
    }

    /**
     * Award achievement
     */
    public function awardAchievement(User $user, string $achievementCode, array $metadata = []): bool
    {
        $achievement = Achievement::where('code', $achievementCode)->first();
        
        if (!$achievement) {
            return false;
        }

        // Check if already earned (for non-repeatable)
        if (!$achievement->is_repeatable) {
            $exists = DB::table('user_achievements')
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->exists();

            if ($exists) {
                return false;
            }
        }

        // Award achievement
        DB::table('user_achievements')->insert([
            'user_id' => $user->id,
            'achievement_id' => $achievement->id,
            'achieved_at' => now(),
            'times_achieved' => 1,
            'metadata' => json_encode($metadata),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Award rewards
        if ($achievement->xp_reward > 0) {
            $this->awardXP($user, $achievement->xp_reward, "Achievement: {$achievement->name}");
        }

        if ($achievement->points_reward > 0) {
            $user->increment('gamification_points', $achievement->points_reward);
        }

        return true;
    }

    /**
     * Award badge
     */
    public function awardBadge(User $user, string $badgeCode, int $progress = 100): bool
    {
        $badge = Badge::where('code', $badgeCode)->first();
        
        if (!$badge) {
            return false;
        }

        // Check if already earned
        $exists = DB::table('user_badges')
            ->where('user_id', $user->id)
            ->where('badge_id', $badge->id)
            ->exists();

        if ($exists) {
            return false;
        }

        // Award badge
        DB::table('user_badges')->insert([
            'user_id' => $user->id,
            'badge_id' => $badge->id,
            'earned_at' => now(),
            'progress' => $progress,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Award points
        if ($badge->points > 0) {
            $user->increment('gamification_points', $badge->points);
        }

        return true;
    }

    /**
     * Update leaderboard
     */
    public function updateLeaderboard(User $user, array $stats): void
    {
        // Get active leaderboards
        $leaderboards = Leaderboard::where('is_active', true)->get();

        foreach ($leaderboards as $leaderboard) {
            // Check if user qualifies for this leaderboard
            if (!$this->userQualifiesForLeaderboard($user, $leaderboard)) {
                continue;
            }

            // Calculate score
            $score = $this->calculateLeaderboardScore($stats);

            // Update or create entry
            LeaderboardEntry::updateOrCreate(
                [
                    'leaderboard_id' => $leaderboard->id,
                    'user_id' => $user->id,
                ],
                [
                    'score' => $score,
                    'questions_solved' => $stats['questions_solved'] ?? 0,
                    'exams_completed' => $stats['exams_completed'] ?? 0,
                    'study_minutes' => $stats['study_minutes'] ?? 0,
                    'accuracy_rate' => $stats['accuracy_rate'] ?? 0,
                ]
            );
        }

        // Recalculate ranks (run async in production)
        $this->recalculateLeaderboardRanks();
    }

    /**
     * Claim daily reward
     */
    public function claimDailyReward(User $user): array
    {
        $today = Carbon::today();

        // Check if already claimed
        $alreadyClaimed = DailyReward::where('user_id', $user->id)
            ->where('claim_date', $today)
            ->exists();

        if ($alreadyClaimed) {
            return [
                'success' => false,
                'message' => 'Bugünkü ödülü zaten aldınız',
            ];
        }

        // Get login streak
        $streak = Streak::where('user_id', $user->id)
            ->where('type', 'daily_login')
            ->first();

        $dayNumber = $streak ? $streak->current_count : 1;

        // Calculate reward
        $reward = $this->calculateDailyReward($dayNumber);

        // Create reward record
        DailyReward::create([
            'user_id' => $user->id,
            'claim_date' => $today,
            'day_number' => $dayNumber,
            'reward_type' => $reward['type'],
            'reward_amount' => $reward['amount'],
            'reward_details' => $reward['details'] ?? null,
        ]);

        // Apply reward
        if ($reward['type'] === 'xp') {
            $this->awardXP($user, $reward['amount'], 'Daily reward');
        } elseif ($reward['type'] === 'points') {
            $user->increment('gamification_points', $reward['amount']);
        }

        return [
            'success' => true,
            'reward' => $reward,
            'day_number' => $dayNumber,
        ];
    }

    /**
     * Calculate daily reward based on streak
     */
    private function calculateDailyReward(int $dayNumber): array
    {
        return match(true) {
            $dayNumber === 1 => ['type' => 'xp', 'amount' => 10],
            $dayNumber === 2 => ['type' => 'xp', 'amount' => 15],
            $dayNumber === 3 => ['type' => 'points', 'amount' => 20],
            $dayNumber === 7 => ['type' => 'xp', 'amount' => 50, 'details' => ['bonus' => 'Week streak!']],
            $dayNumber === 30 => ['type' => 'xp', 'amount' => 200, 'details' => ['bonus' => 'Month streak!']],
            default => ['type' => 'xp', 'amount' => min($dayNumber * 2, 100)],
        };
    }

    /**
     * Check level badges
     */
    private function checkLevelBadges(User $user, int $level): void
    {
        $levelBadges = [
            10 => 'level_10',
            25 => 'level_25',
            50 => 'level_50',
            100 => 'level_100',
        ];

        foreach ($levelBadges as $requiredLevel => $badgeCode) {
            if ($level >= $requiredLevel) {
                $this->awardBadge($user, $badgeCode);
            }
        }
    }

    /**
     * Check streak badges
     */
    private function checkStreakBadges(User $user, string $type, int $count): void
    {
        if ($type === 'daily_login') {
            if ($count === 7) $this->awardBadge($user, 'streak_week');
            if ($count === 30) $this->awardBadge($user, 'streak_month');
            if ($count === 100) $this->awardBadge($user, 'streak_100');
        }
    }

    /**
     * Calculate leaderboard score
     */
    private function calculateLeaderboardScore(array $stats): int
    {
        $questionScore = ($stats['questions_solved'] ?? 0) * 10;
        $examScore = ($stats['exams_completed'] ?? 0) * 100;
        $accuracyBonus = (int)(($stats['accuracy_rate'] ?? 0) * 10);
        
        return $questionScore + $examScore + $accuracyBonus;
    }

    /**
     * Check if user qualifies for leaderboard
     */
    private function userQualifiesForLeaderboard(User $user, Leaderboard $leaderboard): bool
    {
        if ($leaderboard->grade && $user->grade !== $leaderboard->grade) {
            return false;
        }

        return true;
    }

    /**
     * Recalculate leaderboard ranks
     */
    private function recalculateLeaderboardRanks(): void
    {
        $leaderboards = Leaderboard::where('is_active', true)->get();

        foreach ($leaderboards as $leaderboard) {
            $entries = LeaderboardEntry::where('leaderboard_id', $leaderboard->id)
                ->orderBy('score', 'desc')
                ->get();

            $rank = 1;
            foreach ($entries as $entry) {
                $entry->update(['rank' => $rank++]);
            }
        }
    }

    /**
     * Get user's leaderboard position
     */
    public function getUserLeaderboardPosition(User $user, string $leaderboardType): ?array
    {
        $leaderboard = Leaderboard::where('type', $leaderboardType)
            ->where('is_active', true)
            ->first();

        if (!$leaderboard) {
            return null;
        }

        $entry = LeaderboardEntry::where('leaderboard_id', $leaderboard->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$entry) {
            return null;
        }

        return [
            'rank' => $entry->rank,
            'score' => $entry->score,
            'total_entries' => LeaderboardEntry::where('leaderboard_id', $leaderboard->id)->count(),
        ];
    }
}
