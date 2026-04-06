<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AICoachService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AICoachController extends Controller
{
    public function __construct(private AICoachService $aiCoach) {}

    /**
     * Get personalized recommendations
     */
    public function getRecommendations(): JsonResponse
    {
        $result = $this->aiCoach->getStudyRecommendations(Auth::user());

        if (!$result['success']) {
            return response()->json([
                'error' => true,
                'message' => $result['error'],
            ], 500);
        }

        return response()->json([
            'success' => true,
            'recommendations' => $result['recommendations'],
            'performance' => $result['performance_analysis'],
        ]);
    }

    /**
     * Explain question solution
     */
    public function explainSolution(Request $request): JsonResponse
    {
        $request->validate([
            'question_id' => 'required|integer|exists:questions,id',
            'user_answer' => 'sometimes|string',
        ]);

        $result = $this->aiCoach->explainSolution(
            $request->question_id,
            $request->user_answer
        );

        if (!$result['success']) {
            return response()->json([
                'error' => true,
                'message' => $result['error'],
            ], $result['error'] === 'Soru bulunamadı' ? 404 : 500);
        }

        return response()->json([
            'success' => true,
            'explanation' => $result['explanation'],
            'question' => $result['question'],
        ]);
    }

    /**
     * Chat with AI coach
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:500',
            'conversation_history' => 'sometimes|array',
        ]);

        $result = $this->aiCoach->chat(
            Auth::user(),
            $request->message,
            $request->conversation_history ?? []
        );

        if (!$result['success']) {
            return response()->json([
                'error' => true,
                'message' => $result['error'],
                'limit' => $result['limit'] ?? null,
            ], 429);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'remaining_requests' => $result['remaining_requests'],
        ]);
    }

    /**
     * Get practice questions for weak areas
     */
    public function getPracticeQuestions(Request $request): JsonResponse
    {
        $count = $request->input('count', 5);
        $result = $this->aiCoach->generatePracticeQuestions(Auth::user(), $count);

        return response()->json([
            'success' => true,
            'questions' => $result['questions'],
            'weak_areas' => $result['weak_areas'] ?? null,
            'message' => $result['message'] ?? null,
        ]);
    }

    /**
     * Get conversation history
     */
    public function getConversationHistory(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 20);

        $history = \DB::table('ai_coach_conversations')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'history' => $history,
        ]);
    }
}
