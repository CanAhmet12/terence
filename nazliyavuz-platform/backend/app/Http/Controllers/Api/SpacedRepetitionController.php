<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SpacedRepetitionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class SpacedRepetitionController extends Controller
{
    public function __construct(private SpacedRepetitionService $srService) {}

    /**
     * Get due questions for review
     */
    public function getDueQuestions(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 20);
        $result = $this->srService->getDueQuestions(Auth::user(), $limit);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Process answer and update card
     */
    public function processAnswer(Request $request): JsonResponse
    {
        $request->validate([
            'question_id' => 'required|integer|exists:questions,id',
            'is_correct' => 'required|boolean',
            'time_spent_seconds' => 'required|integer|min:0',
        ]);

        $result = $this->srService->processAnswer(
            Auth::user(),
            $request->question_id,
            $request->is_correct,
            $request->time_spent_seconds
        );

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Bir sonraki tekrar: ' . $result['next_review_date']->format('d.m.Y'),
        ]);
    }

    /**
     * Get spaced repetition statistics
     */
    public function getStatistics(): JsonResponse
    {
        $stats = $this->srService->getStatistics(Auth::user());

        return response()->json([
            'success' => true,
            'statistics' => $stats,
        ]);
    }

    /**
     * Get study plan for today
     */
    public function getStudyPlan(): JsonResponse
    {
        $plan = $this->srService->getStudyPlan(Auth::user());

        return response()->json([
            'success' => true,
            'plan' => $plan,
        ]);
    }

    /**
     * Reset a card
     */
    public function resetCard(int $questionId): JsonResponse
    {
        $success = $this->srService->resetCard(Auth::user(), $questionId);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Kart sıfırlandı',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => 'Kart bulunamadı',
        ], 404);
    }

    /**
     * Suspend a card
     */
    public function suspendCard(int $questionId): JsonResponse
    {
        $success = $this->srService->suspendCard(Auth::user(), $questionId);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Kart askıya alındı',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => 'Kart bulunamadı',
        ], 404);
    }

    /**
     * Unsuspend a card
     */
    public function unsuspendCard(int $questionId): JsonResponse
    {
        $success = $this->srService->unsuspendCard(Auth::user(), $questionId);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Kart tekrar aktif',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => 'Kart bulunamadı',
        ], 404);
    }
}
