<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model {
    protected $fillable = ['teacher_id','class_room_id','title','description','type','target_count','subject','due_date','is_active'];
    protected $casts    = ['due_date'=>'date','is_active'=>'boolean'];
    public function teacher()     { return $this->belongsTo(User::class, 'teacher_id'); }
    public function classRoom()   { return $this->belongsTo(ClassRoom::class); }
    public function completions() { return $this->hasMany(AssignmentCompletion::class); }
}
