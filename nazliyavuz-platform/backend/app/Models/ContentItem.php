<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ContentItem extends Model {
    protected $fillable = ['topic_id','type','title','url','duration_seconds','size_bytes','sort_order','is_free','is_active','description'];
    protected $casts    = ['is_free'=>'boolean','is_active'=>'boolean'];
    public function topic()     { return $this->belongsTo(Topic::class); }
    public function progress()  { return $this->hasMany(StudentProgress::class); }
    public function video()     { return $this->hasOne(\App\Models\Video::class, 'content_item_id'); }
}
