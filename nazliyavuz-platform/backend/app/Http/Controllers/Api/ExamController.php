<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamSession;
use App\Models\ExamSessionQuestion;
use App\Models\ExamAnswer;
use App\Models\ExamTemplate;
use App\Models\Question;
use App\Models\User;
use App\Models\XpLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class ExamController extends Controller
{
    // GET /api/v1/exams/templates — öğrenci: çözülebilir yayınlı şablonlar
    public function templateCatalog(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => true, 'message' => 'Oturum bulunamadı.'], 401);
        }
        if (! Schema::hasTable('exam_templates')) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $v = Validator::make($request->all(), [
            'exam_type' => 'sometimes|nullable|string|max:32',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $q = ExamTemplate::query()
            ->where('is_active', true)
            ->whereNotNull('published_at')
            ->withCount('templateQuestions')
            ->orderByDesc('sort_order')
            ->orderBy('title');

        if ($request->filled('exam_type')) {
            $q->where('exam_type', $request->exam_type);
        }

        $rows = $q->get()->filter(fn (ExamTemplate $t) => $this->studentCanBrowseTemplate($user, $t))
            ->filter(fn (ExamTemplate $t) => $this->templateFullyPlayable($user, $t))
            ->values()
            ->map(fn (ExamTemplate $t) => [
                'id'               => $t->id,
                'title'            => $t->title,
                'slug'             => $t->slug,
                'exam_type'        => $t->exam_type,
                'grade'            => $t->grade,
                'duration_minutes' => (int) $t->duration_minutes,
                'description'      => $t->description,
                'question_count'   => (int) $t->template_questions_count,
            ]);

        return response()->json(['success' => true, 'data' => $rows]);
    }

    // POST /api/v1/exams/start — havuz veya sabit şablon
    public function start(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'mode'               => 'sometimes|in:pool,template',
            'exam_type'          => 'required|in:LGS,TYT,AYT,TYT-AYT,KPSS,Mini',
            'title'              => 'sometimes|string|max:255',
            'duration_minutes'   => 'sometimes|integer|min:5|max:300',
            'question_count'     => 'sometimes|integer|min:5|max:120',
            'subject'            => 'sometimes|nullable|string',
            'exam_template_id'   => 'sometimes|nullable|integer',
            'template_slug'      => 'sometimes|nullable|string|max:160',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => true, 'message' => 'Oturum bulunamadı.'], 401);
        }

        $examType = $request->exam_type;
        if ($user->isStudent()) {
            $allowedExamTypes = $user->allowedExamTypes();
            if ($examType !== 'Mini' && ! in_array($examType, $allowedExamTypes, true)) {
                return response()->json([
                    'error' => true,
                    'message' => 'Sınav türü profilinizle uyumlu değil.',
                ], 422);
            }
        }

        $useTemplate = Schema::hasTable('exam_templates')
            && (
                $request->input('mode') === 'template'
                || $request->filled('exam_template_id')
                || $request->filled('template_slug')
            );

        if ($useTemplate) {
            return $this->startFromTemplate($request, $user, $examType);
        }

        return $this->startFromPool($request, $user, $examType);
    }

    private function startFromTemplate(Request $request, User $user, string $requestExamType): JsonResponse
    {
        if (! $request->filled('exam_template_id') && ! $request->filled('template_slug')) {
            return response()->json([
                'error' => true,
                'code'  => 'TEMPLATE_REQUIRED',
                'message' => 'Sabit deneme için exam_template_id veya template_slug gönderin.',
            ], 422);
        }

        $template = $request->filled('exam_template_id')
            ? ExamTemplate::find($request->exam_template_id)
            : ExamTemplate::where('slug', $request->template_slug)->first();

        if (! $template || ! $template->is_active || ! $template->published_at) {
            return response()->json([
                'error' => true,
                'code'  => 'TEMPLATE_NOT_FOUND',
                'message' => 'Deneme bulunamadı veya yayında değil.',
            ], 404);
        }

        if ($template->exam_type !== $requestExamType) {
            return response()->json([
                'error' => true,
                'code'  => 'EXAM_TYPE_MISMATCH',
                'message' => 'Seçilen sınav türü bu deneme ile eşleşmiyor.',
            ], 422);
        }

        if ($user->isStudent()) {
            if ($template->grade !== null && $template->grade !== '') {
                $g = $user->learningScope()['grade'] ?? 'all';
                if ($g !== 'all' && (string) (int) $template->grade !== (string) $g) {
                    return response()->json([
                        'error' => true,
                        'code'  => 'TEMPLATE_GRADE_MISMATCH',
                        'message' => 'Bu deneme sınıfınız için tanımlı değil.',
                    ], 422);
                }
            }
        }

        $duration = (int) $request->get(
            'duration_minutes',
            $template->duration_minutes ?: $this->defaultDuration($template->exam_type)
        );

        try {
            $rows = $template->templateQuestions()->with(['question.options'])->orderBy('sort_order')->get();
            $ordered = [];
            foreach ($rows as $row) {
                $q = $row->question;
                if (! $q) {
                    return response()->json([
                        'error' => true,
                        'code'  => 'TEMPLATE_INCOMPLETE',
                        'message' => 'Şablonda geçersiz soru kaydı var. Yöneticiye bildirin.',
                    ], 422);
                }
                if (! $this->questionAllowedForExamStart($user, $q, $template->exam_type)) {
                    return response()->json([
                        'error' => true,
                        'code'  => 'TEMPLATE_QUESTION_FORBIDDEN',
                        'message' => 'Bu denemedeki sorulardan bazıları profiliniz için uygun değil.',
                    ], 422);
                }
                $ordered[] = ['question' => $q, 'section' => $row->section];
            }

            if (count($ordered) < 1) {
                return response()->json([
                    'error' => true,
                    'code'  => 'NO_QUESTIONS',
                    'message' => 'Bu denemede soru bulunamadı',
                ], 404);
            }

            $selectedQuestions = collect($ordered)->pluck('question')->values();

            $sessionData = [
                'user_id'            => $user->id,
                'title'              => $request->get('title', $template->title),
                'exam_type'          => $template->exam_type,
                'status'             => 'in_progress',
                'duration_minutes'   => $duration,
                'started_at'         => now(),
                'total_questions'    => $selectedQuestions->count(),
            ];
            if (Schema::hasColumn('exam_sessions', 'exam_template_id')) {
                $sessionData['exam_template_id'] = $template->id;
            }
            $session = ExamSession::create($sessionData);

            foreach ($ordered as $i => $item) {
                $q = $item['question'];
                $section = $item['section'] ?: $q->subject;
                ExamSessionQuestion::create([
                    'exam_session_id' => $session->id,
                    'question_id'     => $q->id,
                    'sort_order'      => $i + 1,
                    'section'         => $section,
                ]);
            }

            return response()->json([
                'success'   => true,
                'session'   => $session,
                'questions' => $this->mapQuestionsForClient($selectedQuestions),
            ]);
        } catch (\Throwable $e) {
            Log::error('ExamController::startFromTemplate', [
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

    private function startFromPool(Request $request, User $user, string $examType): JsonResponse
    {
        $count    = (int) $request->get('question_count', $this->defaultQuestionCount($examType));
        $duration = (int) $request->get('duration_minutes', $this->defaultDuration($examType));

        try {
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
                'status'           => 'in_progress',
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
                'questions' => $this->mapQuestionsForClient($selectedQuestions),
            ]);
        } catch (\Throwable $e) {
            Log::error('ExamController::startFromPool', [
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
            'question_id'        => 'required|integer|exists:questions,id',
            'selected_option'    => 'nullable|string|size:1',
            'is_flagged'         => 'sometimes|boolean',
            'time_spent_seconds' => 'sometimes|integer|min:0',
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

        $answerMap = $session->answers->keyBy('question_id');
        $breakdown  = [];
        $correct    = 0;
        $wrong      = 0;
        $empty      = 0;

        foreach ($session->sessionQuestions as $sq) {
            $q             = $sq->question;
            $correctLetter = $q->options->firstWhere('is_correct', true)?->option_letter;
            $answer        = $answerMap[$q->id] ?? null;
            $selected      = $answer?->selected_option;
            $subject       = (string) ($sq->section ?: ($q->subject ?? 'Diğer'));

            if (! isset($breakdown[$subject])) {
                $breakdown[$subject] = ['correct' => 0, 'wrong' => 0, 'empty' => 0, 'net' => 0];
            }

            if (! $selected) {
                $empty++;
                $breakdown[$subject]['empty']++;
            } elseif ($selected === $correctLetter) {
                $correct++;
                $breakdown[$subject]['correct']++;
                if ($answer) {
                    $answer->update(['is_correct' => true]);
                }
            } else {
                $wrong++;
                $breakdown[$subject]['wrong']++;
                if ($answer) {
                    $answer->update(['is_correct' => false]);
                }
            }
        }

        $net = round($correct - ($wrong * 0.25), 2);
        foreach ($breakdown as &$s) {
            $s['net'] = round($s['correct'] - ($s['wrong'] * 0.25), 2);
        }

        $timeSpent = $session->started_at ? now()->diffInSeconds($session->started_at) : 0;

        $session->update([
            'correct_count'     => $correct,
            'wrong_count'       => $wrong,
            'empty_count'       => $empty,
            'net_score'         => $net,
            'subject_breakdown' => $breakdown,
            'time_spent_seconds'=> $timeSpent,
        ]);

        $xp = max(10, (int) $net * 2);
        XpLog::create(['user_id' => $user->id, 'amount' => $xp, 'reason' => 'exam_completed',
            'sourceable_type' => 'exam_sessions', 'sourceable_id' => $session->id]);
        DB::table('users')->where('id', $user->id)->update([
            'xp_points'   => DB::raw("xp_points + $xp"),
            'current_net' => $net,
        ]);

        return response()->json([
            'success'            => true,
            'session_id'         => $session->id,
            'correct_count'      => $correct,
            'wrong_count'        => $wrong,
            'empty_count'        => $empty,
            'net_score'          => $net,
            'subject_breakdown'  => $breakdown,
            'time_spent_seconds' => $timeSpent,
            'xp_earned'          => $xp,
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
        $user = Auth::user();
        $cols = [
            'id', 'title', 'exam_type', 'net_score', 'correct_count', 'wrong_count', 'empty_count',
            'finished_at', 'duration_minutes', 'time_spent_seconds', 'total_questions',
        ];
        if (Schema::hasColumn('exam_sessions', 'exam_template_id')) {
            $cols[] = 'exam_template_id';
        }

        $history = ExamSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderByDesc('finished_at')
            ->limit(50)
            ->get($cols);

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
        $avgNet  = $nets->isNotEmpty() ? round($nets->avg(), 2) : 0.0;
        $bestNet = $nets->isNotEmpty() ? round($nets->max(), 2) : 0.0;

        $times = (clone $base)->whereNotNull('time_spent_seconds')->pluck('time_spent_seconds');
        $avgTimeSeconds = $times->isNotEmpty() ? (int) round($times->avg()) : 0;

        return response()->json([
            'success'          => true,
            'total_completed'  => $totalCompleted,
            'this_week_count'  => $thisWeekCount,
            'avg_net'          => $avgNet,
            'best_net'         => $bestNet,
            'avg_time_seconds' => $avgTimeSeconds,
        ]);
    }

    private function mapQuestionsForClient(Collection $selectedQuestions): array
    {
        return $selectedQuestions->map(fn ($q) => [
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
        ])->values()->all();
    }

    private function questionAllowedForExamStart(User $user, Question $q, string $examType): bool
    {
        if (! $q->is_active) {
            return false;
        }
        $q->loadMissing('options');
        if ($q->options->isEmpty()) {
            return false;
        }

        if ($user->isStudent()) {
            $scope = $user->learningScope();
            if ($scope['grade'] !== 'all' && (string) (int) $q->grade !== (string) $scope['grade']) {
                return false;
            }
            $allowedExamTypes = $user->allowedExamTypes();
            if ($examType === 'Mini') {
                return in_array($q->exam_type, $allowedExamTypes, true) || $q->exam_type === 'Genel';
            }
            $typesForExam = array_values(array_unique(array_merge(
                $allowedExamTypes,
                [$examType]
            )));

            return in_array($q->exam_type, $typesForExam, true) || $q->exam_type === 'Genel';
        }
        if ($examType === 'Mini') {
            return true;
        }

        return $q->exam_type === $examType;
    }

    private function studentCanBrowseTemplate(User $user, ExamTemplate $t): bool
    {
        if (! $user->isStudent()) {
            return true;
        }
        $allowed = $user->allowedExamTypes();
        if ($t->exam_type === 'Mini') {
            if ($t->grade !== null && $t->grade !== '') {
                $g = $user->learningScope()['grade'] ?? 'all';
                if ($g !== 'all' && (string) (int) $t->grade !== (string) $g) {
                    return false;
                }
            }

            return true;
        }
        if (! in_array($t->exam_type, $allowed, true)) {
            return false;
        }
        if ($t->grade !== null && $t->grade !== '') {
            $g = $user->learningScope()['grade'] ?? 'all';
            if ($g !== 'all' && (string) (int) $t->grade !== (string) $g) {
                return false;
            }
        }

        return true;
    }

    private function templateFullyPlayable(User $user, ExamTemplate $template): bool
    {
        $rows = $template->templateQuestions()->with(['question.options'])->orderBy('sort_order')->get();
        foreach ($rows as $row) {
            $q = $row->question;
            if (! $q || ! $this->questionAllowedForExamStart($user, $q, $template->exam_type)) {
                return false;
            }
        }

        return $rows->isNotEmpty();
    }

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
