<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Course extends Model {
    protected $fillable = ['title','slug','description','thumbnail_url','subject','exam_type','grade','level','is_active','is_free','sort_order','created_by'];
    protected $casts    = ['is_active'=>'boolean','is_free'=>'boolean'];
    public function units()       { return $this->hasMany(Unit::class); }
    public function enrollments() { return $this->hasMany(CourseEnrollment::class); }
    public function creator()     { return $this->belongsTo(User::class, 'created_by'); }
}
