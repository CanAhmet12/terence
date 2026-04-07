<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TeacherController extends Controller
{
    // GET /api/teacher/classes
    public function classes(): JsonResponse
    {
        $teacher = Auth::user();
        $classes = ClassRoom::where('teacher_id', $teacher->id)
            ->withCount('students')
            ->orderByDesc('created_at')
            ->get();
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
        $students = $class->students()->get(['users.id','users.name','users.email','users.grade','users.current_net','users.xp_points','users.subscription_plan','users.last_login_at']);
        return response()->json(['success' => true, 'data' => $students]);
    }

    // GET /api/teacher/students/risk
    public function riskStudents(): JsonResponse
    {
        $teacher  = Auth::user();
        $classIds = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
        $studentIds = ClassStudent::whereIn('class_room_id', $classIds)->pluck('student_id');

        $students = User::whereIn('id', $studentIds)->get();

        $result = $students->map(function ($s) {
            $lastActivity = StudySession::where('user_id', $s->id)
                ->orderByDesc('started_at')
                ->value('started_at');

            $daysSince = $lastActivity ? now()->diffInDays($lastActivity) : 999;
            $net = (float) $s->current_net;

            $risk = 'green';
            if ($daysSince > 7 || $net < 20)  $risk = 'red';
            elseif ($daysSince > 3 || $net < 40) $risk = 'yellow';

            return [
                'id'            => $s->id,
                'name'          => $s->name,
                'email'         => $s->email,
                'current_net'   => $net,
                'target_net'    => (float) $s->target_net,
                'risk_level'    => $risk,
                'last_active_at'=> $lastActivity,
                'days_inactive' => $daysSince,
                'xp_points'     => $s->xp_points,
            ];
        });

        return response()->json(['success' => true, 'data' => $result->sortByDesc('risk_level')->values()]);
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

        $assignment = Assignment::create(array_merge($data, ['teacher_id' => $teacher->id]));
        return response()->json(['success' => true, 'assignment' => $assignment], 201);
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

        $assignment->update($v->validated());
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
        $studentIds = ClassStudent::whereIn('class_room_id', $classIds)->pluck('student_id');

        $totalStudents = $studentIds->count();
        $activeToday   = StudySession::whereIn('user_id', $studentIds)
            ->whereDate('started_at', today())->distinct('user_id')->count('user_id');
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
            ->orderByDesc('scheduled_at')
            ->get();
        return response()->json(['success' => true, 'data' => $sessions]);
    }

    // POST /api/teacher/live-sessions
    public function createLiveSession(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'title'           => 'required|string|max:255',
            'class_room_id'   => 'sometimes|nullable|integer|exists:class_rooms,id',
            'scheduled_at'    => 'sometimes|nullable|date',
            'duration_minutes'=> 'sometimes|integer|min:15|max:240',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $teacher  = Auth::user();
        $roomName = 'terence-' . Str::slug($request->title) . '-' . Str::random(6);

        $session = LiveSession::create(array_merge($v->validated(), [
            'teacher_id'       => $teacher->id,
            'daily_room_name'  => $roomName,
            'daily_room_url'   => 'https://terenceegitim.daily.co/' . $roomName,
            'status'           => 'scheduled',
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

            default:
                return response()->json(['error' => true, 'message' => 'GeÃ§ersiz analiz tipi'], 422);
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
                $recipientIds = ClassStudent::where('class_room_id', $class->id)->pluck('student_id')->toArray();
            }
        } elseif ($request->recipient_type === 'student' && $request->recipient_id) {
            $recipientIds = [$request->recipient_id];
        } elseif ($request->recipient_type === 'all') {
            $classIds   = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
            $recipientIds = ClassStudent::whereIn('class_room_id', $classIds)->pluck('student_id')->toArray();
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
}