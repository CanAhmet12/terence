<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ExamSession extends Model {
    protected $fillable = ['user_id','title','exam_type','status','duration_minutes','started_at','finished_at','time_spent_seconds','total_questions','correct_count','wrong_count','empty_count','net_score','subject_breakdown','percentile_data'];
    protected $casts    = ['started_at'=>'datetime','finished_at'=>'datetime','subject_breakdown'=>'array','percentile_data'=>'array'];
    public function user()             { return $this->belongsTo(User::class); }
    public function sessionQuestions() { return $this->hasMany(ExamSessionQuestion::class); }
    public function answers()          { return $this->hasMany(ExamAnswer::class); }
}
