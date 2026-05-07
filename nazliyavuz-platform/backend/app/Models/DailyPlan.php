<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DailyPlan extends Model {
    protected $fillable = ['user_id','plan_date','status','total_tasks','completed_tasks','study_minutes_actual','study_minutes_planned','is_auto_generated'];
    protected $casts    = ['plan_date'=>'date','is_auto_generated'=>'boolean'];
    public function user()  { return $this->belongsTo(User::class); }
    public function tasks() { return $this->hasMany(PlanTask::class); }

    /** Denormalize total_tasks / completed_tasks from live plan_tasks rows. */
    public function syncTaskCounts(): void
    {
        $total = PlanTask::where('daily_plan_id', $this->id)->whereNull('cancelled_at')->count();
        $completed = PlanTask::where('daily_plan_id', $this->id)->whereNull('cancelled_at')->where('is_completed', true)->count();
        $this->update(['total_tasks' => $total, 'completed_tasks' => $completed]);
    }
}
