<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model {
    protected $fillable = ['course_id','title','description','sort_order','is_active'];
    protected $casts    = ['is_active'=>'boolean'];
    public function course() { return $this->belongsTo(Course::class); }
    public function topics() { return $this->hasMany(Topic::class); }
}
