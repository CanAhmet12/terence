<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\Kazanim;
use App\Models\XpLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    // GET /api/questions — soru listesi (filtreleme + pagination)
    public function index(Request $request): JsonResponse
    {
        $q = Question::with('options:id,question_id,option_letter,option_text,option_image_url,is_correct')
            ->where('is_active', true);

        if ($request->filled('subject'))    $q->where('subject', $request->subject);
        if ($request->filled('grade'))      $q->where('grade', $request->grade);
        if ($request->filled('exam_type'))  $q->where('exam_type', $request->exam_type);
        if ($request->filled('difficulty')) $q->where('difficulty', $request->difficulty);
        if ($request->filled('topic_id'))   $q->where('topic_id', $request->topic_id);
        if ($request->filled('kazanim_code')) $q->where('kazanim_code', $request->kazanim_code);
        if ($request->filled('q')) {
            $q->where('question_text', 'like', '%' . $request->q . '%');
        }

        $perPage = min((int) $request->get('per_page', 20), 50);
        $questions = $q->orderBy('id')->paginate($perPage);

        // Kullanıcı cevap geçmişini ekle
        $user = Auth::user();
        if ($user) {
            $answered = QuestionAnswer::where('user_id', $user->id)
                ->whereIn('question_id', $questions->pluck('id'))
                ->latest()
                ->get()
                ->keyBy('question_id');

            $questions->getCollection()->transform(function ($q) use ($answered) {
                $q->user_answer = $answered[$q->id] ?? null;
                return $q;
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $questions->items(),
            'meta'    => [
                'current_page' => $questions->currentPage(),
                'last_page'    => $questions->lastPage(),
                'total'        => $questions->total(),
                'per_page'     => $questions->perPage(),
            ],
        ]);
    }

    // GET /api/questions/similar — benzer sorular
    public function similar(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'question_id' => 'required|integer|exists:questions,id',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $source = Question::find($request->question_id);
        $similar = Question::where('id', '!=', $source->id)
            ->where('is_active', true)
            ->where(function ($q) use ($source) {
                $q->where('subject', $source->subject)
                  ->orWhere('kazanim_code', $source->kazanim_code);
            })
            ->inRandomOrder()->limit(5)
            ->with('options:id,question_id,option_letter,option_text,is_correct')
            ->get();

        return response()->json(['success' => true, 'data' => $similar]);
    }

    // POST /api/questions/answer — soru cevapla
    public function answer(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'question_id'        => 'required|integer|exists:questions,id',
            'selected_option'    => 'nullable|string|size:1',
            'answer'             => 'nullable|string|size:1',
            'time_spent_seconds' => 'sometimes|integer|min:0',
            'time_spent'         => 'sometimes|integer|min:0',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $user     = Auth::user();
        $question = Question::with('options')->findOrFail($request->question_id);

        // 'answer' veya 'selected_option' alanını al
        $selectedOption = $request->selected_option ?? $request->answer;

        $correctOption = $question->options->firstWhere('is_correct', true);
        $isCorrect = $selectedOption &&
                     $correctOption &&
                     strtoupper($selectedOption) === strtoupper($correctOption->option_letter);

        $timeSpent = $request->get('time_spent_seconds', $request->get('time_spent', 0));

        // Cevabı kaydet
        $answer = QuestionAnswer::create([
            'user_id'            => $user->id,
            'question_id'        => $question->id,
            'selected_option'    => $selectedOption ? strtoupper($selectedOption) : null,
            'is_correct'         => $isCorrect,
            'time_spent_seconds' => $timeSpent,
            'source'             => 'question_bank',
        ]);

        // Soru istatistiklerini güncelle
        DB::table('questions')->where('id', $question->id)->update([
            'total_attempts'   => DB::raw('total_attempts + 1'),
            'correct_attempts' => DB::raw($isCorrect ? 'correct_attempts + 1' : 'correct_attempts'),
            'accuracy_rate'    => DB::raw('ROUND((correct_attempts / total_attempts) * 100, 2)'),
        ]);

        // XP ver
        if ($isCorrect) {
            $this->awardXp($user->id, 5, 'question_correct', 'question_answers', $answer->id);
        }

        return response()->json([
            'success'        => true,
            'is_correct'     => $isCorrect,
            'correct'        => $isCorrect,
            'correct_option' => $correctOption?->option_letter,
            'explanation'    => $question->solution_text,
            'solution_video' => $question->solution_video_url,
            'xp_earned'      => $isCorrect ? 5 : 0,
        ]);
    }

    // GET /api/questions/weak — zayıf kazanımlar
    public function weakAchievements(): JsonResponse
    {
        $user = Auth::user();

        $weak = QuestionAnswer::where('user_id', $user->id)
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->whereNotNull('questions.kazanim_code')
            ->select(
                'questions.kazanim_code',
                'questions.subject',
                DB::raw('COUNT(*) as total_count'),
                DB::raw('SUM(CASE WHEN question_answers.is_correct = 1 THEN 1 ELSE 0 END) as correct_count'),
                DB::raw('SUM(CASE WHEN question_answers.is_correct = 0 AND question_answers.selected_option IS NOT NULL THEN 1 ELSE 0 END) as wrong_count')
            )
            ->groupBy('questions.kazanim_code', 'questions.subject')
            ->having('total_count', '>=', 3)
            ->having(DB::raw('ROUND((correct_count / total_count) * 100, 2)'), '<', 60)
            ->orderByRaw('ROUND((correct_count / total_count) * 100, 2) ASC')
            ->limit(20)
            ->get();

        $result = $weak->map(function ($row) {
            $kazanim = Kazanim::where('kod', $row->kazanim_code)->first();
            return [
                'id'            => crc32($row->kazanim_code),
                'kod'           => $row->kazanim_code,
                'konu'          => $kazanim?->konu ?? $row->kazanim_code,
                'subject'       => $row->subject ?? $kazanim?->subject,
                'wrong_count'   => (int) $row->wrong_count,
                'total_count'   => (int) $row->total_count,
                'accuracy_rate' => $row->total_count > 0 ? round(($row->correct_count / $row->total_count) * 100, 1) : 0,
                'suggestion'    => 'Bu konuya daha fazla çalışmanız önerilir.',
                'video_url'     => null,
            ];
        });

        return response()->json(['success' => true, 'data' => $result]);
    }

    // GET /api/kazanimlar — kazanım listesi
    public function kazanimlar(Request $request): JsonResponse
    {
        $q = Kazanim::where('is_active', true);
        if ($request->filled('subject'))    $q->where('subject', $request->subject);
        if ($request->filled('grade'))      $q->where('grade', $request->grade);
        if ($request->filled('exam_type'))  $q->where('exam_type', $request->exam_type);
        return response()->json(['success' => true, 'data' => $q->orderBy('kod')->get()]);
    }

    // -------------------------------------------------------
    private function awardXp(int $userId, int $amount, string $reason, string $type, int $sourceId): void
    {
        XpLog::create([
            'user_id'       => $userId,
            'amount'        => $amount,
            'reason'        => $reason,
            'sourceable_type'=> $type,
            'sourceable_id' => $sourceId,
        ]);
        DB::table('users')->where('id', $userId)->update([
            'xp_points' => DB::raw("xp_points + $amount"),
            'level'     => DB::raw("GREATEST(1, FLOOR(SQRT(xp_points / 100)) + 1)"),
        ]);
    }
}
