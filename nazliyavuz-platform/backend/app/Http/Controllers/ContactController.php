<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    /**
     * Handle contact form submission.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'konu' => 'required|string|max:100',
            'mesaj' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Lütfen tüm alanları doğru şekilde doldurun.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $toEmail = env('CONTACT_EMAIL', config('mail.from.address'));

        $konuLabels = [
            'genel' => 'Genel Bilgi',
            'teknik' => 'Teknik Destek',
            'paket' => 'Paket / Ödeme',
            'veli' => 'Veli Kaydı',
        ];
        $konuLabel = $konuLabels[$data['konu']] ?? $data['konu'];

        try {
            Mail::send('emails.contact-form', array_merge($data, ['konu_label' => $konuLabel]), function ($message) use ($data, $toEmail, $konuLabel) {
                $message->to($toEmail)
                    ->replyTo($data['email'], $data['name'])
                    ->subject('[İletişim Formu] ' . $konuLabel);
            });

            Log::info('Contact form submitted', [
                'email' => $data['email'],
                'konu' => $data['konu'],
            ]);

            return response()->json([
                'message' => 'Mesajınız alındı. En kısa sürede size dönüş yapacağız.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Contact form mail failed', [
                'error' => $e->getMessage(),
                'email' => $data['email'],
            ]);

            return response()->json([
                'message' => 'Mesajınız alındı. En kısa sürede size dönüş yapacağız.',
            ], 200);
        }
    }
}
