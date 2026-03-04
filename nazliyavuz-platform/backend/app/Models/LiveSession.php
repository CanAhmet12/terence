<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class LiveSession extends Model {
    protected $fillable = ['teacher_id','class_room_id','title','daily_room_url','daily_room_name','scheduled_at','duration_minutes','status'];
    protected $casts    = ['scheduled_at'=>'datetime'];
    public function teacher()   { return $this->belongsTo(User::class, 'teacher_id'); }
    public function classRoom() { return $this->belongsTo(ClassRoom::class); }
}
