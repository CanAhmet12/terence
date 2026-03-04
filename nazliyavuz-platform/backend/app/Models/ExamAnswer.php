<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ExamAnswer extends Model {
    protected $fillable = ['exam_session_id','question_id','user_id','selected_option','is_correct','is_flagged','time_spent_seconds','answered_at'];
    protected $casts    = ['is_correct'=>'boolean','is_flagged'=>'boolean','answered_at'=>'datetime'];
    public function examSession() { return $this->belongsTo(ExamSession::class); }
    public function question()    { return $this->belongsTo(Question::class); }
}
