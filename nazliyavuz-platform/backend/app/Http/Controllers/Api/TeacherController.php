<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TeacherInsightService;
use App\Services\TeacherInterventionService;
use App\Traits\StudentRiskTrait;
use App\Models\ClassRoom;
use App\Models\ClassStudent;
use App\Models\Assignment;
use App\Models\AssignmentCompletion;
use App\Models\LiveSession;
use App\Models\User;
use App\Models\ExamSession;
use App\Models\ExamAnswer;
use App\Models\StudySession;
use App\Models\PlanTask;
use App\Models\Message;
use App\Services\GoalDashboardService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TeacherController extends Controller
{
    use StudentRiskTrait;
    // GET /api/teacher/classes
    public function classes(): JsonResponse
    {
        $teacher = Auth::user();
        $classes = ClassRoom::where('teacher_id', $teacher->id)
            ->withCount('students')
            ->orderByDesc('created_at')
            ->get();

        $classIds = $classes->pluck('id');
        if ($classIds->isEmpty()) {
            return response()->json(['success' => true, 'data' => $classes]);
        }

        $avgByClass = DB::table('class_students')
            ->join('users', 'users.id', '=', 'class_students.student_id')
            ->whereIn('class_students.class_room_id', $classIds)
            ->groupBy('class_students.class_room_id')
            ->selectRaw('class_students.class_room_id as cid, AVG(users.current_net) as avg_net')
            ->pluck('avg_net', 'cid');

        $pairs = DB::table('class_students')
            ->whereIn('class_room_id', $classIds)
            ->get(['class_room_id', 'student_id']);

        $studentIds = $pairs->pluck('student_id')->unique()->values();

        $riskRank = ['green' => 1, 'yellow' => 2, 'red' => 3];
        $riskByStudent = [];
        if ($studentIds->isNotEmpty()) {
            $lastStudyByUser = StudySession::query()
                ->whereIn('user_id', $studentIds)
                ->selectRaw('user_id, MAX(started_at) as last_started')
                ->groupBy('user_id')
                ->pluck('last_started', 'user_id');

            $nets       = User::whereIn('id', $studentIds)->pluck('current_net', 'id');
        $targetNets = User::whereIn('id', $studentIds)->pluck('target_net', 'id');
        $examDates  = User::whereIn('id', $studentIds)->pluck('exam_date', 'id');

            foreach ($studentIds as $sid) {
                $lastActivity = $lastStudyByUser[$sid] ?? null;
                $daysSince    = $lastActivity ? now()->diffInDays(Carbon::parse($lastActivity)) : 999;
                $net          = (float) ($nets[$sid] ?? 0);
                $targetNet    = $targetNets[$sid] !== null ? (float) $targetNets[$sid] : null;
                $examDate     = $examDates[$sid] ? (string) $examDates[$sid] : null;

                $riskByStudent[$sid] = $this->computeStudentRiskLevel($net, $daysSince, $targetNet, $examDate);
            }
        }

        $worstByClass = [];
        foreach ($pairs as $p) {
            $cid = (int) $p->class_room_id;
            $sid = (int) $p->student_id;
            $r   = $riskByStudent[$sid] ?? 'green';
            if (! isset($worstByClass[$cid])) {
                $worstByClass[$cid] = $r;
                continue;
            }
            $cur = $worstByClass[$cid];
            if (($riskRank[$r] ?? 1) > ($riskRank[$cur] ?? 1)) {
                $worstByClass[$cid] = $r;
            }
        }

        foreach ($classes as $c) {
            $c->avg_net      = isset($avgByClass[$c->id]) ? round((float) $avgByClass[$c->id], 2) : null;
            $c->risk_level   = $worstByClass[$c->id] ?? 'green';
        }

        return response()->json(['success' => true, 'data' => $classes]);
    }

    // POST /api/teacher/classes
    public function createClass(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'      => 'required|string|max:100',
            'grade'     => 'sometimes|nullable|integer|between:1,12',
            'exam_type' => 'sometimes|nullable|in:LGS,TYT,AYT,TYT-AYT,KPSS',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $teacher = Auth::user();
        $class   = ClassRoom::create(array_merge($v->validated(), [
            'teacher_id' => $teacher->id,
            'join_code'  => strtoupper(Str::random(6)),
        ]));
        return response()->json(['success' => true, 'class' => $class], 201);
    }

    // GET /api/teacher/classes/{id}/students
    public function classStudents(int $classId): JsonResponse
    {
        $teacher = Auth::user();
        $class   = ClassRoom::where('teacher_id', $teacher->id)->findOrFail($classId);
        $students = $class->students()->get([
            'users.id',
            'users.name',
            'users.email',
            'users.grade',
            'users.target_exam',
            'users.exam_goal',
            'users.target_net',
            'users.current_net',
            'users.xp_points',
            'users.subscription_plan',
            'users.last_login_at',
            'users.exam_date',  // P1: needed for canonical risk pace signal
        ]);

        if ($students->isEmpty()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $studentIds = $students->pluck('id');

        $studyToday = StudySession::query()
            ->whereIn('user_id', $studentIds)
            ->whereDate('started_at', today())
            ->selectRaw('user_id, COALESCE(SUM(COALESCE(duration_seconds, 0)), 0) as secs')
            ->groupBy('user_id')
            ->pluck('secs', 'user_id');

        $lastStudyByUser = StudySession::query()
            ->whereIn('user_id', $studentIds)
            ->selectRaw('user_id, MAX(started_at) as last_started')
            ->groupBy('user_id')
            ->pluck('last_started', 'user_id');

        $riskByStudent = [];
        $data = $students->map(function ($u) use ($studyToday, $lastStudyByUser, &$riskByStudent) {
            $lastActivity = $lastStudyByUser[$u->id] ?? null;
            $daysSince    = $lastActivity ? now()->diffInDays(Carbon::parse($lastActivity)) : 999;
            $net          = (float) $u->current_net;
            $targetNet    = $u->target_net !== null ? (float) $u->target_net : null;
            $examDate     = $u->exam_date ? (string) $u->exam_date : null;
            $risk         = $this->computeStudentRiskLevel($net, $daysSince, $targetNet, $examDate);

            $riskByStudent[$u->id] = $risk;

            return array_merge($u->toArray(), [
                'study_time_today_seconds' => (int) ($studyToday[$u->id] ?? 0),
                'risk_level'               => $risk,
                'days_inactive'            => $daysSince,
            ]);
        });

        // P0 — Add intervention intelligence (batch, no N+1)
        $interventions = (new TeacherInterventionService)->forStudents(
            $teacher->id,
            $studentIds,
            $riskByStudent,
        );

        $dataWithIntervention = $data->map(function ($row) use ($interventions) {
            $row['intervention'] = $interventions[$row['id']] ?? null;
            return $row;
        });

        return response()->json(['success' => true, 'data' => $dataWithIntervention]);
    }

    // GET /api/teacher/classes/{id}/exam-summary — sınıftaki öğrencilerin deneme özeti (salt okunur)
    public function classExamSummary(int $classId): JsonResponse
    {
        $teacher  = Auth::user();
        $class    = ClassRoom::where('teacher_id', $teacher->id)->findOrFail($classId);
        $students = $class->students()->get(['users.id', 'users.name']);
        $since    = now()->subDays(30);

        $data = $students->map(function ($u) use ($since) {
            $exams30 = ExamSession::where('user_id', $u->id)
                ->where('status', 'completed')
                ->where('finished_at', '>=', $since)
                ->count();
            $last = ExamSession::where('user_id', $u->id)
                ->where('status', 'completed')
                ->orderByDesc('finished_at')
                ->first(['net_score', 'exam_type', 'finished_at']);

            return [
                'student_id'          => $u->id,
                'name'                => $u->name,
                'exams_completed_30d' => $exams30,
                'last_net'            => $last ? (float) $last->net_score : null,
                'last_exam_type'      => $last?->exam_type,
                'last_finished_at'    => $last?->finished_at?->toIso8601String(),
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // GET /api/teacher/students/risk
    public function riskStudents(): JsonResponse
    {
        $teacher  = Auth::user();
        $classIds = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
        $studentIds = ClassStudent::whereIn('class_room_id', $classIds)->pluck('student_id')->unique()->values();

        $students = User::whereIn('id', $studentIds)->get();

        // Batch load last study sessions for all students
        $lastStudyByUser = StudySession::whereIn('user_id', $studentIds)
            ->selectRaw('user_id, MAX(started_at) as last_started')
            ->groupBy('user_id')
            ->pluck('last_started', 'user_id');

        $result = $students->map(function ($s) use ($lastStudyByUser) {
            $lastActivity = $lastStudyByUser[$s->id] ?? null;
            $daysSince    = $lastActivity ? now()->diffInDays(Carbon::parse($lastActivity)) : 999;
            $net          = (float) $s->current_net;
            $targetNet    = $s->target_net !== null ? (float) $s->target_net : null;
            $examDate     = $s->exam_date ? (string) $s->exam_date : null;

            return [
                'id'            => $s->id,
                'name'          => $s->name,
                'email'         => $s->email,
                'current_net'   => $net,
                'target_net'    => (float) $s->target_net,
                'risk_level'    => $this->computeStudentRiskLevel($net, $daysSince, $targetNet, $examDate),
                'last_active_at'=> $lastActivity,
                'days_inactive' => $daysSince,
                'xp_points'     => $s->xp_points,
            ];
        });

        $riskRank = ['red' => 3, 'yellow' => 2, 'green' => 1];
        $sorted = $result->sortByDesc(fn ($row) => $riskRank[$row['risk_level']] ?? 0)->values();

        // P0 — Intervention intelligence (batch)
        $riskByStudent   = $result->pluck('risk_level', 'id')->all();
        $interventions   = (new TeacherInterventionService)->forStudents(
            $teacher->id,
            $studentIds->all(),
            $riskByStudent,
        );

        $withIntervention = $sorted->map(function ($row) use ($interventions) {
            $row['intervention'] = $interventions[$row['id']] ?? null;
            return $row;
        });

        // P1 — class-level intervention summary
        $needFollowUp      = collect($interventions)->filter(fn ($i) => $i && $i['needs_follow_up'])->count();
        $recentlyActioned  = collect($interventions)->filter(function ($i) {
            if (!$i || !$i['last_at']) return false;
            try { return Carbon::parse($i['last_at'])->gte(now()->subDays(7)); }
            catch (\Throwable) { return false; }
        })->count();
        $noIntervention    = collect($interventions)->filter(fn ($i) => $i && $i['last_at'] === null)->count();

        return response()->json([
            'success' => true,
            'data'    => $withIntervention,
            // optional — additive, does not break existing clients
            'intervention_summary' => [
                'students_need_follow_up' => $needFollowUp,
                'recently_intervened'     => $recentlyActioned,
                'no_intervention_yet'     => $noIntervention,
            ],
        ]);
    }

    // GET /api/teacher/assignments
    public function assignments(): JsonResponse
    {
        $teacher     = Auth::user();
        // completions ilişkisi yerine assignment_completions tablosundan count al
        $assignments = Assignment::where('teacher_id', $teacher->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => array_merge($a->toArray(), [
                'completions_count' => DB::table('assignment_completions')
                    ->where('assignment_id', $a->id)->count(),
                'class_room_name' => $a->class_room_id
                    ? DB::table('class_rooms')->where('id', $a->class_room_id)->value('name')
                    : null,
            ]));
        return response()->json(['success' => true, 'data' => $assignments]);
    }

    // POST /api/teacher/assignments
    public function createAssignment(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'title'         => 'required|string|max:255',
            'description'   => 'sometimes|nullable|string',
            'type'          => 'sometimes|nullable|string',
            'subject'       => 'sometimes|nullable|string',
            'due_date'      => 'sometimes|nullable|date',
            'class_id'      => 'sometimes|nullable|integer|exists:class_rooms,id',
            'class_room_id' => 'sometimes|nullable|integer|exists:class_rooms,id',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $teacher = Auth::user();
        $data = $v->validated();
        // class_id → class_room_id uyumluluğu
        if (isset($data['class_id']) && !isset($data['class_room_id'])) {
            $data['class_room_id'] = $data['class_id'];
        }
        unset($data['class_id'], $data['type']);

        $classRoomId = $data['class_room_id'] ?? null;
        if ($classRoomId !== null) {
            $ownsClass = ClassRoom::where('id', $classRoomId)->where('teacher_id', $teacher->id)->exists();
            if (!$ownsClass) {
                return response()->json(['error' => true, 'message' => 'Bu sınıf size ait değil.'], 403);
            }
            $studentIds = ClassStudent::where('class_room_id', $classRoomId)->pluck('student_id')->unique()->values();
        } else {
            $classIds = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
            $studentIds = ClassStudent::whereIn('class_room_id', $classIds)->pluck('student_id')->unique()->values();
        }

        if ($studentIds->isEmpty()) {
            return response()->json([
                'error'   => true,
                'message' => 'Öğrenci bulunamadı. Önce sınıflarınıza öğrenci ekleyin veya bir sınıf seçin.',
            ], 422);
        }

        $dueDate = isset($data['due_date']) && $data['due_date'] !== null
            ? Carbon::parse($data['due_date'])
            : now()->addDays(7);

        $title = $data['title'];
        $description = $data['description'] ?? null;

        $created = DB::transaction(function () use ($teacher, $studentIds, $classRoomId, $title, $description, $dueDate) {
            $rows = [];
            foreach ($studentIds as $studentId) {
                $rows[] = Assignment::create([
                    'teacher_id'    => $teacher->id,
                    'student_id'    => $studentId,
                    'class_room_id' => $classRoomId,
                    'title'         => $title,
                    'description'   => $description,
                    'due_date'      => $dueDate,
                    'difficulty'    => 'medium',
                    'status'        => 'pending',
                ]);
            }
            return $rows;
        });

        $first = $created[0];

        return response()->json([
            'success'       => true,
            'assignment'    => $first,
            'created_count' => count($created),
        ], 201);
    }

    // PATCH /api/teacher/assignments/{id}
    public function updateAssignment(int $id, Request $request): JsonResponse
    {
        $teacher    = Auth::user();
        $assignment = Assignment::where('teacher_id', $teacher->id)->findOrFail($id);

        $v = Validator::make($request->all(), [
            'title'         => 'sometimes|string|max:255',
            'description'   => 'sometimes|nullable|string',
            'type'          => 'sometimes|in:question,video,read',
            'target_count'  => 'sometimes|nullable|integer|min:1',
            'subject'       => 'sometimes|nullable|string',
            'due_date'      => 'sometimes|nullable|date',
            'class_room_id' => 'sometimes|nullable|integer|exists:class_rooms,id',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $patch = $v->validated();
        if (array_key_exists('class_room_id', $patch) && $patch['class_room_id'] !== null) {
            $ownsClass = ClassRoom::where('id', $patch['class_room_id'])->where('teacher_id', $teacher->id)->exists();
            if (!$ownsClass) {
                return response()->json(['error' => true, 'message' => 'Bu sınıf size ait değil.'], 403);
            }
        }

        $assignment->update($patch);
        return response()->json(['success' => true, 'assignment' => $assignment->fresh()]);
    }

    // DELETE /api/teacher/assignments/{id}
    public function deleteAssignment(int $id): JsonResponse
    {
        $teacher    = Auth::user();
        $assignment = Assignment::where('teacher_id', $teacher->id)->findOrFail($id);
        $assignment->delete();
        return response()->json(['success' => true, 'message' => 'Ã–dev silindi']);
    }

    // GET /api/teacher/stats
    public function stats(): JsonResponse
    {
        $teacher  = Auth::user();
        $classIds = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
        $studentIds = ClassStudent::whereIn('class_room_id', $classIds)->pluck('student_id')->unique()->values();

        $totalStudents = $studentIds->count();
        $activeToday   = (int) StudySession::whereIn('user_id', $studentIds)
            ->whereDate('started_at', today())
            ->selectRaw('COUNT(DISTINCT user_id) as c')
            ->value('c');
        $avgNet        = User::whereIn('id', $studentIds)->avg('current_net') ?? 0;
        $assignments   = Assignment::where('teacher_id', $teacher->id)->count();

        return response()->json([
            'success'          => true,
            'total_students'   => $totalStudents,
            'active_today'     => $activeToday,
            'average_net'      => round((float)$avgNet, 2),
            'assignment_count' => $assignments,
        ]);
    }

    // GET /api/teacher/live-sessions
    public function liveSessions(): JsonResponse
    {
        $teacher  = Auth::user();
        $sessions = LiveSession::where('teacher_id', $teacher->id)
            ->withCount('attendances')
            ->orderByDesc('scheduled_at')
            ->get();
        return response()->json(['success' => true, 'data' => $sessions]);
    }

    // GET /api/teacher/live-sessions/{id}
    public function showLiveSession(int $id): JsonResponse
    {
        $teacher = Auth::user();
        $session = LiveSession::withCount('attendances')
            ->where('teacher_id', $teacher->id)
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $session]);
    }

    // PATCH /api/teacher/live-sessions/{id}/go-live
    public function goLiveLiveSession(int $id): JsonResponse
    {
        $teacher = Auth::user();
        $session = LiveSession::where('teacher_id', $teacher->id)->findOrFail($id);

        if ($session->status === 'ended') {
            return response()->json(['error' => true, 'message' => 'Bitmiş bir ders yeniden canlı yapılamaz.'], 422);
        }

        $session->update([
            'status'     => 'live',
            'started_at' => $session->started_at ?? now(),
        ]);

        return response()->json(['success' => true, 'data' => $session->fresh()]);
    }

    // PATCH /api/teacher/live-sessions/{id}/end
    public function endLiveSession(Request $request, int $id): JsonResponse
    {
        $teacher = Auth::user();
        $session = LiveSession::where('teacher_id', $teacher->id)->findOrFail($id);

        $v = Validator::make($request->all(), [
            'recording_url' => 'sometimes|nullable|string|max:512',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $payload = [
            'status'   => 'ended',
            'ended_at' => now(),
        ];
        if ($request->filled('recording_url')) {
            $payload['recording_url'] = $request->input('recording_url');
        }

        $session->update($payload);

        return response()->json(['success' => true, 'data' => $session->fresh()]);
    }

    // POST /api/teacher/live-sessions
    public function createLiveSession(Request $request): JsonResponse
    {
        $input = $request->all();
        if (empty($input['scheduled_at']) && !empty($input['starts_at'])) {
            $input['scheduled_at'] = $input['starts_at'];
        }
        if (!array_key_exists('class_room_id', $input) && array_key_exists('class_id', $input)) {
            $input['class_room_id'] = $input['class_id'];
        }

        $v = Validator::make($input, [
            'title'             => 'required|string|max:255',
            'class_room_id'     => 'sometimes|nullable|integer|exists:class_rooms,id',
            'class_id'          => 'sometimes|nullable|integer',
            'scheduled_at'      => 'required_without:starts_at|nullable|date',
            'starts_at'         => 'required_without:scheduled_at|nullable|date',
            'duration_minutes'  => 'sometimes|integer|min:15|max:240',
            'is_public'         => 'sometimes|boolean',
            'subject_tag'       => 'sometimes|nullable|string|max:160',
            'description'       => 'sometimes|nullable|string',
            'max_participants'  => 'sometimes|nullable|integer|min:1|max:5000',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $teacher = Auth::user();
        $data    = $v->validated();

        if (empty($data['scheduled_at']) && !empty($data['starts_at'])) {
            $data['scheduled_at'] = $data['starts_at'];
        }
        unset($data['starts_at'], $data['class_id']);

        if (!empty($data['class_room_id'])) {
            $owns = ClassRoom::where('id', $data['class_room_id'])->where('teacher_id', $teacher->id)->exists();
            if (!$owns) {
                return response()->json(['error' => true, 'message' => 'Bu sınıf size ait değil.'], 403);
            }
        }

        $isPublic = (bool) ($data['is_public'] ?? false);
        if (empty($data['class_room_id']) && !$isPublic) {
            return response()->json([
                'error'   => true,
                'message' => 'Sınıf seçilmediyse ders yalnızca "herkese açık yayın" olarak işaretlenebilir.',
            ], 422);
        }

        $roomName = 'terence-' . Str::slug($data['title']) . '-' . Str::random(6);

        $session = LiveSession::create(array_merge($data, [
            'teacher_id'       => $teacher->id,
            'daily_room_name'  => $roomName,
            'daily_room_url'   => 'https://terenceegitim.daily.co/' . $roomName,
            'status'           => 'scheduled',
            'is_public'        => $isPublic,
        ]));

        return response()->json(['success' => true, 'session' => $session], 201);
    }

    // GET /api/teacher/analytics/{type}
    public function analytics(string $type): JsonResponse
    {
        $teacher    = Auth::user();
        $classIds   = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
        $studentIds = ClassStudent::whereIn('class_room_id', $classIds)->pluck('student_id');

        if ($studentIds->isEmpty()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        switch ($type) {
            case 'kazanim-errors':
                $data = DB::table('exam_answers as ea')
                    ->join('questions as q', 'ea.question_id', '=', 'q.id')
                    ->whereIn('ea.user_id', $studentIds)
                    ->where('ea.is_correct', false)
                    ->whereNotNull('q.kazanim_code')
                    ->selectRaw('q.kazanim_code, q.subject, COUNT(*) as wrong_count, AVG(ea.time_spent_seconds) as avg_time')
                    ->groupBy('q.kazanim_code', 'q.subject')
                    ->orderByDesc('wrong_count')
                    ->limit(20)
                    ->get()
                    ->map(fn($r) => [
                        'kazanim_code' => $r->kazanim_code,
                        'subject'      => $r->subject,
                        'wrong_count'  => (int) $r->wrong_count,
                        'avg_time'     => round((float) $r->avg_time, 1),
                    ]);
                break;

            case 'hard-topics':
                $data = DB::table('exam_answers as ea')
                    ->join('questions as q', 'ea.question_id', '=', 'q.id')
                    ->whereIn('ea.user_id', $studentIds)
                    ->whereNotNull('q.subject')
                    ->selectRaw('q.subject, COUNT(*) as total, SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END) as correct_count')
                    ->groupBy('q.subject')
                    ->having('total', '>', 0)
                    ->orderByRaw('(correct_count / total) ASC')
                    ->limit(10)
                    ->get()
                    ->map(fn($r) => [
                        'subject'      => $r->subject,
                        'total'        => (int) $r->total,
                        'correct_count'=> (int) $r->correct_count,
                        'accuracy'     => $r->total > 0 ? round((int)$r->correct_count / (int)$r->total * 100, 1) : 0,
                    ]);
                break;

            case 'time-analysis':
                $data = StudySession::whereIn('user_id', $studentIds)
                    ->where('started_at', '>=', Carbon::now()->subDays(30))
                    ->whereNotNull('duration_seconds')
                    ->selectRaw('DATE(started_at) as date, SUM(duration_seconds) as total_seconds, COUNT(DISTINCT user_id) as student_count')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->map(fn($r) => [
                        'date'          => $r->date,
                        'total_minutes' => round((int)$r->total_seconds / 60, 1),
                        'student_count' => (int) $r->student_count,
                    ]);
                break;

            case 'teaching-insight':
                // BI-8 — Deep teaching analytics: reteach topics, clusters, intervention effect
                $totalStudents = $studentIds->count();
                $data = (new TeacherInsightService)->buildInsight(
                    $teacher->id,
                    $studentIds,
                    $totalStudents,
                );
                return response()->json(array_merge(['success' => true], $data));

            default:
                return response()->json(['error' => true, 'message' => 'Geçersiz analiz tipi'], 422);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    // GET /api/teacher/messages
    public function messages(): JsonResponse
    {
        $teacher  = Auth::user();
        // messages tablosunda receiver_id var, recipient_id yok
        $messages = Message::where('sender_id', $teacher->id)
            ->orWhere('receiver_id', $teacher->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn($m) => [
                'id'             => $m->id,
                'recipient_type' => 'student',
                'recipient_id'   => $m->receiver_id,
                'content'        => $m->content,
                'is_read'        => (bool) $m->is_read,
                'created_at'     => $m->created_at,
            ]);

        return response()->json(['success' => true, 'data' => $messages]);
    }

    // POST /api/teacher/messages
    public function sendMessage(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'recipient_type' => 'required|string',
            'recipient_id'   => 'sometimes|nullable|integer',
            'recipient_name' => 'sometimes|nullable|string|max:255',
            'content'        => 'required|string|max:2000',
            'send_push'      => 'sometimes|boolean',
            'send_sms'       => 'sometimes|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $teacher = Auth::user();

        // Determine recipient IDs based on type
        $recipientIds = [];
        if ($request->recipient_type === 'class' && $request->recipient_id) {
            $class = ClassRoom::where('teacher_id', $teacher->id)->find($request->recipient_id);
            if ($class) {
                $recipientIds = ClassStudent::where('class_room_id', $class->id)->pluck('student_id')->unique()->values()->all();
            }
        } elseif ($request->recipient_type === 'student' && $request->recipient_id) {
            $recipientIds = [$request->recipient_id];
        } elseif ($request->recipient_type === 'all') {
            $classIds   = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
            $recipientIds = ClassStudent::whereIn('class_room_id', $classIds)->pluck('student_id')->unique()->values()->all();
        }

        $recipientIds = array_values(array_unique(array_filter($recipientIds)));

        if ($recipientIds === []) {
            return response()->json([
                'error'   => true,
                'message' => 'Alıcı öğrenci bulunamadı. Öğrencilerinizi bir sınıfa ekleyin.',
            ], 422);
        }

        // Create notification for each recipient
        $payload = json_encode([
            'title'  => 'Ogretmen Mesaji: ' . $teacher->name,
            'body'   => $request->content,
            'sender' => $teacher->name,
        ]);
        foreach ($recipientIds as $recipientId) {
            DB::table('notifications')->insert([
                'user_id'    => $recipientId,
                'type'       => 'teacher_message',
                'payload'    => $payload,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $msg = [
            'id'             => time(),
            'recipient_type' => $request->recipient_type,
            'recipient_id'   => $request->recipient_id,
            'recipient_name' => $request->recipient_name,
            'content'        => $request->content,
            'created_at'     => now()->toISOString(),
        ];

        return response()->json(['success' => true, 'message' => $msg], 201);
    }

    /**
     * GET /api/teacher/students/{studentId}/goal-dashboard — sınıftaki öğrenci ile aynı DTO.
     */
    public function studentGoalDashboard(int $studentId): JsonResponse
    {
        $teacher = Auth::user();
        $classIds = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
        $inClass = ClassStudent::where('student_id', $studentId)
            ->whereIn('class_room_id', $classIds)
            ->exists();
        if (!$inClass) {
            return response()->json([
                'error' => true,
                'code' => 'FORBIDDEN',
                'message' => 'Bu öğrenci sınıflarınızda kayıtlı değil.',
            ], 403);
        }

        $student = User::where('role', 'student')->findOrFail($studentId);

        return response()->json(app(GoalDashboardService::class)->forUser($student));
    }
}