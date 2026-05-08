<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveSessionReminder extends Model
{
    protected $table = 'live_session_reminders';

    protected $fillable = [
        'live_session_id',
        'user_id',
        'remind_at',
        'channel',
    ];

    protected $casts = [
        'remind_at' => 'datetime',
    ];

    public function liveSession(): BelongsTo
    {
        return $this->belongsTo(LiveSession::class, 'live_session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
