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
use App\Models\ExamTemplate;
use App\Models\ExamTemplateQuestion;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Illuminate\Support\Str;

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
        $perPage = min(100, max(1, (int) $request->input('per_page', 20)));
        $users = $q->orderByDesc('created_at')->paginate($perPage);
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
            'teacher_status'    => 'sometimes|in:pending,approved,rejected',
            'admin_notes'       => 'sometimes|nullable|string|max:2000',
            'rejection_reason'  => 'sometimes|nullable|string|max:2000',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $payload = $v->validated();
        if (array_key_exists('teacher_status', $payload)) {
            if ($payload['teacher_status'] === 'approved') {
                $payload['approved_at'] = now();
                $payload['approved_by'] = Auth::id();
            }
            if ($payload['teacher_status'] === 'rejected') {
                $payload['approved_at'] = null;
                $payload['approved_by'] = null;
            }
        }
        $user->update($payload);
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
        $q = ContentItem::query()
            ->where('is_active', true)
            ->with([
                'topic' => function ($tq) {
                    $tq->select('id', 'title', 'unit_id')
                        ->with(['unit' => function ($uq) {
                            $uq->select('id', 'title', 'course_id')
                                ->with(['course' => function ($cq) {
                                    $cq->select('id', 'title', 'grade', 'exam_type', 'subject');
                                }]);
                        }]);
                },
            ]);
        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $q->where(function ($qq) use ($term) {
                $qq->where('title', 'like', $term);
                if (Schema::hasColumn('content_items', 'description')) {
                    $qq->orWhere('description', 'like', $term);
                }
            });
        }
        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }
        $items = $q->orderByDesc('created_at')->paginate(30);

        $data = collect($items->items())->map(function (ContentItem $ci) {
            $topic = $ci->topic;
            $unit = $topic?->unit;
            $course = $unit?->course;

            return [
                'id' => $ci->id,
                'type' => $ci->type,
                'title' => $ci->title,
                'thumbnail_url' => $ci->thumbnail_url,
                'description' => $ci->description,
                'size_bytes' => $ci->size_bytes,
                'created_at' => $ci->created_at?->toIso8601String(),
                'is_free' => (bool) $ci->is_free,
                'topic_title' => $topic?->title,
                'unit' => $unit?->title,
                'subject' => $course?->subject,
                'course_title' => $course?->title,
                'course_grade' => $course?->grade,
                'course_exam_type' => $course?->exam_type,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'total' => $items->total(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
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

    // GET /api/admin/settings
    public function getSettings(): JsonResponse
    {
        $lang = SystemSetting::getRaw('default_language', 'tr');
        if (! in_array($lang, ['tr', 'en'], true)) {
            $lang = 'tr';
        }
        $maintRaw = SystemSetting::getRaw('maintenance_mode', '0');
        $maintenance = $maintRaw === '1' || $maintRaw === 'true' || $maintRaw === 'yes';

        return response()->json([
            'success' => true,
            'data'    => [
                'language'          => $lang,
                'maintenance_mode'  => $maintenance,
            ],
        ]);
    }

    // POST /api/admin/settings
    public function updateSettings(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'language'          => 'nullable|string|in:tr,en',
            'maintenance_mode'  => 'nullable|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $data = $v->validated();
        if (array_key_exists('language', $data)) {
            SystemSetting::put('default_language', (string) $data['language']);
        }
        if (array_key_exists('maintenance_mode', $data)) {
            SystemSetting::put('maintenance_mode', $request->boolean('maintenance_mode') ? '1' : '0');
        }

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
        $adminId = (int) Auth::id();
        if ($adminId <= 0) {
            return response()->json(['error' => true, 'message' => 'Yetkisiz'], 401);
        }
        $user->approveTeacher($adminId);

        return response()->json(['success' => true, 'message' => 'Ogretmen onaylandi']);
    }

    public function rejectTeacher(int $id): JsonResponse
    {
        $user = User::where('id', $id)->where('role', 'teacher')->firstOrFail();
        $user->update([
            'teacher_status'   => 'rejected',
            'approved_at'      => null,
            'approved_by'      => null,
            'rejection_reason' => null,
        ]);

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

    // ─── Sabit deneme şablonları (exam_templates) ───────────────────────────

    public function examTemplates(Request $request): JsonResponse
    {
        if (! Schema::hasTable('exam_templates')) {
            return response()->json(['success' => true, 'data' => []]);
        }
        $q = ExamTemplate::query()->withCount('templateQuestions')->orderByDesc('sort_order')->orderBy('title');
        if ($request->boolean('active_only')) {
            $q->where('is_active', true);
        }
        if ($request->filled('exam_type')) {
            $q->where('exam_type', $request->exam_type);
        }
        $rows = $q->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function showExamTemplate(int $id): JsonResponse
    {
        $t = ExamTemplate::withCount('templateQuestions')->findOrFail($id);
        $items = $t->templateQuestions()->with('question:id,question_text,subject,grade,exam_type,is_active')->orderBy('sort_order')->get()->map(function ($row) {
            $q = $row->question;

            return [
                'sort_order'   => (int) $row->sort_order,
                'question_id'  => (int) $row->question_id,
                'section'      => $row->section,
                'subject'      => $q?->subject,
                'grade'        => $q?->grade,
                'exam_type'    => $q?->exam_type,
                'is_active'    => $q?->is_active,
                'preview'      => $q ? mb_substr(strip_tags($q->question_text), 0, 120) : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $t,
            'questions' => $items,
        ]);
    }

    public function storeExamTemplate(Request $request): JsonResponse
    {
        if (! Schema::hasTable('exam_templates')) {
            return response()->json(['error' => true, 'message' => 'Migrasyon henüz çalıştırılmamış.'], 503);
        }
        $v = Validator::make($request->all(), [
            'title'             => 'required|string|max:255',
            'slug'              => 'nullable|string|max:160|unique:exam_templates,slug',
            'exam_type'         => 'required|string|max:32|in:LGS,TYT,AYT,TYT-AYT,KPSS,Mini',
            'grade'             => 'nullable|integer|min:1|max:12',
            'duration_minutes'  => 'nullable|integer|min:5|max:300',
            'description'       => 'nullable|string|max:2000',
            'is_active'         => 'sometimes|boolean',
            'sort_order'        => 'nullable|integer|min:0|max:65535',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $data = $v->validated();
        $slug = $data['slug'] ?? null;
        if (! $slug) {
            $base = Str::slug($data['title']) ?: 'deneme';
            $slug = $base;
            $n    = 0;
            while (ExamTemplate::where('slug', $slug)->exists()) {
                $slug = $base . '-' . (++$n);
            }
        }
        $admin = Auth::user();
        $row   = ExamTemplate::create([
            'title'             => $data['title'],
            'slug'              => $slug,
            'exam_type'         => $data['exam_type'],
            'grade'             => $data['grade'] ?? null,
            'duration_minutes'  => (int) ($data['duration_minutes'] ?? 135),
            'description'       => $data['description'] ?? null,
            'is_active'         => (bool) ($data['is_active'] ?? true),
            'sort_order'        => (int) ($data['sort_order'] ?? 0),
            'published_at'      => ($data['is_active'] ?? true) ? now() : null,
            'created_by'        => $admin?->id,
        ]);

        return response()->json(['success' => true, 'data' => $row], 201);
    }

    public function updateExamTemplate(int $id, Request $request): JsonResponse
    {
        $row = ExamTemplate::findOrFail($id);
        $v   = Validator::make($request->all(), [
            'title'             => 'sometimes|string|max:255',
            'slug'              => 'sometimes|nullable|string|max:160|unique:exam_templates,slug,' . $id,
            'exam_type'         => 'sometimes|string|max:32|in:LGS,TYT,AYT,TYT-AYT,KPSS,Mini',
            'grade'             => 'nullable|integer|min:1|max:12',
            'duration_minutes'  => 'nullable|integer|min:5|max:300',
            'description'       => 'nullable|string|max:2000',
            'is_active'         => 'sometimes|boolean',
            'sort_order'        => 'nullable|integer|min:0|max:65535',
            'published_at'      => 'nullable|date',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $patch = $v->validated();
        if (array_key_exists('is_active', $patch) && $patch['is_active'] && ! $row->published_at) {
            $patch['published_at'] = now();
        }
        $row->update($patch);

        return response()->json(['success' => true, 'data' => $row->fresh()]);
    }

    public function destroyExamTemplate(int $id): JsonResponse
    {
        ExamTemplate::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Şablon silindi']);
    }

    public function syncExamTemplateQuestions(int $id, Request $request): JsonResponse
    {
        $template = ExamTemplate::findOrFail($id);
        $v        = Validator::make($request->all(), [
            'questions'   => 'required|array|min:1|max:200',
            'questions.*' => 'required|array',
            'questions.*.question_id' => 'required|integer|exists:questions,id',
            'questions.*.section'     => 'nullable|string|max:120',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $list = $request->input('questions');
        DB::transaction(function () use ($template, $list) {
            ExamTemplateQuestion::where('exam_template_id', $template->id)->delete();
            foreach ($list as $i => $item) {
                ExamTemplateQuestion::create([
                    'exam_template_id' => $template->id,
                    'question_id'      => (int) $item['question_id'],
                    'sort_order'       => $i + 1,
                    'section'          => $item['section'] ?? null,
                ]);
            }
        });
        $template->loadCount('templateQuestions');

        return response()->json([
            'success' => true,
            'message' => 'Soru sırası güncellendi',
            'data'    => $template,
        ]);
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