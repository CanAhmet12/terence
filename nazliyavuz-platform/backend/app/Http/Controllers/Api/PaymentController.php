<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\PaymentLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    // GET /api/packages — paket listesi
    public function packages(): JsonResponse
    {
        $plans = SubscriptionPlan::where('is_active', true)->orderBy('sort_order')->get();
        return response()->json(['success' => true, 'data' => $plans]);
    }

    // POST /api/payment/initiate — PayTR ödeme başlat
    public function initiate(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id'       => 'required|integer|exists:subscription_plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
        ]);

        $user   = Auth::user();
        $plan   = SubscriptionPlan::findOrFail($request->plan_id);
        $amount = $request->billing_cycle === 'yearly'
            ? ($plan->yearly_price ?? $plan->monthly_price * 10)
            : $plan->monthly_price;

        $merchantId  = config('paytr.merchant_id');
        $merchantKey = config('paytr.merchant_key');
        $merchantSalt= config('paytr.merchant_salt');
        $merchantOid = 'TRC-' . Str::upper(Str::random(10)) . '-' . $user->id;

        // Abonelik kaydı (pending)
        $subscription = Subscription::create([
            'user_id'          => $user->id,
            'plan_id'          => $plan->id,
            'paytr_merchant_oid'=> $merchantOid,
            'status'           => 'pending',
            'billing_cycle'    => $request->billing_cycle,
            'amount_paid'      => $amount,
        ]);

        // PayTR iframe token oluştur
        $userBasket   = base64_encode(json_encode([[
            $plan->name . ' ' . ucfirst($request->billing_cycle),
            number_format($amount, 2, '.', ''),
            1,
        ]]));
        $userIp       = $request->ip();
        $email        = $user->email;
        $userName     = $user->name;
        $userPhone    = $user->phone ?? '05000000000';
        $userAddress  = 'Türkiye';
        $noInstallment= '0';
        $maxInstallment='0';
        $currency     = 'TL';
        $testMode     = config('paytr.test_mode', '1');
        $paymentAmount= (int) round($amount * 100); // kuruş
        $okUrl        = config('app.url') . '/odeme-basarili?oid=' . $merchantOid;
        $failUrl      = config('app.url') . '/odeme-hatali?oid=' . $merchantOid;
        $lang         = 'tr';

        $hashStr = $merchantId . $userIp . $merchantOid . $email . $paymentAmount
            . $userBasket . $noInstallment . $maxInstallment . $currency . $testMode . $merchantSalt;
        $paytrToken = base64_encode(hash_hmac('sha256', $hashStr, $merchantKey, true));

        $postData = [
            'merchant_id'        => $merchantId,
            'user_ip'            => $userIp,
            'merchant_oid'       => $merchantOid,
            'email'              => $email,
            'payment_amount'     => $paymentAmount,
            'paytr_token'        => $paytrToken,
            'user_basket'        => $userBasket,
            'debug_on'           => '1',
            'no_installment'     => $noInstallment,
            'max_installment'    => $maxInstallment,
            'user_name'          => $userName,
            'user_address'       => $userAddress,
            'user_phone'         => $userPhone,
            'merchant_ok_url'    => $okUrl,
            'merchant_fail_url'  => $failUrl,
            'timeout_limit'      => '30',
            'currency'           => $currency,
            'test_mode'          => $testMode,
            'lang'               => $lang,
            'client_lang'        => $lang,
        ];

        $ch = curl_init('https://www.paytr.com/odeme/api/get-token');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_POSTFIELDS     => http_build_query($postData),
        ]);
        $result = curl_exec($ch);
        curl_close($ch);
        $result = json_decode($result, true);

        if (!isset($result['status']) || $result['status'] !== 'success') {
            Log::error('PayTR token error', ['result' => $result]);
            return response()->json([
                'error'   => true,
                'code'    => 'PAYTR_TOKEN_ERROR',
                'message' => 'Ödeme başlatılamadı: ' . ($result['reason'] ?? 'Bilinmeyen hata'),
            ], 500);
        }

        return response()->json([
            'success'      => true,
            'token'        => $result['token'],
            'merchant_oid' => $merchantOid,
            'iframe_url'   => 'https://www.paytr.com/odeme/guvenli/' . $result['token'],
        ]);
    }

    // POST /api/payment/callback — PayTR callback (webhook)
    public function callback(Request $request): \Illuminate\Http\Response
    {
        $merchantKey  = config('paytr.merchant_key');
        $merchantSalt = config('paytr.merchant_salt');

        $hash = base64_encode(hash_hmac('sha256',
            $request->merchant_oid . $merchantSalt . $request->status . $request->total_amount,
            $merchantKey, true
        ));

        if ($hash !== $request->hash) {
            Log::warning('PayTR invalid hash', $request->all());
            return response('INVALID_HASH', 400);
        }

        $oid          = $request->merchant_oid;
        $status       = $request->status;
        $subscription = Subscription::where('paytr_merchant_oid', $oid)->first();

        if (!$subscription) {
            return response('OK');
        }

        PaymentLog::create([
            'user_id'             => $subscription->user_id,
            'subscription_id'     => $subscription->id,
            'paytr_merchant_oid'  => $oid,
            'paytr_payment_type'  => $request->payment_type ?? null,
            'paytr_payment_amount'=> $request->total_amount ?? null,
            'status'              => $status,
            'raw_response'        => $request->all(),
        ]);

        if ($status === 'success') {
            $plan    = $subscription->plan;
            $expires = $subscription->billing_cycle === 'yearly'
                ? now()->addYear()
                : now()->addMonth();

            $subscription->update([
                'status'     => 'active',
                'starts_at'  => now(),
                'expires_at' => $expires,
            ]);

            $subscription->user->update([
                'subscription_plan'       => $plan->slug,
                'subscription_expires_at' => $expires,
            ]);
        } else {
            $subscription->update(['status' => 'cancelled']);
        }

        return response('OK');
    }

    // GET /api/subscription/status
    public function status(): JsonResponse
    {
        $user = Auth::user();
        $subscription = Subscription::with('plan')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->orderByDesc('starts_at')
            ->first();

        return response()->json([
            'success'           => true,
            'subscription_plan' => $user->subscription_plan,
            'expires_at'        => $user->subscription_expires_at,
            'subscription'      => $subscription,
        ]);
    }

    // POST /api/payment/apply-coupon
    public function applyCoupon(Request $request): JsonResponse
    {
        $request->validate([
            'code'    => 'required|string|max:50',
            'plan_id' => 'nullable|integer|exists:subscription_plans,id',
        ]);

        $coupon = DB::table('coupons')
            ->where('code', strtoupper(trim($request->code)))
            ->where('is_active', true)
            ->first();

        if (!$coupon) {
            return response()->json(['error' => true, 'message' => 'Kupon kodu gecersiz veya kullanimdan kaldirilmis'], 404);
        }

        if ($coupon->expires_at && Carbon::parse($coupon->expires_at)->isPast()) {
            return response()->json(['error' => true, 'message' => 'Kupon kodunun kullanim suresi dolmus'], 422);
        }

        if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
            return response()->json(['error' => true, 'message' => 'Kupon kodu maksimum kullanim sayisina ulasmis'], 422);
        }

        $originalAmount = 0;
        $discountAmount = 0;
        $finalAmount    = 0;

        if ($request->filled('plan_id')) {
            $plan = SubscriptionPlan::find($request->plan_id);
            if ($plan) {
                $originalAmount = (float) $plan->monthly_price;
                if ($coupon->type === 'percent') {
                    $discountAmount = round($originalAmount * ($coupon->value / 100), 2);
                } else {
                    $discountAmount = min((float) $coupon->value, $originalAmount);
                }
                $finalAmount = max(0, $originalAmount - $discountAmount);
            }
        }

        return response()->json([
            'success'         => true,
            'coupon'          => [
                'code'        => $coupon->code,
                'type'        => $coupon->type,
                'value'       => $coupon->value,
                'description' => $coupon->description,
            ],
            'original_amount' => $originalAmount,
            'discount_amount' => $discountAmount,
            'final_amount'    => $finalAmount,
        ]);
    }
}