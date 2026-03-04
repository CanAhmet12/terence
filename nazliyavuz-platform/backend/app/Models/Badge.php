<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Badge extends Model {
    protected $fillable = ['name','description','icon_url','category','condition_type','condition_value','xp_reward','is_active'];
    protected $casts    = ['is_active'=>'boolean'];
    public function users() { return $this->belongsToMany(User::class, 'user_badges')->withPivot('earned_at'); }
}
