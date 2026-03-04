<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Question extends Model {
    protected $fillable = ['topic_id','kazanim_id','kazanim_code','question_text','question_image_url','type','difficulty','subject','grade','exam_type','solution_video_url','solution_text','is_active','total_attempts','correct_attempts','accuracy_rate','created_by'];
    protected $casts    = ['is_active'=>'boolean'];
    public function options()    { return $this->hasMany(QuestionOption::class); }
    public function topic()      { return $this->belongsTo(Topic::class); }
    public function kazanim()    { return $this->belongsTo(Kazanim::class); }
    public function answers()    { return $this->hasMany(QuestionAnswer::class); }
    public function creator()    { return $this->belongsTo(User::class, 'created_by'); }
}
