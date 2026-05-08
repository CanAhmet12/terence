<?php

namespace App\Support;

use App\Models\LiveSession;
use Illuminate\Support\Facades\DB;

final class LiveSessionAccess
{
    /** @return int[] */
    public static function classRoomIdsForStudent(int $studentId): array
    {
        return DB::table('class_students')
            ->where('student_id', $studentId)
            ->pluck('class_room_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    public static function studentCanView(int $studentId, LiveSession $session): bool
    {
        if ($session->class_room_id) {
            return in_array((int) $session->class_room_id, self::classRoomIdsForStudent($studentId), true);
        }

        return (bool) $session->is_public;
    }

    public static function studentCanJoin(int $studentId, LiveSession $session): bool
    {
        if (!in_array($session->status, ['scheduled', 'live'], true)) {
            return false;
        }

        return self::studentCanView($studentId, $session);
    }
}
