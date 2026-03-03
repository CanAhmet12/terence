<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ExamSessionQuestion extends Model {
    protected $fillable = ['exam_session_id','question_id','sort_order','section'];
    public function examSession() { return $this->belongsTo(ExamSession::class); }
    public function question()    { return $this->belongsTo(Question::class)->with('options'); }
}
