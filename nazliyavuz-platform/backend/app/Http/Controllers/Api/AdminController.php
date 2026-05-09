<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\ExamSession;
use App\Models\Payment;
use App\Models\ContentItem;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\QuestionBankDisplay;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AdminController extends Controller
{
    // GET /api/admin/stats
    public function stats(): JsonResponse
    {
        $totalUsers        = User::count();
        $totalStudents     = User::where('role', 'student')->count();
        $totalTeachers     = User::where('role', 'teacher')->count();
        $activeToday       = User::whereDate('last_login_at', today())->count();
        $totalCourses      = Course::where('is_active', true)->count();
        $totalQuestions    = Question::where('is_active', true)->count();
        $totalExams        = ExamSession::where('status', 'completed')->count();
        $monthlyRevenue    = $this->terenceMonthlyPaymentSum();
        $activeSubscriptions = User::query()
            ->where('role', 'student')
            ->whereNotNull('subscription_plan')
            ->whereNotIn('subscription_plan', ['free', ''])
            ->where(function ($q) {
                $q->whereNull('subscription_expires_at')
                    ->orWhere('subscription_expires_at', '>', now());
            })
            ->count();

        return response()->json([
            'success'             => true,
            'total_users'         => $totalUsers,
            'total_students'      => $totalStudents,
            'total_teachers'      => $totalTeachers,
            'active_users_today'  => $activeToday,
            'total_courses'       => $totalCourses,
            'total_questions'     => $totalQuestions,
            'total_exams'         => $totalExams,
            'monthly_revenue'     => round((float)$monthlyRevenue, 2),
            'active_subscriptions'=> $activeSubscriptions,
        ]);
    }

    // GET /api/admin/users
    public function users(Request $request): JsonResponse
    {
        $q = User::query();
        if ($request->filled('search')) {
            $q->where(function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }
        if ($request->filled('role')) {
            $q->where('role', $request->role);
        }
        $users = $q->orderByDesc('created_at')->paginate(20);
        return response()->json([
            'success' => true,
            'data'    => $users->items(),
            'meta'    => [
                'total'        => $users->total(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    // PATCH /api/admin/users/{id}
    public function updateUser(int $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);
        $v    = Validator::make($request->all(), [
            'name'              => 'sometimes|string|max:255',
            'role'              => 'sometimes|in:student,teacher,admin,parent',
            'subscription_plan' => 'sometimes|in:free,bronze,plus,pro',
            'is_active'         => 'sometimes|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $user->update($v->validated());
        return response()->json(['success' => true, 'user' => $user->fresh()]);
    }

    // DELETE /api/admin/users/{id}
    public function deleteUser(int $id): JsonResponse
    {
        User::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Kullanıcı silindi']);
    }

    // POST /api/admin/users/{id}/toggle-status
    public function toggleUserStatus(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $newStatus = $user->suspended_at ? null : now();
        $user->update(['suspended_at' => $newStatus]);
        return response()->json([
            'success'    => true,
            'is_active'  => $user->suspended_at === null,
            'message'    => $user->suspended_at ? 'Kullanıcı askıya alındı' : 'Kullanıcı aktif edildi',
        ]);
    }

    // GET /api/admin/content
    public function content(Request $request): JsonResponse
    {
        $q = ContentItem::with('topic:id,title')->where('is_active', true);
        if ($request->filled('search')) {
            $q->where('title', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }
        $items = $q->orderByDesc('created_at')->paginate(30);
        return response()->json([
            'success' => true,
            'data'    => $items->items(),
            'meta'    => ['total' => $items->total()],
        ]);
    }

    // DELETE /api/admin/content/{id}
    public function deleteContent(int $id): JsonResponse
    {
        ContentItem::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'İçerik silindi']);
    }

    // GET /api/admin/reports
    public function reports(): JsonResponse
    {
        $weeklyUsers = collect(range(6, 0))->map(function ($daysAgo) {
            $date = Carbon::now()->subDays($daysAgo);
            return [
                'label' => $date->format('D'),
                'value' => User::whereDate('created_at', $date)->count(),
            ];
        })->values();

        $monthlyRevenue = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = Carbon::now()->subMonths($monthsAgo);
            return [
                'label' => $date->format('M'),
                'value' => $this->terenceMonthlyPaymentSumForMonth((int) $date->year, (int) $date->month),
            ];
        })->values();

        $examCompletionRate = ExamSession::count() > 0
            ? round((ExamSession::where('status', 'completed')->count() / ExamSession::count()) * 100, 1)
            : 0;

        $topSubjects = Question::select('subject', DB::raw('COUNT(*) as count'))
            ->whereNotNull('subject')->groupBy('subject')->orderByDesc('count')->limit(5)->get();

        $subscriptionConversions = User::query()
            ->whereNotNull('subscription_plan')
            ->whereNotIn('subscription_plan', ['free', ''])
            ->select('subscription_plan as plan', DB::raw('COUNT(*) as count'))
            ->groupBy('subscription_plan')
            ->get();

        return response()->json([
            'success'                   => true,
            'weekly_users'              => $weeklyUsers,
            'monthly_revenue'           => $monthlyRevenue,
            'exam_completion_rate'      => $examCompletionRate,
            'average_study_time_minutes'=> 0,
            'active_users_today'        => User::whereDate('last_login_at', today())->count(),
            'top_subjects'              => $topSubjects,
            'subscription_conversions'  => $subscriptionConversions->map(fn ($s) => [
                'from'  => 'free',
                'to'    => $s->plan,
                'count' => (int) $s->count,
            ]),
        ]);
    }

    // GET /api/admin/audit-logs
    public function auditLogs(): JsonResponse
    {
        $logs = AuditLog::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();
        return response()->json(['success' => true, 'data' => $logs]);
    }

    // POST /api/admin/settings
    public function updateSettings(Request $request): JsonResponse
    {
        // Ayarlar DB'de config tablosunda tutulacak
        // Şimdilik basit bir yanıt dön
        return response()->json(['success' => true, 'message' => 'Ayarlar kaydedildi']);
    }

    // GET /api/admin/questions
    public function questions(Request $request): JsonResponse
    {
        $q = Question::query();
        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $q->where(function ($qq) use ($term) {
                $qq->where('question_text', 'like', $term)
                    ->orWhere('kazanim_code', 'like', $term);
            });
        }
        if ($request->filled('subject')) {
            $q->where('subject', $request->subject);
        }
        if ($request->filled('difficulty')) {
            $q->where('difficulty', $request->difficulty);
        }
        $items = $q->where('is_active', true)->orderByDesc('created_at')->paginate(20);
        return response()->json([
            'success' => true,
            'data'    => $items->items(),
            'meta'    => [
                'total'         => $items->total(),
                'last_page'     => $items->lastPage(),
                'current_page'  => $items->currentPage(),
                'per_page'      => $items->perPage(),
            ],
        ]);
    }

    public function createQuestion(Request $request): JsonResponse
    {
        $payload = $request->all();
        if (! isset($payload['question_text']) && isset($payload['stem'])) {
            $payload['question_text'] = $payload['stem'];
        }
        if (! isset($payload['kazanim_code']) && isset($payload['kazanim_kodu'])) {
            $payload['kazanim_code'] = $payload['kazanim_kodu'];
        }

        $v = Validator::make($payload, [
            'question_text'  => 'required|string',
            'options'        => 'required|array|min:2',
            'correct_option' => 'required|integer|min:0',
            'subject'        => 'required|string',
            'difficulty'     => 'required|in:easy,medium,hard',
            'type'           => 'nullable|in:classic,new_gen,paragraph',
            'kazanim_code'   => 'nullable|string|max:50',
            'explanation'    => 'nullable|string',
            'grade'          => 'nullable|integer|min:1|max:12',
            'exam_type'      => 'nullable|string|in:LGS,TYT,AYT,KPSS,Genel,TYT-AYT,all,Mini',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $data = $v->validated();
        $optionsRaw = $data['options'];
        $correctIdx = (int) $data['correct_option'];
        $examType = $data['exam_type'] ?? 'Genel';
        if ($examType === 'Mini') {
            $examType = 'Genel';
        }

        $question = DB::transaction(function () use ($data, $optionsRaw, $correctIdx, $examType) {
            $q = Question::create([
                'question_text'  => $data['question_text'],
                'subject'        => $data['subject'],
                'difficulty'     => $data['difficulty'],
                'type'           => $data['type'] ?? 'classic',
                'kazanim_code'   => $data['kazanim_code'] ?? null,
                'solution_text'  => $data['explanation'] ?? null,
                'grade'          => $data['grade'] ?? null,
                'exam_type'      => $examType,
                'is_active'      => true,
                'created_by'     => Auth::id(),
            ]);

            foreach ($optionsRaw as $i => $opt) {
                $letter = chr(65 + $i);
                $text = is_array($opt) ? (string) ($opt['option_text'] ?? $opt['text'] ?? '') : (string) $opt;
                QuestionOption::create([
                    'question_id'   => $q->id,
                    'option_letter' => $letter,
                    'option_text'   => $text,
                    'is_correct'    => $i === $correctIdx,
                    'sort_order'    => $i,
                ]);
            }

            return $q->load('options');
        });

        return response()->json(['success' => true, 'question' => $question], 201);
    }

    public function deleteQuestion(int $id): JsonResponse
    {
        $q = Question::findOrFail($id);
        $q->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Soru silindi']);
    }

    // GET /api/admin/question-bank-displays
    public function questionBankDisplays(): JsonResponse
    {
        $rows = QuestionBankDisplay::query()->orderBy('sort_order')->orderBy('subject')->get();
        return response()->json(['success' => true, 'data' => $rows]);
    }

    // POST /api/admin/question-bank-displays
    public function storeQuestionBankDisplay(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'subject'        => 'required|string|max:120',
            'grade'          => 'nullable|integer|min:0|max:12',
            'badge_label'    => 'nullable|string|max:64',
            'year_label'     => 'nullable|string|max:16',
            'brand_label'    => 'nullable|string|max:128',
            'title_override' => 'nullable|string|max:255',
            'footer_label'   => 'nullable|string|max:128',
            'cta_label'      => 'nullable|string|max:64',
            'cover_hex'      => 'nullable|string|max:7',
            'sort_order'     => 'nullable|integer|min:0|max:65535',
            'is_active'      => 'sometimes|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $data = $v->validated();
        $data['grade'] = (int) ($data['grade'] ?? 0);
        if (! empty($data['cover_hex']) && $data['cover_hex'][0] !== '#') {
            $data['cover_hex'] = '#' . ltrim($data['cover_hex'], '#');
        }
        try {
            $row = QuestionBankDisplay::create($data);
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains((string) $e->getMessage(), 'Duplicate')) {
                return response()->json(['error' => true, 'message' => 'Bu ders ve sınıf için zaten bir kayıt var.'], 422);
            }
            throw $e;
        }
        return response()->json(['success' => true, 'data' => $row], 201);
    }

    // PATCH /api/admin/question-bank-displays/{id}
    public function updateQuestionBankDisplay(int $id, Request $request): JsonResponse
    {
        $row = QuestionBankDisplay::findOrFail($id);
        $v = Validator::make($request->all(), [
            'subject'        => 'sometimes|string|max:120',
            'grade'          => 'sometimes|integer|min:0|max:12',
            'badge_label'    => 'nullable|string|max:64',
            'year_label'     => 'nullable|string|max:16',
            'brand_label'    => 'nullable|string|max:128',
            'title_override' => 'nullable|string|max:255',
            'footer_label'   => 'nullable|string|max:128',
            'cta_label'      => 'nullable|string|max:64',
            'cover_hex'      => 'nullable|string|max:7',
            'sort_order'     => 'nullable|integer|min:0|max:65535',
            'is_active'      => 'sometimes|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $row->update($v->validated());
        return response()->json(['success' => true, 'data' => $row->fresh()]);
    }

    // DELETE /api/admin/question-bank-displays/{id}
    public function destroyQuestionBankDisplay(int $id): JsonResponse
    {
        QuestionBankDisplay::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Kayıt silindi']);
    }

    // POST /api/admin/questions/bulk — JSON ile toplu soru (deneme havuzunu besler)
    public function bulkCreateQuestions(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'questions'   => 'required|array|min:1|max:80',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $list = $request->input('questions');
        $created = [];
        $errors = [];
        foreach ($list as $idx => $payload) {
            if (! is_array($payload)) {
                $errors[] = ['index' => $idx, 'message' => 'Geçersiz girdi'];
                continue;
            }
            $sub = Validator::make($payload, [
                'question_text'  => 'required|string',
                'options'        => 'required|array|min:2',
                'correct_option' => 'required|integer|min:0',
                'subject'        => 'required|string',
                'difficulty'     => 'required|in:easy,medium,hard',
                'type'           => 'nullable|in:classic,new_gen,paragraph',
                'kazanim_code'   => 'nullable|string|max:50',
                'explanation'    => 'nullable|string',
                'grade'          => 'nullable|integer|min:1|max:12',
                'exam_type'      => 'nullable|string|in:LGS,TYT,AYT,KPSS,Genel,TYT-AYT,all,Mini',
            ]);
            if ($sub->fails()) {
                $errors[] = ['index' => $idx, 'errors' => $sub->errors()->toArray()];
                continue;
            }
            $req = Request::create('', 'POST', $payload);
            $res = $this->createQuestion($req);
            if ($res->getStatusCode() !== 201) {
                $errors[] = ['index' => $idx, 'body' => $res->getData(true)];
                continue;
            }
            $decoded = $res->getData(true);
            if (! empty($decoded['question']['id'])) {
                $created[] = (int) $decoded['question']['id'];
            }
        }

        return response()->json([
            'success' => true,
            'created_ids' => $created,
            'created_count' => count($created),
            'errors' => $errors,
        ], 200);
    }

    public function pendingTeachers(Request $request): JsonResponse
    {
        $status   = $request->query('status', 'pending');
        $teachers = User::where('role', 'teacher')
            ->when($status !== 'all', fn($q) => $q->where('teacher_status', $status))
            ->orderByDesc('created_at')
            ->paginate(20);
        return response()->json([
            'success' => true,
            'data'    => $teachers->items(),
            'meta'    => ['total' => $teachers->total()],
        ]);
    }

    public function approveTeacher(int $id): JsonResponse
    {
        $user = User::where('id', $id)->where('role', 'teacher')->firstOrFail();
        $user->update(['teacher_status' => 'approved']);
        return response()->json(['success' => true, 'message' => 'Ogretmen onaylandi']);
    }

    public function rejectTeacher(int $id): JsonResponse
    {
        $user = User::where('id', $id)->where('role', 'teacher')->firstOrFail();
        $user->update(['teacher_status' => 'rejected']);
        return response()->json(['success' => true, 'message' => 'Ogretmen reddedildi']);
    }

    public function coupons(): JsonResponse
    {
        $coupons = DB::table('coupons')->orderByDesc('created_at')->get();
        return response()->json(['success' => true, 'data' => $coupons]);
    }

    public function createCoupon(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'code'        => 'required|string|max:50',
            'type'        => 'required|in:percent,fixed',
            'value'       => 'required|numeric|min:0',
            'max_uses'    => 'nullable|integer|min:1',
            'expires_at'  => 'nullable|date',
            'description' => 'nullable|string|max:500',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $data = $v->validated();
        $data['code'] = strtoupper($data['code']);
        $existing = DB::table('coupons')->where('code', $data['code'])->first();
        if ($existing) {
            return response()->json(['error' => true, 'message' => 'Bu kupon kodu zaten mevcut'], 422);
        }
        $id = DB::table('coupons')->insertGetId(array_merge($data, [
            'is_active'  => true,
            'used_count' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]));
        return response()->json(['success' => true, 'coupon' => DB::table('coupons')->find($id)], 201);
    }

    public function updateCoupon(int $id, Request $request): JsonResponse
    {
        $coupon = DB::table('coupons')->where('id', $id)->first();
        if (!$coupon) {
            return response()->json(['error' => true, 'message' => 'Kupon bulunamadi'], 404);
        }
        DB::table('coupons')->where('id', $id)->update(array_merge(
            $request->only(['is_active', 'max_uses', 'expires_at', 'description']),
            ['updated_at' => now()]
        ));
        return response()->json(['success' => true, 'coupon' => DB::table('coupons')->find($id)]);
    }

    public function deleteCoupon(int $id): JsonResponse
    {
        DB::table('coupons')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Kupon silindi']);
    }

    public function hardAchievements(): JsonResponse
    {
        $results = DB::table('question_answers')
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->whereNotNull('questions.kazanim_code')
            ->where('question_answers.is_correct', false)
            ->select(
                'questions.kazanim_code',
                'questions.subject',
                DB::raw('COUNT(*) as wrong_count'),
                DB::raw('COUNT(DISTINCT question_answers.user_id) as user_count')
            )
            ->groupBy('questions.kazanim_code', 'questions.subject')
            ->orderByDesc('wrong_count')
            ->limit(20)
            ->get()
            ->map(fn($r) => [
                'kazanim_code'   => $r->kazanim_code,
                'subject'        => $r->subject,
                'wrong_count'    => $r->wrong_count,
                'affected_users' => $r->user_count,
                'error_rate'     => 65,
                'total_attempts' => $r->wrong_count,
            ])->values();
        return response()->json(['success' => true, 'data' => $results]);
    }

    public function newUsersWeekly(): JsonResponse
    {
        $data = collect(range(6, 0))->map(function ($daysAgo) {
            $date = Carbon::now()->subDays($daysAgo);
            return [
                'label' => $date->format('D'),
                'value' => User::whereDate('created_at', $date)->count(),
            ];
        })->values();
        return response()->json(['success' => true, 'data' => $data]);
    }

    private function terenceMonthlyPaymentSum(): float
    {
        return $this->terenceMonthlyPaymentSumForMonth((int) now()->year, (int) now()->month);
    }

    private function terenceMonthlyPaymentSumForMonth(int $year, int $month): float
    {
        if (! Schema::hasTable('payments') || ! Schema::hasColumn('payments', 'plan_type')) {
            return 0.0;
        }
        $q = Payment::query()
            ->whereIn('status', ['completed', 'success'])
            ->whereYear('paid_at', $year)
            ->whereMonth('paid_at', $month);

        return round((float) $q->sum('amount'), 2);
    }
}