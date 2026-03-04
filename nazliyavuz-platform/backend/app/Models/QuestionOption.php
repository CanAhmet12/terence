<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class QuestionOption extends Model {
    public $timestamps  = false;
    protected $fillable = ['question_id','option_letter','option_text','option_image_url','is_correct','sort_order'];
    protected $casts    = ['is_correct'=>'boolean'];
    public function question() { return $this->belongsTo(Question::class); }
}
