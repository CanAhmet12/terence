<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Kazanim extends Model {
    protected $fillable = ['kod','tanim','subject','grade','unite','konu','exam_type','is_active'];
    protected $casts    = ['is_active'=>'boolean'];
    public function questions() { return $this->hasMany(Question::class); }
}
