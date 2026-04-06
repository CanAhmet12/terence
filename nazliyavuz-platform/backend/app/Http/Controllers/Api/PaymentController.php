<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PayTRService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(private PayTRService $paytrService) {}

    /**
     * Create payment token for checkout
     */
    public function createPayment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'plan_type' => 'required|in:bronze,plus,pro',
            'billing_period' => 'required|in:monthly,quarterly,yearly',
            'installment' => 'sometimes|integer|min:0|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => true, 'errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $planType = $request->plan_type;
        $billingPeriod = $request->billing_period;

        // Get plan pricing
        $pricing = $this->getPlanPricing($planType, $billingPeriod);

        // Create payment record
        $payment = Payment::create([
            'user_id' => $user->id,
            'merchant_oid' => null, // Will be set by PayTR
            'amount' => $pricing['amount'],
            'currency' => 'TRY',
            'status' => 'pending',
            'payment_method' => 'paytr',
            'plan_type' => $planType,
            'billing_period' => $billingPeriod,
            'installment_count' => $request->input('installment', 0),
        ]);

        // Prepare PayTR params
        $paytrParams = [
            'user_ip' => $request->ip(),
            'email' => $user->email,
            'amount' => $pricing['amount'],
            'installment' => $request->input('installment', 0),
            'success_url' => config('app.frontend_url') . '/payment/success',
            'fail_url' => config('app.frontend_url') . '/payment/fail',
            'user_name' => $user->name,
            'user_phone' => $user->phone ?? '05000000000',
            'basket' => [[
                'name' => $pricing['name'],
                'price' => $pricing['amount'],
                'quantity' => 1,
            ]],
        ];

        // Get payment token from PayTR
        $result = $this->paytrService->createPaymentToken($paytrParams);

        if (!$result['success']) {
            return response()->json([
                'error' => true,
                'message' => $result['error'],
            ], 400);
        }

        // Update payment with merchant_oid
        $payment->update(['merchant_oid' => $result['merchant_oid']]);

        Log::channel('payment')->info('Payment initiated', [
            'user_id' => $user->id,
            'payment_id' => $payment->id,
            'merchant_oid' => $result['merchant_oid'],
            'amount' => $pricing['amount'],
        ]);

        return response()->json([
            'success' => true,
            'payment_token' => $result['token'],
            'payment_id' => $payment->id,
            'amount' => $pricing['amount'],
        ]);
    }

    /**
     * Handle PayTR callback
     */
    public function callback(Request $request): string
    {
        $post = $request->post();

        Log::channel('payment')->info('PayTR callback received', [
            'merchant_oid' => $post['merchant_oid'] ?? null,
            'status' => $post['status'] ?? null,
        ]);

        // Verify callback
        $verification = $this->paytrService->verifyCallback($post);

        if (!$verification['success']) {
            Log::channel('payment')->error('PayTR callback verification failed', $post);
            return 'OK'; // Always return OK to PayTR
        }

        // Find payment
        $payment = Payment::where('merchant_oid', $verification['merchant_oid'])->first();

        if (!$payment) {
            Log::channel('payment')->error('Payment not found', [
                'merchant_oid' => $verification['merchant_oid'],
            ]);
            return 'OK';
        }

        // Update payment status
        if ($verification['status'] === 'success') {
            $payment->update([
                'status' => 'completed',
                'paid_at' => now(),
                'payment_type' => $verification['payment_type'],
                'reference_no' => $post['reference_no'] ?? null,
            ]);

            // Activate subscription
            $this->activateSubscription($payment);

            Log::channel('payment')->info('Payment completed', [
                'payment_id' => $payment->id,
                'user_id' => $payment->user_id,
                'amount' => $payment->amount,
            ]);
        } else {
            $payment->update([
                'status' => 'failed',
                'failed_reason' => $verification['failed_reason_msg'],
                'failed_code' => $verification['failed_reason_code'],
            ]);

            Log::channel('payment')->warning('Payment failed', [
                'payment_id' => $payment->id,
                'reason' => $verification['failed_reason_msg'],
            ]);
        }

        return 'OK';
    }

    /**
     * Get payment status
     */
    public function status(int $paymentId): JsonResponse
    {
        $payment = Payment::where('id', $paymentId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$payment) {
            return response()->json(['error' => true, 'message' => 'Ödeme bulunamadı'], 404);
        }

        return response()->json([
            'success' => true,
            'payment' => [
                'id' => $payment->id,
                'status' => $payment->status,
                'amount' => $payment->amount,
                'plan_type' => $payment->plan_type,
                'billing_period' => $payment->billing_period,
                'paid_at' => $payment->paid_at,
            ],
        ]);
    }

    /**
     * Get user's payment history
     */
    public function history(): JsonResponse
    {
        $payments = Payment::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'payments' => $payments,
        ]);
    }

    /**
     * Request refund
     */
    public function refund(int $paymentId): JsonResponse
    {
        $payment = Payment::where('id', $paymentId)
            ->where('user_id', Auth::id())
            ->where('status', 'completed')
            ->first();

        if (!$payment) {
            return response()->json(['error' => true, 'message' => 'Ödeme bulunamadı'], 404);
        }

        // Check refund eligibility (14 days)
        if ($payment->paid_at->diffInDays(now()) > 14) {
            return response()->json([
                'error' => true,
                'message' => 'İade süresi geçmiş (maksimum 14 gün)',
            ], 400);
        }

        // Process refund
        $result = $this->paytrService->refund(
            $payment->merchant_oid,
            $payment->amount,
            $payment->reference_no
        );

        if ($result['success']) {
            $payment->update([
                'status' => 'refunded',
                'refunded_at' => now(),
            ]);

            // Deactivate subscription
            Subscription::where('user_id', $payment->user_id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            Log::channel('payment')->info('Payment refunded', [
                'payment_id' => $payment->id,
                'user_id' => $payment->user_id,
                'amount' => $payment->amount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'İade işlemi başarılı',
            ]);
        }

        return response()->json([
            'error' => true,
            'message' => $result['error'],
        ], 400);
    }

    /**
     * Activate subscription after successful payment
     */
    private function activateSubscription(Payment $payment): void
    {
        $expiresAt = match($payment->billing_period) {
            'monthly' => now()->addMonth(),
            'quarterly' => now()->addMonths(3),
            'yearly' => now()->addYear(),
        };

        // Deactivate existing subscriptions
        Subscription::where('user_id', $payment->user_id)
            ->where('status', 'active')
            ->update(['status' => 'expired']);

        // Create new subscription
        Subscription::create([
            'user_id' => $payment->user_id,
            'payment_id' => $payment->id,
            'plan_type' => $payment->plan_type,
            'billing_period' => $payment->billing_period,
            'status' => 'active',
            'started_at' => now(),
            'expires_at' => $expiresAt,
        ]);

        // Update user subscription fields
        User::where('id', $payment->user_id)->update([
            'subscription_plan' => $payment->plan_type,
            'subscription_expires_at' => $expiresAt,
        ]);

        Log::channel('payment')->info('Subscription activated', [
            'user_id' => $payment->user_id,
            'plan' => $payment->plan_type,
            'expires_at' => $expiresAt,
        ]);
    }

    /**
     * Get plan pricing
     */
    private function getPlanPricing(string $plan, string $period): array
    {
        $pricing = [
            'bronze' => [
                'monthly' => ['amount' => 99, 'name' => 'Terence Bronze - Aylık'],
                'quarterly' => ['amount' => 267, 'name' => 'Terence Bronze - 3 Aylık'],
                'yearly' => ['amount' => 950, 'name' => 'Terence Bronze - Yıllık'],
            ],
            'plus' => [
                'monthly' => ['amount' => 199, 'name' => 'Terence Plus - Aylık'],
                'quarterly' => ['amount' => 537, 'name' => 'Terence Plus - 3 Aylık'],
                'yearly' => ['amount' => 1900, 'name' => 'Terence Plus - Yıllık'],
            ],
            'pro' => [
                'monthly' => ['amount' => 399, 'name' => 'Terence Pro - Aylık'],
                'quarterly' => ['amount' => 1077, 'name' => 'Terence Pro - 3 Aylık'],
                'yearly' => ['amount' => 3800, 'name' => 'Terence Pro - Yıllık'],
            ],
        ];

        return $pricing[$plan][$period];
    }
}
