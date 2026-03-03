<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Topic extends Model {
    protected $fillable = ['unit_id','title','description','sort_order','is_active'];
    protected $casts    = ['is_active'=>'boolean'];
    public function unit()         { return $this->belongsTo(Unit::class); }
    public function contentItems() { return $this->hasMany(ContentItem::class); }
    public function questions()    { return $this->hasMany(Question::class); }
}
