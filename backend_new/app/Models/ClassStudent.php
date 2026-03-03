<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ClassStudent extends Model {
    protected $fillable = ['class_room_id','student_id'];
    public function classRoom() { return $this->belongsTo(ClassRoom::class); }
    public function student()   { return $this->belongsTo(User::class, 'student_id'); }
}
