<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class StudySession extends Model {
    protected $fillable = ['user_id','subject','plan_task_id','started_at','ended_at','duration_seconds','device_type'];
    protected $casts    = ['started_at'=>'datetime','ended_at'=>'datetime'];
    public function user() { return $this->belongsTo(User::class); }
}
