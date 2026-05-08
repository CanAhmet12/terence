<?php

namespace App\Support;

use App\Models\LiveSession;

final class LiveSessionViewSerializer
{
    public static function studentListItem(LiveSession $s): array
    {
        return [
            'id'                 => $s->id,
            'title'              => $s->title,
            'subject_tag'        => $s->subject_tag,
            'description'        => $s->description,
            'status'             => $s->status,
            'scheduled_at'       => $s->scheduled_at?->toIso8601String(),
            'starts_at'          => $s->scheduled_at?->toIso8601String(),
            'started_at'         => $s->started_at?->toIso8601String(),
            'ended_at'           => $s->ended_at?->toIso8601String(),
            'duration_minutes'   => $s->duration_minutes,
            'daily_room_url'     => $s->daily_room_url,
            'recording_url'      => $s->recording_url,
            'is_public'          => (bool) $s->is_public,
            'class_room_id'      => $s->class_room_id,
            'class_room'         => $s->classRoom ? ['id' => $s->classRoom->id, 'name' => $s->classRoom->name] : null,
            'teacher'            => $s->teacher ? [
                'id'                  => $s->teacher->id,
                'name'                => $s->teacher->name,
                'profile_photo_url'   => $s->teacher->profile_photo_url ?? null,
            ] : null,
            'participant_count'  => (int) ($s->attendances_count ?? 0),
        ];
    }
}
