<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model {
    protected $fillable = ['user_id','plan_id','paytr_merchant_oid','status','billing_cycle','amount_paid','starts_at','expires_at','cancelled_at','cancel_reason','paytr_response'];
    protected $casts    = ['starts_at'=>'datetime','expires_at'=>'datetime','cancelled_at'=>'datetime','paytr_response'=>'array'];
    public function user() { return $this->belongsTo(User::class); }
    public function plan() { return $this->belongsTo(SubscriptionPlan::class, 'plan_id'); }
}
