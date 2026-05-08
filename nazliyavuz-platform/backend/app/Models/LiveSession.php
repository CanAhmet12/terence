<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiveSession extends Model
{
    protected $fillable = [
        'teacher_id',
        'class_room_id',
        'is_public',
        'title',
        'subject_tag',
        'description',
        'daily_room_url',
        'daily_room_name',
        'recording_url',
        'scheduled_at',
        'started_at',
        'ended_at',
        'duration_minutes',
        'max_participants',
        'status',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at'   => 'datetime',
        'ended_at'     => 'datetime',
        'is_public'    => 'boolean',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classRoom(): BelongsTo
    {
        return $this->belongsTo(ClassRoom::class, 'class_room_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(LiveSessionAttendance::class, 'live_session_id');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(LiveSessionReminder::class, 'live_session_id');
    }
}
