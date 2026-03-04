<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ClassRoom extends Model {
    protected $fillable = ['teacher_id','name','join_code','grade','exam_type','is_active'];
    protected $casts    = ['is_active'=>'boolean'];
    public function teacher()  { return $this->belongsTo(User::class, 'teacher_id'); }
    public function students() { return $this->belongsToMany(User::class, 'class_students', 'class_room_id', 'student_id')->withPivot('joined_at'); }
}
