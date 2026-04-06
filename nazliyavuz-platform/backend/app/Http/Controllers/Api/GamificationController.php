<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GamificationService;
use App\Models\{Badge, Achievement, Leaderboard, LeaderboardEntry, Streak};
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GamificationController extends Controller
{
    public function __construct(private GamificationService $gamification) {}

    /**
     * Get user's gamification profile
     */
    public function profile(): JsonResponse
    {
        $user = Auth::user();

        $data = [
            'xp' => $user->xp,
            'level' => $user->level,
            'points' => $user->gamification_points,
            'xp_for_next_level' => $this->gamification->getXPForNextLevel($user->level),
            'badges_count' => DB::table('user_badges')->where('user_id', $user->id)->count(),
            'achievements_count' => DB::table('user_achievements')->where('user_id', $user->id)->count(),
            'streaks' => Streak::where('user_id', $user->id)->where('is_active', true)->get(),
        ];

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Get user's badges
     */
    public function badges(): JsonResponse
    {
        $user = Auth::user();

        $badges = Badge::whereHas('users', function ($q) use ($user) {
            $q->where('users.id', $user->id);
        })->with(['users' => function ($q) use ($user) {
            $q->where('users.id', $user->id);
        }])->get();

        return response()->json(['success' => true, 'badges' => $badges]);
    }

    /**
     * Get all available badges
     */
    public function availableBadges(): JsonResponse
    {
        $user = Auth::user();
        
        $earnedBadgeIds = DB::table('user_badges')
            ->where('user_id', $user->id)
            ->pluck('badge_id');

        $badges = Badge::where('is_active', true)->get()->map(function ($badge) use ($earnedBadgeIds) {
            $badge->is_earned = $earnedBadgeIds->contains($badge->id);
            return $badge;
        });

        return response()->json(['success' => true, 'badges' => $badges]);
    }

    /**
     * Get user's achievements
     */
    public function achievements(): JsonResponse
    {
        $user = Auth::user();

        $achievements = Achievement::whereHas('users', function ($q) use ($user) {
            $q->where('users.id', $user->id);
        })->with(['users' => function ($q) use ($user) {
            $q->where('users.id', $user->id);
        }])->get();

        return response()->json(['success' => true, 'achievements' => $achievements]);
    }

    /**
     * Get leaderboard
     */
    public function leaderboard(string $type = 'global'): JsonResponse
    {
        $leaderboard = Leaderboard::where('type', $type)
            ->where('is_active', true)
            ->first();

        if (!$leaderboard) {
            return response()->json(['error' => true, 'message' => 'Leaderboard bulunamadı'], 404);
        }

        $entries = LeaderboardEntry::where('leaderboard_id', $leaderboard->id)
            ->with('user:id,name,profile_image,level')
            ->orderBy('rank')
            ->limit(100)
            ->get();

        // Get current user's position
        $userPosition = $this->gamification->getUserLeaderboardPosition(Auth::user(), $type);

        return response()->json([
            'success' => true,
            'leaderboard' => $leaderboard,
            'entries' => $entries,
            'user_position' => $userPosition,
        ]);
    }

    /**
     * Claim daily reward
     */
    public function claimDailyReward(): JsonResponse
    {
        $result = $this->gamification->claimDailyReward(Auth::user());

        if (!$result['success']) {
            return response()->json(['error' => true, 'message' => $result['message']], 400);
        }

        return response()->json([
            'success' => true,
            'reward' => $result['reward'],
            'day_number' => $result['day_number'],
            'message' => 'Günlük ödül alındı!',
        ]);
    }

    /**
     * Get user's streaks
     */
    public function streaks(): JsonResponse
    {
        $streaks = Streak::where('user_id', Auth::id())->get();

        return response()->json(['success' => true, 'streaks' => $streaks]);
    }

    /**
     * Get gamification stats
     */
    public function stats(): JsonResponse
    {
        $user = Auth::user();

        $stats = [
            'total_xp' => $user->xp,
            'current_level' => $user->level,
            'total_points' => $user->gamification_points,
            'total_badges' => DB::table('user_badges')->where('user_id', $user->id)->count(),
            'total_achievements' => DB::table('user_achievements')->where('user_id', $user->id)->count(),
            'longest_streak' => Streak::where('user_id', $user->id)->max('longest_count'),
            'current_streak' => Streak::where('user_id', $user->id)
                ->where('type', 'daily_login')
                ->value('current_count') ?? 0,
        ];

        return response()->json(['success' => true, 'stats' => $stats]);
    }
}
