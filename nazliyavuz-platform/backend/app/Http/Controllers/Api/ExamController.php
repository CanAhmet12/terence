<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamSession;
use App\Models\ExamSessionQuestion;
use App\Models\ExamAnswer;
use App\Models\Question;
use App\Models\XpLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ExamController extends Controller
{
    // POST /api/v1/exams/start — yeni deneme başlat
    public function start(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'exam_type'          => 'required|in:LGS,TYT,AYT,TYT-AYT,KPSS,Mini',
            'title'              => 'sometimes|string|max:255',
            'duration_minutes'   => 'sometimes|integer|min:5|max:300',
            'question_count'     => 'sometimes|integer|min:5|max:120',
            'subject'            => 'sometimes|nullable|string',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $user     = Auth::user();
        if (! $user) {
            return response()->json(['error' => true, 'message' => 'Oturum bulunamadı.'], 401);
        }

        $examType = $request->exam_type;
        if ($user->isStudent()) {
            $allowedExamTypes = $user->allowedExamTypes();
            if ($examType !== 'Mini' && !in_array($examType, $allowedExamTypes, true)) {
                return response()->json([
                    'error' => true,
                    'message' => 'Sınav türü profilinizle uyumlu değil.',
                ], 422);
            }
        }
        $count    = (int) $request->get('question_count', $this->defaultQuestionCount($examType));
        $duration = (int) $request->get('duration_minutes', $this->defaultDuration($examType));

        try {
            // QuestionController ile aynı kapsam (sınıf + sınav türü) + en az bir şık
            $qQuery = Question::query()
                ->with('options')
                ->where('is_active', true);

            if ($user->isStudent()) {
                $scope = $user->learningScope();
                $allowedExamTypes = $user->allowedExamTypes();
                $qQuery->where('grade', $scope['grade']);
                if ($examType === 'Mini') {
                    $qQuery->where(function ($scopeQuery) use ($allowedExamTypes) {
                        $scopeQuery->whereIn('exam_type', $allowedExamTypes)
                            ->orWhere('exam_type', 'Genel');
                    });
                } else {
                    $typesForExam = array_values(array_unique(array_merge(
                        $allowedExamTypes,
                        [$examType]
                    )));
                    $qQuery->where(function ($scopeQuery) use ($typesForExam) {
                        $scopeQuery->whereIn('exam_type', $typesForExam)
                            ->orWhere('exam_type', 'Genel');
                    });
                }
            } elseif ($examType !== 'Mini') {
                $qQuery->where('exam_type', $examType);
            }
            if ($request->filled('subject')) {
                $qQuery->where('subject', $request->subject);
            }

            $poolSize = min(max($count * 4, 40), 400);
            $candidates = $qQuery->inRandomOrder()->limit($poolSize)->get();
            $withOptions = $candidates->filter(fn ($q) => $q->options->isNotEmpty())->values();
            $selectedQuestions = $withOptions->take($count)->values();

            if ($selectedQuestions->isEmpty()) {
                return response()->json([
                    'error'   => true,
                    'code'    => 'NO_QUESTIONS',
                    'message' => 'Bu sınav türü için yeterli soru bulunamadı',
                ], 404);
            }

            $session = ExamSession::create([
                'user_id'          => $user->id,
                'title'            => $request->get('title', $examType . ' Denemesi'),
                'exam_type'        => $examType,
                'status'            => 'in_progress',
                'duration_minutes' => $duration,
                'started_at'       => now(),
                'total_questions'  => $selectedQuestions->count(),
            ]);

            foreach ($selectedQuestions as $i => $q) {
                ExamSessionQuestion::create([
                    'exam_session_id' => $session->id,
                    'question_id'     => $q->id,
                    'sort_order'      => $i + 1,
                    'section'         => $q->subject,
                ]);
            }

            return response()->json([
                'success'   => true,
                'session'   => $session,
                'questions' => $selectedQuestions->map(fn ($q) => [
                    'id'            => $q->id,
                    'question_text' => $q->question_text,
                    'image_url'     => $q->question_image_url,
                    'type'          => $q->type,
                    'difficulty'    => $q->difficulty,
                    'subject'       => $q->subject,
                    'options'       => $q->options->map(fn ($o) => [
                        'letter' => $o->option_letter,
                        'text'   => $o->option_text,
                        'image'  => $o->option_image_url,
                    ]),
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('ExamController::start', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile() . ':' . $e->getLine(),
            ]);

            return response()->json([
                'error'   => true,
                'code'    => 'EXAM_START_FAILED',
                'message' => config('app.debug') ? $e->getMessage() : 'Deneme başlatılamadı. Lütfen tekrar deneyin.',
            ], 500);
        }
    }

    // POST /api/exams/{id}/answer — cevap gönder
    public function answer(int $sessionId, Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'question_id'       => 'required|integer|exists:questions,id',
            'selected_option'   => 'nullable|string|size:1',
            'is_flagged'        => 'sometimes|boolean',
            'time_spent_seconds'=> 'sometimes|integer|min:0',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $user    = Auth::user();
        $session = ExamSession::where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->findOrFail($sessionId);

        ExamAnswer::updateOrCreate(
            ['exam_session_id' => $session->id, 'question_id' => $request->question_id],
            [
                'user_id'            => $user->id,
                'selected_option'    => $request->selected_option ? strtoupper($request->selected_option) : null,
                'is_flagged'         => $request->get('is_flagged', false),
                'time_spent_seconds' => $request->get('time_spent_seconds', 0),
                'answered_at'        => now(),
            ]
        );

        return response()->json(['success' => true]);
    }

    // POST /api/exams/{id}/finish — denemeyi bitir
    public function finish(int $sessionId): JsonResponse
    {
        $user    = Auth::user();
        $session = ExamSession::with(['sessionQuestions.question.options', 'answers'])
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->findOrFail($sessionId);

        $session->update(['status' => 'completed', 'finished_at' => now()]);

        $answerMap    = $session->answers->keyBy('question_id');
        $breakdown    = [];
        $correct      = 0;
        $wrong        = 0;
        $empty        = 0;

        foreach ($session->sessionQuestions as $sq) {
            $q            = $sq->question;
            $correctLetter= $q->options->firstWhere('is_correct', true)?->option_letter;
            $answer       = $answerMap[$q->id] ?? null;
            $selected     = $answer?->selected_option;
            $subject      = $q->subject ?? 'Diğer';

            if (!isset($breakdown[$subject])) {
                $breakdown[$subject] = ['correct' => 0, 'wrong' => 0, 'empty' => 0, 'net' => 0];
            }

            if (!$selected) {
                $empty++;
                $breakdown[$subject]['empty']++;
            } elseif ($selected === $correctLetter) {
                $correct++;
                $breakdown[$subject]['correct']++;
                if ($answer) $answer->update(['is_correct' => true]);
            } else {
                $wrong++;
                $breakdown[$subject]['wrong']++;
                if ($answer) $answer->update(['is_correct' => false]);
            }
        }

        // Net hesapla (4 yanlış = 1 doğru düşürür)
        $net = round($correct - ($wrong * 0.25), 2);
        foreach ($breakdown as &$s) {
            $s['net'] = round($s['correct'] - ($s['wrong'] * 0.25), 2);
        }

        $timeSpent = $session->started_at ? now()->diffInSeconds($session->started_at) : 0;

        $session->update([
            'correct_count'    => $correct,
            'wrong_count'      => $wrong,
            'empty_count'      => $empty,
            'net_score'        => $net,
            'subject_breakdown'=> $breakdown,
            'time_spent_seconds'=> $timeSpent,
        ]);

        // XP
        $xp = max(10, (int) $net * 2);
        XpLog::create(['user_id' => $user->id, 'amount' => $xp, 'reason' => 'exam_completed',
            'sourceable_type' => 'exam_sessions', 'sourceable_id' => $session->id]);
        DB::table('users')->where('id', $user->id)->update([
            'xp_points'   => DB::raw("xp_points + $xp"),
            'current_net' => $net,
        ]);

        return response()->json([
            'success'           => true,
            'session_id'        => $session->id,
            'correct_count'     => $correct,
            'wrong_count'       => $wrong,
            'empty_count'       => $empty,
            'net_score'         => $net,
            'subject_breakdown' => $breakdown,
            'time_spent_seconds'=> $timeSpent,
            'xp_earned'         => $xp,
        ]);
    }

    // GET /api/exams/{id}/result — sonuç detayı
    public function result(int $sessionId): JsonResponse
    {
        $user    = Auth::user();
        $session = ExamSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->findOrFail($sessionId);

        return response()->json(['success' => true, 'result' => $session]);
    }

    // GET /api/exams/history — geçmiş denemeler
    public function history(): JsonResponse
    {
        $user    = Auth::user();
        $history = ExamSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderByDesc('finished_at')
            ->limit(50)
            ->get([
                'id', 'title', 'exam_type', 'net_score', 'correct_count', 'wrong_count', 'empty_count',
                'finished_at', 'duration_minutes', 'time_spent_seconds', 'total_questions',
            ]);

        return response()->json(['success' => true, 'data' => $history]);
    }

    // GET /api/exams/summary — öğrenci deneme KPI özeti (aggregate)
    public function summary(): JsonResponse
    {
        $user = Auth::user();
        $base = ExamSession::where('user_id', $user->id)->where('status', 'completed');

        $totalCompleted = (clone $base)->count();
        $thisWeekCount  = (clone $base)->where('finished_at', '>=', now()->startOfWeek())->count();

        $nets = (clone $base)->pluck('net_score')->filter(fn ($n) => $n !== null)->map(fn ($n) => (float) $n);
        $avgNet   = $nets->isNotEmpty() ? round($nets->avg(), 2) : 0.0;
        $bestNet  = $nets->isNotEmpty() ? round($nets->max(), 2) : 0.0;

        $times = (clone $base)->whereNotNull('time_spent_seconds')->pluck('time_spent_seconds');
        $avgTimeSeconds = $times->isNotEmpty() ? (int) round($times->avg()) : 0;

        return response()->json([
            'success'            => true,
            'total_completed'    => $totalCompleted,
            'this_week_count'    => $thisWeekCount,
            'avg_net'            => $avgNet,
            'best_net'           => $bestNet,
            'avg_time_seconds'   => $avgTimeSeconds,
        ]);
    }

    // -------------------------------------------------------
    private function defaultQuestionCount(string $type): int
    {
        return match ($type) {
            'TYT'     => 120,
            'AYT'     => 80,
            'TYT-AYT' => 120,
            'LGS'     => 90,
            'KPSS'    => 120,
            default   => 20,
        };
    }

    private function defaultDuration(string $type): int
    {
        return match ($type) {
            'TYT'     => 135,
            'AYT'     => 180,
            'TYT-AYT' => 135,
            'LGS'     => 90,
            'KPSS'    => 120,
            default   => 30,
        };
    }
}
