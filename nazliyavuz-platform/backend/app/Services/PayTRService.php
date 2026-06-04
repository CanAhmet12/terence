<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PayTRService
{
    private string $merchantId;
    private string $merchantKey;
    private string $merchantSalt;
    private string $baseUrl;
    private bool $testMode;

    public function __construct()
    {
        $this->merchantId = config('services.paytr.merchant_id');
        $this->merchantKey = config('services.paytr.merchant_key');
        $this->merchantSalt = config('services.paytr.merchant_salt');
        $this->testMode = config('services.paytr.test_mode', false);
        $this->baseUrl = 'https://www.paytr.com/odeme/api';
    }

    /**
     * Create payment token for iframe
     */
    public function createPaymentToken(array $params): array
    {
        $merchantOid = $this->generateMerchantOid();
        
        $paymentParams = [
            'merchant_id' => $this->merchantId,
            'user_ip' => $params['user_ip'],
            'merchant_oid' => $merchantOid,
            'email' => $params['email'],
            'payment_amount' => $this->formatAmount($params['amount']),
            'payment_type' => 'card',
            'installment_count' => $params['installment'] ?? 0,
            'currency' => 'TL',
            'test_mode' => $this->testMode ? '1' : '0',
            'no_installment' => $params['no_installment'] ?? '0',
            'max_installment' => $params['max_installment'] ?? '0',
            'user_basket' => $this->encodeUserBasket($params['basket']),
            'debug_on' => $this->testMode ? '1' : '0',
            'client_lang' => 'tr',
            'merchant_ok_url' => $params['success_url'],
            'merchant_fail_url' => $params['fail_url'],
            'timeout_limit' => '30',
            'user_name' => $params['user_name'],
            'user_address' => $params['user_address'] ?? 'Türkiye',
            'user_phone' => $params['user_phone'],
        ];

        // Generate hash
        $hashStr = $this->merchantId . $params['user_ip'] . $merchantOid . $params['email'] . 
                   $this->formatAmount($params['amount']) . $paymentParams['user_basket'] . 
                   ($params['no_installment'] ?? '0') . ($params['max_installment'] ?? '0') . 
                   $paymentParams['currency'] . $paymentParams['test_mode'];
        
        $paymentParams['paytr_token'] = base64_encode(hash_hmac('sha256', $hashStr . $this->merchantSalt, $this->merchantKey, true));

        Log::channel('payment')->info('PayTR payment token requested', [
            'merchant_oid' => $merchantOid,
            'amount' => $params['amount'],
            'email' => $params['email'],
        ]);

        try {
            $response = Http::asForm()->post("{$this->baseUrl}/get-token", $paymentParams);
            $result = json_decode($response->body(), true);

            if ($result['status'] === 'success') {
                Log::channel('payment')->info('PayTR token created successfully', [
                    'merchant_oid' => $merchantOid,
                    'token' => $result['token'],
                ]);

                return [
                    'success' => true,
                    'token' => $result['token'],
                    'merchant_oid' => $merchantOid,
                ];
            } else {
                Log::channel('payment')->error('PayTR token creation failed', [
                    'merchant_oid' => $merchantOid,
                    'reason' => $result['reason'] ?? 'Unknown',
                ]);

                return [
                    'success' => false,
                    'error' => $result['reason'] ?? 'Token oluşturulamadı',
                ];
            }
        } catch (\Exception $e) {
            Log::channel('payment')->error('PayTR API error', [
                'merchant_oid' => $merchantOid,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Ödeme sistemi ile bağlantı kurulamadı',
            ];
        }
    }

    /**
     * Verify callback from PayTR
     */
    public function verifyCallback(array $post): array
    {
        $hash = base64_encode(hash_hmac('sha256', 
            $post['merchant_oid'] . $this->merchantSalt . $post['status'] . $post['total_amount'], 
            $this->merchantKey, 
            true
        ));

        if ($hash !== $post['hash']) {
            Log::channel('payment')->error('PayTR callback hash mismatch', [
                'merchant_oid' => $post['merchant_oid'] ?? null,
                'expected_hash' => $hash,
                'received_hash' => $post['hash'] ?? null,
            ]);

            return [
                'success' => false,
                'error' => 'Hash verification failed',
            ];
        }

        Log::channel('payment')->info('PayTR callback verified', [
            'merchant_oid' => $post['merchant_oid'],
            'status' => $post['status'],
            'amount' => $post['total_amount'],
        ]);

        return [
            'success' => true,
            'merchant_oid' => $post['merchant_oid'],
            'status' => $post['status'],
            'amount' => $post['total_amount'],
            'payment_type' => $post['payment_type'] ?? null,
            'installment_count' => $post['installment_count'] ?? 0,
            'failed_reason_code' => $post['failed_reason_code'] ?? null,
            'failed_reason_msg' => $post['failed_reason_msg'] ?? null,
        ];
    }

    /**
     * Refund payment
     */
    public function refund(string $merchantOid, float $amount, string $referenceNo): array
    {
        $params = [
            'merchant_id' => $this->merchantId,
            'merchant_oid' => $merchantOid,
            'return_amount' => $this->formatAmount($amount),
            'reference_no' => $referenceNo,
        ];

        $hashStr = $this->merchantId . $merchantOid . $this->formatAmount($amount) . $referenceNo;
        $params['paytr_token'] = base64_encode(hash_hmac('sha256', $hashStr . $this->merchantSalt, $this->merchantKey, true));

        Log::channel('payment')->info('PayTR refund requested', [
            'merchant_oid' => $merchantOid,
            'amount' => $amount,
            'reference_no' => $referenceNo,
        ]);

        try {
            $response = Http::asForm()->post("{$this->baseUrl}/refund", $params);
            $result = json_decode($response->body(), true);

            if ($result['status'] === 'success') {
                Log::channel('payment')->info('PayTR refund successful', [
                    'merchant_oid' => $merchantOid,
                    'amount' => $amount,
                ]);

                return [
                    'success' => true,
                    'message' => 'İade başarılı',
                ];
            } else {
                Log::channel('payment')->error('PayTR refund failed', [
                    'merchant_oid' => $merchantOid,
                    'reason' => $result['err_msg'] ?? 'Unknown',
                ]);

                return [
                    'success' => false,
                    'error' => $result['err_msg'] ?? 'İade işlemi başarısız',
                ];
            }
        } catch (\Exception $e) {
            Log::channel('payment')->error('PayTR refund API error', [
                'merchant_oid' => $merchantOid,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'İade işlemi sırasında hata oluştu',
            ];
        }
    }

    /**
     * Check payment status
     */
    public function checkPaymentStatus(string $merchantOid): array
    {
        $params = [
            'merchant_id' => $this->merchantId,
            'merchant_oid' => $merchantOid,
        ];

        $hashStr = $this->merchantId . $merchantOid;
        $params['paytr_token'] = base64_encode(hash_hmac('sha256', $hashStr . $this->merchantSalt, $this->merchantKey, true));

        try {
            $response = Http::asForm()->post("{$this->baseUrl}/query", $params);
            $result = json_decode($response->body(), true);

            return [
                'success' => true,
                'status' => $result['status'] ?? 'unknown',
                'amount' => $result['amount'] ?? null,
                'installment' => $result['installment'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::channel('payment')->error('PayTR status check failed', [
                'merchant_oid' => $merchantOid,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Ödeme durumu sorgulanamadı',
            ];
        }
    }

    /**
     * Generate unique merchant order ID
     */
    private function generateMerchantOid(): string
    {
        return 'TRC' . time() . Str::random(6);
    }

    /**
     * Format amount (remove decimals, convert to kuruş)
     */
    private function formatAmount(float $amount): string
    {
        return number_format($amount * 100, 0, '', '');
    }

    /**
     * Encode user basket for PayTR
     */
    private function encodeUserBasket(array $basket): string
    {
        $basketArray = [];
        
        foreach ($basket as $item) {
            $basketArray[] = [
                $item['name'],
                $this->formatAmount($item['price']),
                $item['quantity'] ?? 1,
            ];
        }

        return base64_encode(json_encode($basketArray));
    }
}
