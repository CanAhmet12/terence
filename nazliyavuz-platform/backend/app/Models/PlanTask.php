<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PlanTask extends Model {
    protected $fillable = [
        'daily_plan_id', 'user_id', 'source', 'assigned_by_user_id', 'class_room_id', 'teacher_batch_id',
        'student_editable', 'requirement', 'cancelled_at',
        'title', 'type', 'subject', 'kazanim_code', 'target_count', 'actual_count', 'planned_minutes', 'actual_minutes',
        'is_completed', 'is_ai_suggested', 'priority', 'taskable_type', 'taskable_id', 'completed_at', 'sort_order',
    ];
    protected $casts = [
        'is_completed' => 'boolean',
        'is_ai_suggested' => 'boolean',
        'student_editable' => 'boolean',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];
    public function dailyPlan() { return $this->belongsTo(DailyPlan::class); }
    public function user()      { return $this->belongsTo(User::class); }
    public function taskable()  { return $this->morphTo(); }
}
