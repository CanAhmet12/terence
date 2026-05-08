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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    // GET /api/questions — soru listesi (filtreleme + pagination)
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $q = Question::with('options:id,question_id,option_letter,option_text,option_image_url,is_correct')
            ->where('is_active', true);

        if ($request->filled('subject'))    $q->where('subject', $request->subject);
        if ($user && $user->isStudent()) {
            $scope = $user->learningScope();
            $allowedExamTypes = $user->allowedExamTypes();
            if ($request->filled('grade') && (string) $request->grade !== $scope['grade']) {
                return response()->json(['error' => true, 'message' => 'Grade filtresi profilinizle uyumlu değil.'], 422);
            }
            if (
                $request->filled('exam_type')
                && !in_array($request->exam_type, $allowedExamTypes, true)
                && $request->exam_type !== 'all'
            ) {
                return response()->json(['error' => true, 'message' => 'Exam filtresi profilinizle uyumlu değil.'], 422);
            }

            $q->where('grade', $scope['grade'])
                ->where(function ($scopeQuery) use ($allowedExamTypes) {
                    $scopeQuery->whereIn('exam_type', $allowedExamTypes)
                        ->orWhere('exam_type', 'Genel');
                });
        } else {
            if ($request->filled('grade'))      $q->where('grade', $request->grade);
            if ($request->filled('exam_type'))  $q->where('exam_type', $request->exam_type);
        }
        if ($request->filled('difficulty')) $q->where('difficulty', $request->difficulty);
        if ($request->filled('topic_id'))   $q->where('topic_id', $request->topic_id);
        if ($request->filled('kazanim_code')) $q->where('kazanim_code', $request->kazanim_code);
        if ($request->filled('q')) {
            $q->where('question_text', 'like', '%' . $request->q . '%');
        }

        $perPage = min((int) $request->get('per_page', 20), 50);
        $questions = $q->orderBy('id')->paginate($perPage);

        // Kullanıcı cevap geçmişini ekle
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

    // GET /api/questions/bank-summary — KPI + ders kartları (öğrenci kapsamı)
    public function bankSummary(): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->isStudent()) {
            return response()->json(['error' => true, 'message' => 'Yalnızca öğrenci hesapları.'], 403);
        }

        $scope             = $user->learningScope();
        $allowedExamTypes  = $user->allowedExamTypes();

        $scoped = Question::query()
            ->where('is_active', true)
            ->where('grade', $scope['grade'])
            ->where(function ($q) use ($allowedExamTypes) {
                $q->whereIn('exam_type', $allowedExamTypes)
                    ->orWhere('exam_type', 'Genel');
            });

        $totalInScope = (clone $scoped)->count();

        $answersBase = QuestionAnswer::query()
            ->where('question_answers.user_id', $user->id)
            ->where('question_answers.source', 'question_bank')
            ->join('questions', 'questions.id', '=', 'question_answers.question_id')
            ->where('questions.is_active', true)
            ->where('questions.grade', $scope['grade'])
            ->where(function ($q) use ($allowedExamTypes) {
                $q->whereIn('questions.exam_type', $allowedExamTypes)
                    ->orWhere('questions.exam_type', 'Genel');
            });

        $attempts        = (clone $answersBase)->count();
        $correctAttempts = (clone $answersBase)->where('question_answers.is_correct', true)->count();
        $distinctAnswered = (int) ((clone $answersBase)
            ->selectRaw('COUNT(DISTINCT question_answers.question_id) as c')
            ->value('c') ?? 0);

        $accuracyPct = $attempts > 0 ? round(($correctAttempts / $attempts) * 100, 1) : 0.0;
        $netEstimate  = $attempts > 0
            ? round($correctAttempts - (($attempts - $correctAttempts) / 4), 2)
            : 0.0;

        $subjects = (clone $scoped)
            ->select('subject', DB::raw('COUNT(*) as total'))
            ->whereNotNull('subject')
            ->where('subject', '!=', '')
            ->groupBy('subject')
            ->orderBy('subject')
            ->get();

        $answeredBySubject = QuestionAnswer::query()
            ->where('question_answers.user_id', $user->id)
            ->where('question_answers.source', 'question_bank')
            ->join('questions', 'questions.id', '=', 'question_answers.question_id')
            ->where('questions.is_active', true)
            ->where('questions.grade', $scope['grade'])
            ->where(function ($q) use ($allowedExamTypes) {
                $q->whereIn('questions.exam_type', $allowedExamTypes)
                    ->orWhere('questions.exam_type', 'Genel');
            })
            ->select(
                'questions.subject',
                DB::raw('COUNT(DISTINCT question_answers.question_id) as answered'),
                DB::raw('SUM(CASE WHEN question_answers.is_correct = 1 THEN 1 ELSE 0 END) as correct_hits'),
                DB::raw('COUNT(question_answers.id) as attempts')
            )
            ->groupBy('questions.subject')
            ->get()
            ->keyBy('subject');

        $subjectRows = $subjects->map(function ($row) use ($answeredBySubject) {
            $ab          = $answeredBySubject->get($row->subject);
            $answered    = (int) ($ab->answered ?? 0);
            $att         = (int) ($ab->attempts ?? 0);
            $correctHits = (int) ($ab->correct_hits ?? 0);
            $rate        = $att > 0 ? round(($correctHits / $att) * 100, 1) : null;
            $query       = http_build_query(['subject' => $row->subject]);

            return [
                'subject'         => $row->subject,
                'total'           => (int) $row->total,
                'answered'        => $answered,
                'correct_rate'    => $rate,
                'cta_deep_link'   => '/ogrenci/soru-bankasi?' . $query,
            ];
        })->values();

        $examTabs = collect($allowedExamTypes)->map(function ($et) use ($scoped) {
            $cnt = (clone $scoped)->where('exam_type', $et)->count();

            return [
                'exam_type'      => $et,
                'question_count' => $cnt,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'kpis' => [
                    'total_questions'   => $totalInScope,
                    'answered_distinct' => $distinctAnswered,
                    'attempts'          => $attempts,
                    'accuracy_pct'      => $accuracyPct,
                    'net_estimate'      => $netEstimate,
                ],
                'subjects'  => $subjectRows,
                'exam_tabs' => $examTabs,
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
        $user = Auth::user();
        if ($user && $user->isStudent()) {
            $scope = $user->learningScope();
            if ((string) $source->grade !== $scope['grade']) {
                return response()->json(['error' => true, 'message' => 'Soru profil kapsamınız dışında.'], 403);
            }
            if (!$user->matchesExamType($source->exam_type)) {
                return response()->json(['error' => true, 'message' => 'Soru profil kapsamınız dışında.'], 403);
            }
        }

        $similar = Question::where('id', '!=', $source->id)
            ->where('is_active', true)
            ->where(function ($q) use ($source) {
                $q->where('subject', $source->subject)
                  ->orWhere('kazanim_code', $source->kazanim_code);
            });
        if ($user && $user->isStudent()) {
            $scope = $user->learningScope();
            $allowedExamTypes = $user->allowedExamTypes();
            $similar->where('grade', $scope['grade'])
                ->where(function ($query) use ($allowedExamTypes) {
                    $query->whereIn('exam_type', $allowedExamTypes)
                        ->orWhere('exam_type', 'Genel');
                });
        }
        $similar = $similar
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

        if ($user->isStudent()) {
            $scope = $user->learningScope();
            if ((string) $question->grade !== $scope['grade']) {
                return response()->json(['error' => true, 'message' => 'Soru profil kapsamınız dışında.'], 403);
            }
            $examOk = ($question->exam_type === 'Genel') || $user->matchesExamType((string) $question->exam_type);
            if (!$examOk) {
                return response()->json(['error' => true, 'message' => 'Soru profil kapsamınız dışında.'], 403);
            }
        }

        $idempHeader    = $request->header('Idempotency-Key');
        $idempCacheKey  = null;
        if (is_string($idempHeader) && strlen($idempHeader) >= 8 && strlen($idempHeader) <= 120) {
            $idempCacheKey = 'question_answer:idemp:' . $user->id . ':' . hash('sha256', $idempHeader);
            $cached        = Cache::get($idempCacheKey);
            if (is_array($cached)) {
                return response()->json($cached);
            }
        }

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

        $payload = [
            'success'        => true,
            'is_correct'     => $isCorrect,
            'correct'        => $isCorrect,
            'correct_option' => $correctOption?->option_letter,
            'explanation'    => $question->solution_text,
            'solution_video' => $question->solution_video_url,
            'xp_earned'      => $isCorrect ? 5 : 0,
        ];

        if ($idempCacheKey !== null) {
            Cache::put($idempCacheKey, $payload, 86400);
        }

        return response()->json($payload);
    }

    // GET /api/questions/weak — zayıf kazanımlar
    public function weakAchievements(): JsonResponse
    {
        $user = Auth::user();

        $weak = QuestionAnswer::where('question_answers.user_id', $user->id)
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->whereNotNull('questions.kazanim_code');

        if ($user->isStudent()) {
            $scope            = $user->learningScope();
            $allowedExamTypes = $user->allowedExamTypes();
            $weak->where('questions.grade', $scope['grade'])
                ->where(function ($q) use ($allowedExamTypes) {
                    $q->whereIn('questions.exam_type', $allowedExamTypes)
                        ->orWhere('questions.exam_type', 'Genel');
                });
        }

        $weak = $weak->select(
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
