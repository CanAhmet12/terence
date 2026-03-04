<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ParentStudent extends Model {
    protected $fillable = ['parent_id','student_id','relation','status','invite_code'];
    public function parent()  { return $this->belongsTo(User::class, 'parent_id'); }
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
}
