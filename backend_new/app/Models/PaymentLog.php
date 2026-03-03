<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PaymentLog extends Model {
    protected $fillable = ['user_id','subscription_id','paytr_merchant_oid','paytr_payment_type','paytr_payment_amount','status','raw_response'];
    protected $casts    = ['raw_response'=>'array'];
}
