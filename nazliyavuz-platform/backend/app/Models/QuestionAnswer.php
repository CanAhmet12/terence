<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class QuestionAnswer extends Model {
    protected $fillable = ['user_id','question_id','selected_option','is_correct','time_spent_seconds','source','sourceable_type','sourceable_id','answered_at'];
    protected $casts    = ['is_correct'=>'boolean','answered_at'=>'datetime'];
    public function user()     { return $this->belongsTo(User::class); }
    public function question() { return $this->belongsTo(Question::class); }
}
