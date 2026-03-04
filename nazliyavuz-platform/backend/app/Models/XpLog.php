<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class XpLog extends Model {
    protected $fillable = ['user_id','amount','reason','sourceable_type','sourceable_id'];
    public function user()      { return $this->belongsTo(User::class); }
    public function sourceable(){ return $this->morphTo(); }
}
