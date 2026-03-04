<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AssignmentCompletion extends Model {
    protected $fillable = ['assignment_id','student_id','completed_count','is_done','completed_at'];
    protected $casts    = ['is_done'=>'boolean','completed_at'=>'datetime'];
    public function assignment() { return $this->belongsTo(Assignment::class); }
    public function student()    { return $this->belongsTo(User::class, 'student_id'); }
}
