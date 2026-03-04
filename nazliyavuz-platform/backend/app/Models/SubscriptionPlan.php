<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model {
    protected $fillable = ['name','slug','monthly_price','yearly_price','features','is_active','sort_order'];
    protected $casts    = ['features'=>'array','is_active'=>'boolean'];
    public function subscriptions() { return $this->hasMany(Subscription::class, 'plan_id'); }
}
