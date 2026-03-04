<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class StudentProgress extends Model {
    protected $fillable = ['user_id','content_item_id','status','watch_seconds','marked_understood','needs_repeat','completed_at'];
    protected $casts    = ['marked_understood'=>'boolean','needs_repeat'=>'boolean','completed_at'=>'datetime'];
    public function user()        { return $this->belongsTo(User::class); }
    public function contentItem() { return $this->belongsTo(ContentItem::class); }
}
