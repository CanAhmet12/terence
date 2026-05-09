<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LiveSession;
use App\Models\LiveSessionAttendance;
use App\Models\LiveSessionReminder;
use App\Support\LiveSessionAccess;
use App\Support\LiveSessionViewSerializer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class StudentLiveSessionController extends Controller
{
    public static function queryForStudent(int $studentId, string $scope): Builder
    {
        $classIds = LiveSessionAccess::classRoomIdsForStudent($studentId);

        $q = LiveSession::query()
            ->where(function ($outer) use ($classIds, $studentId) {
                $outer->where(function ($inner) use ($classIds) {
                    if (!empty($classIds)) {
                        $inner->whereIn('class_room_id', $classIds);
                    }
                    $inner->orWhere(function ($pub) {
                        $pub->whereNull('class_room_id')->where('is_public', true);
                    });
                });
                $outer->orWhereHas('attendances', fn ($a) => $a->where('user_id', $studentId));
            });

        if ($scope === 'upcoming') {
            // Canlı veya (planlı ve henüz takvimde “geçerli” sayılabilecek zaman — çok eski scheduled kayıtları listeleme)
            $q->where(function ($w) {
                $w->where('status', 'live')
                    ->orWhere(function ($s) {
                        $s->where('status', 'scheduled')
                            ->where('scheduled_at', '>=', Carbon::now()->subDay()->startOfDay());
                    });
            });
        } elseif ($scope === 'past') {
            $q->where('status', 'ended');
        }

        return $q;
    }

    // GET /api/student/live-lessons?scope=upcoming|past|all
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $scope = $request->get('scope', 'upcoming');
        if (!in_array($scope, ['upcoming', 'past', 'all'], true)) {
            return response()->json(['error' => true, 'message' => 'Geçersiz scope'], 422);
        }

        $sessions = self::queryForStudent($user->id, $scope)
            ->withCount('attendances')
            ->with(['teacher:id,name,email,profile_photo_url', 'classRoom:id,name'])
            ->orderBy('scheduled_at', $scope === 'past' ? 'desc' : 'asc')
            ->limit(50)
            ->get()
            ->map(fn (LiveSession $s) => LiveSessionViewSerializer::studentListItem($s));

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    // GET /api/student/live-lessons/summary
    public function summary(): JsonResponse
    {
        $user      = Auth::user();
        $classIds  = LiveSessionAccess::classRoomIdsForStudent($user->id);
        $weekStart = Carbon::now()->startOfWeek();
        $monthStart = Carbon::now()->startOfMonth();

        $baseVisible = LiveSession::query()
            ->where(function ($outer) use ($classIds) {
                $outer->where(function ($inner) use ($classIds) {
                    if (!empty($classIds)) {
                        $inner->whereIn('class_room_id', $classIds);
                    }
                    $inner->orWhere(function ($pub) {
                        $pub->whereNull('class_room_id')->where('is_public', true);
                    });
                });
            });

        $upcomingThisWeek = (clone $baseVisible)
            ->where(function ($w) {
                $w->where('status', 'live')
                    ->orWhere(function ($s) {
                        $s->where('status', 'scheduled')
                            ->where('scheduled_at', '>=', Carbon::now()->subDay()->startOfDay());
                    });
            })
            ->where('scheduled_at', '>=', $weekStart)
            ->where('scheduled_at', '<=', Carbon::now()->endOfWeek())
            ->count();

        $joinedThisMonth = LiveSessionAttendance::query()
            ->where('user_id', $user->id)
            ->where('joined_at', '>=', $monthStart)
            ->count();

        $joinedRows = LiveSessionAttendance::query()
            ->where('live_session_attendances.user_id', $user->id)
            ->where('live_session_attendances.joined_at', '>=', $monthStart)
            ->join('live_sessions', 'live_sessions.id', '=', 'live_session_attendances.live_session_id')
            ->where('live_sessions.status', 'ended')
            ->select([
                'live_sessions.started_at',
                'live_sessions.ended_at',
                'live_sessions.duration_minutes',
            ])
            ->get();

        $minutesThisMonth = (int) $joinedRows->sum(function ($row) {
            if ($row->started_at && $row->ended_at) {
                return max(0, Carbon::parse($row->started_at)->diffInMinutes(Carbon::parse($row->ended_at)));
            }

            return (int) ($row->duration_minutes ?? 0);
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'upcoming_this_week'  => $upcomingThisWeek,
                'joined_this_month'   => $joinedThisMonth,
                'minutes_this_month'  => (int) $minutesThisMonth,
            ],
        ]);
    }

    // POST /api/student/live-sessions/{id}/join
    public function join(int $id): JsonResponse
    {
        $user    = Auth::user();
        $session = LiveSession::with('teacher:id,name')->findOrFail($id);

        if (!LiveSessionAccess::studentCanJoin($user->id, $session)) {
            return response()->json(['error' => true, 'message' => 'Bu derse erişiminiz yok veya ders uygun durumda değil.'], 403);
        }

        if (!$session->daily_room_url) {
            return response()->json(['error' => true, 'message' => 'Oda bağlantısı henüz hazır değil.'], 422);
        }

        LiveSessionAttendance::query()->updateOrCreate(
            [
                'live_session_id' => $session->id,
                'user_id'         => $user->id,
            ],
            [
                'joined_at' => now(),
                'left_at'   => null,
            ]
        );

        $participantCount = LiveSessionAttendance::where('live_session_id', $session->id)->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'room_url'           => $session->daily_room_url,
                'session_id'         => $session->id,
                'participant_count'  => $participantCount,
            ],
        ]);
    }

    // POST /api/student/live-sessions/{id}/reminder
    public function reminder(Request $request, int $id): JsonResponse
    {
        $user    = Auth::user();
        $session = LiveSession::findOrFail($id);

        if (!LiveSessionAccess::studentCanView($user->id, $session)) {
            return response()->json(['error' => true, 'message' => 'Forbidden'], 403);
        }

        $v = Validator::make($request->all(), [
            'remind_at' => 'required|date|after:now',
            'channel'   => 'sometimes|string|in:in_app,push,email',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        LiveSessionReminder::create([
            'live_session_id' => $session->id,
            'user_id'         => $user->id,
            'remind_at'       => $v->validated()['remind_at'],
            'channel'         => $v->validated()['channel'] ?? 'in_app',
        ]);

        return response()->json(['success' => true, 'message' => 'Hatırlatıcı kaydedildi']);
    }
}
