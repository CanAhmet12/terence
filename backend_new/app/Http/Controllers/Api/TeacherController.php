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
use App\Models\StudySession;
use App\Models\PlanTask;
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

    // GET /api/teacher/students/risk — risk analizi
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
                'id'           => $s->id,
                'name'         => $s->name,
                'email'        => $s->email,
                'current_net'  => $net,
                'target_net'   => (float) $s->target_net,
                'risk_level'   => $risk,
                'last_active_at'=> $lastActivity,
                'days_inactive' => $daysSince,
                'xp_points'    => $s->xp_points,
            ];
        });

        return response()->json(['success' => true, 'data' => $result->sortByDesc('risk_level')->values()]);
    }

    // GET /api/teacher/assignments
    public function assignments(): JsonResponse
    {
        $teacher     = Auth::user();
        $assignments = Assignment::where('teacher_id', $teacher->id)
            ->with('classRoom:id,name')
            ->withCount('completions')
            ->orderByDesc('created_at')
            ->get();
        return response()->json(['success' => true, 'data' => $assignments]);
    }

    // POST /api/teacher/assignments
    public function createAssignment(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'title'         => 'required|string|max:255',
            'description'   => 'sometimes|nullable|string',
            'type'          => 'required|in:question,video,read',
            'target_count'  => 'sometimes|nullable|integer|min:1',
            'subject'       => 'sometimes|nullable|string',
            'due_date'      => 'sometimes|nullable|date',
            'class_room_id' => 'sometimes|nullable|integer|exists:class_rooms,id',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $teacher    = Auth::user();
        $assignment = Assignment::create(array_merge($v->validated(), ['teacher_id' => $teacher->id]));
        return response()->json(['success' => true, 'assignment' => $assignment], 201);
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
            'success'         => true,
            'total_students'  => $totalStudents,
            'active_today'    => $activeToday,
            'average_net'     => round((float)$avgNet, 2),
            'assignment_count'=> $assignments,
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
            'title'          => 'required|string|max:255',
            'class_room_id'  => 'sometimes|nullable|integer|exists:class_rooms,id',
            'scheduled_at'   => 'sometimes|nullable|date',
            'duration_minutes'=> 'sometimes|integer|min:15|max:240',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }
        $teacher  = Auth::user();
        $roomName = 'terence-' . Str::slug($request->title) . '-' . Str::random(6);

        $session = LiveSession::create(array_merge($v->validated(), [
            'teacher_id'      => $teacher->id,
            'daily_room_name' => $roomName,
            'daily_room_url'  => 'https://terenceegitim.daily.co/' . $roomName,
            'status'          => 'scheduled',
        ]));

        return response()->json(['success' => true, 'session' => $session], 201);
    }
}
