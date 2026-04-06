<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\EmailVerification;
use App\Models\RefreshToken;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cookie;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    public function __construct(protected MailService $mailService) {}

    public function register(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|max:255|unique:users',
            'password'              => 'required|string|min:8|confirmed',
            'role'                  => 'required|in:student,teacher,parent',
            'phone'                 => 'nullable|string|max:20',
            'grade'                 => 'nullable|integer|between:1,12',
            'target_exam'           => 'nullable|in:LGS,TYT,AYT,TYT-AYT,KPSS',
            'target_school'         => 'nullable|string|max:255',
            'target_department'     => 'nullable|string|max:255',
            'target_net'            => 'nullable|numeric|min:0|max:200',
            'subject'               => 'nullable|string|max:100',
            'bio'                   => 'nullable|string|max:500',
            'child_email'           => 'nullable|email',
            'device_name'           => 'nullable|string|max:255',
            'device_id'             => 'nullable|string|max:255',
        ]);

        if ($v->fails()) {
            return $this->validationError($v, $request);
        }

        $user = User::create([
            'name'              => $request->name,
            'email'             => $request->email,
            'password'          => Hash::make($request->password),
            'role'              => $request->role,
            'phone'             => $request->phone,
            'grade'             => $request->grade,
            'target_exam'       => $request->target_exam,
            'target_school'     => $request->target_school,
            'target_department' => $request->target_department,
            'target_net'        => $request->target_net,
        ]);

        // Öğretmen ek alanları
        if ($request->role === 'teacher' && ($request->subject || $request->bio)) {
            $user->update(array_filter([
                'subject' => $request->subject,
                'bio'     => $request->bio,
            ]));
        }

        // Veli-çocuk bağlantısı
        if ($request->role === 'parent' && $request->child_email) {
            $child = User::where('email', $request->child_email)->where('role', 'student')->first();
            if ($child) {
                $user->addChild($child->id);
            }
        }

        // Email doğrulama kodu gönder
        try {
            $verification = EmailVerification::createForUser($user);
            $this->mailService->sendEmailVerification($user, $verification->token, $verification->verification_code);
        } catch (\Exception $e) {
            Log::warning('Email verification send failed: ' . $e->getMessage());
        }

        // Generate tokens
        $accessToken = JWTAuth::fromUser($user);
        $refreshToken = RefreshToken::generate(
            $user->id,
            $request->input('device_name'),
            $request->input('device_id'),
            $request->ip(),
            $request->userAgent(),
            30 // 30 days
        );

        $response = response()->json([
            'success' => true,
            'message' => 'Kayıt başarılı',
            'user'    => $user->toApiArray(),
            'token'   => $this->tokenData($accessToken),
            'verification_required' => $user->email_verified_at === null,
        ], 201);

        // Set HttpOnly cookie for refresh token
        return $this->attachRefreshTokenCookie($response, $refreshToken->token);
    }

    public function login(Request $request): JsonResponse
    {
        // Get data from JSON body or form data
        $data = [];
        if ($request->getContent() && $request->header('Content-Type') === 'application/json') {
            $rawBody = $request->getContent();
            \Log::info('Login JSON Body: ' . $rawBody);
            $data = json_decode($rawBody, true) ?: [];
        } else {
            $data = $request->all();
        }
        
        \Log::info('Login Data: ' . json_encode($data));
        
        $v = Validator::make($data, [
            'email'       => 'required|email',
            'password'    => 'required|string|min:6',
            'device_name' => 'nullable|string|max:255',
            'device_id'   => 'nullable|string|max:255',
        ]);

        if ($v->fails()) {
            \Log::warning('Login Validation Failed: ' . json_encode($v->errors()));
            return $this->validationError($v, $request);
        }

        if (!$token = JWTAuth::attempt($data)) {
            \Log::warning('Login Invalid Credentials for: ' . ($data['email'] ?? 'unknown'));
            return response()->json([
                'error'   => true,
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'E-posta veya şifre hatalı',
            ], 401);
        }

        $user = Auth::user();
        $user->update(['last_login_at' => now()]);

        // Generate refresh token
        $refreshToken = RefreshToken::generate(
            $user->id,
            $data['device_name'] ?? null,
            $data['device_id'] ?? null,
            $request->ip(),
            $request->userAgent(),
            30 // 30 days
        );

        \Log::info('Login Successful for: ' . $user->email);

        $response = response()->json([
            'success' => true,
            'message' => 'Giriş başarılı',
            'user'    => $user->toApiArray(),
            'token'   => $this->tokenData($token),
            'verification_required' => $user->email_verified_at === null,
        ]);

        // Set HttpOnly cookie for refresh token
        return $this->attachRefreshTokenCookie($response, $refreshToken->token);
    }

    public function me(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => true, 'message' => 'Yetkisiz'], 401);
        }
        return response()->json(['success' => true, 'user' => $user->toApiArray()]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = Auth::user();

        $v = Validator::make($request->all(), [
            'name'               => 'sometimes|string|max:255',
            'phone'              => 'sometimes|nullable|string|max:20',
            'bio'                => 'sometimes|nullable|string|max:500',
            'grade'              => 'sometimes|nullable|integer|between:1,12',
            'target_exam'        => 'sometimes|nullable|in:LGS,TYT,AYT,TYT-AYT,KPSS',
            'target_school'      => 'sometimes|nullable|string|max:255',
            'target_department'  => 'sometimes|nullable|string|max:255',
            'target_net'         => 'sometimes|nullable|numeric|min:0|max:200',
            'daily_reminder_time'=> 'sometimes|nullable|date_format:H:i',
            'profile_photo_url'  => 'sometimes|nullable|string',
        ]);

        if ($v->fails()) {
            return $this->validationError($v, $request);
        }

        $user->update($v->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profil güncellendi',
            'user'    => $user->fresh()->toApiArray(),
        ]);
    }

    public function updateGoal(Request $request): JsonResponse
    {
        $user = Auth::user();
        $v = Validator::make($request->all(), [
            'exam_type'          => 'sometimes|in:LGS,TYT,AYT,TYT-AYT,KPSS',
            'grade'              => 'sometimes|nullable|integer|between:1,12',
            'target_school'      => 'sometimes|nullable|string|max:255',
            'target_department'  => 'sometimes|nullable|string|max:255',
            'target_net'         => 'sometimes|nullable|numeric',
        ]);
        if ($v->fails()) {
            return $this->validationError($v, $request);
        }
        $data = $v->validated();
        $mapped = [];
        if (isset($data['exam_type'])) $mapped['target_exam'] = $data['exam_type'];
        if (array_key_exists('grade', $data)) $mapped['grade'] = $data['grade'];
        if (array_key_exists('target_school', $data)) $mapped['target_school'] = $data['target_school'];
        if (array_key_exists('target_department', $data)) $mapped['target_department'] = $data['target_department'];
        if (array_key_exists('target_net', $data)) $mapped['target_net'] = $data['target_net'];
        $user->update($mapped);

        return response()->json([
            'success' => true,
            'message' => 'Hedef güncellendi',
            'goal' => [
                'exam_type'          => $user->target_exam,
                'grade'              => $user->grade,
                'target_school'      => $user->target_school,
                'target_department'  => $user->target_department,
                'target_net'         => $user->target_net,
            ],
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = Auth::user();
        $v = Validator::make($request->all(), [
            'current_password'      => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);
        if ($v->fails()) {
            return $this->validationError($v, $request);
        }
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'error'   => true,
                'code'    => 'WRONG_PASSWORD',
                'message' => 'Mevcut şifre yanlış',
            ], 400);
        }
        $user->update(['password' => Hash::make($request->password)]);
        
        // Revoke all other tokens for security
        RefreshToken::revokeAllForUser($user->id);
        
        return response()->json(['success' => true, 'message' => 'Şifre başarıyla değiştirildi. Lütfen tekrar giriş yapın.']);
    }

    public function uploadProfilePhoto(Request $request): JsonResponse
    {
        $user = Auth::user();
        $v = Validator::make($request->all(), [
            'photo' => 'required|image|max:2048|mimes:jpg,jpeg,png,webp',
        ]);
        if ($v->fails()) {
            return $this->validationError($v, $request);
        }
        $path = $request->file('photo')->store('profile-photos', 'public');
        $url = asset('storage/' . $path);
        $user->update(['profile_photo_url' => $url]);
        return response()->json([
            'success' => true,
            'url'     => $url,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception) {}
        
        // Revoke refresh token from cookie
        $refreshTokenString = $request->cookie('refresh_token');
        if ($refreshTokenString) {
            $refreshToken = RefreshToken::findByToken($refreshTokenString);
            if ($refreshToken) {
                $refreshToken->revoke();
            }
        }
        
        $response = response()->json(['success' => true, 'message' => 'Çıkış yapıldı']);
        
        // Clear refresh token cookie
        return $response->withCookie(Cookie::forget('refresh_token'));
    }

    public function refresh(Request $request): JsonResponse
    {
        // Get refresh token from HttpOnly cookie
        $refreshTokenString = $request->cookie('refresh_token');
        
        if (!$refreshTokenString) {
            return response()->json([
                'error' => true,
                'code' => 'REFRESH_TOKEN_MISSING',
                'message' => 'Refresh token bulunamadı'
            ], 401);
        }
        
        $refreshToken = RefreshToken::findByToken($refreshTokenString);
        
        if (!$refreshToken || !$refreshToken->isValid()) {
            return response()->json([
                'error' => true,
                'code' => 'REFRESH_TOKEN_INVALID',
                'message' => 'Refresh token geçersiz veya süresi dolmuş'
            ], 401);
        }
        
        $user = $refreshToken->user;
        
        // Generate new access token
        $accessToken = JWTAuth::fromUser($user);
        
        // Generate new refresh token (rotation)
        $newRefreshToken = RefreshToken::generate(
            $user->id,
            $refreshToken->device_name,
            $refreshToken->device_id,
            $request->ip(),
            $request->userAgent(),
            30
        );
        
        // Revoke old refresh token
        $refreshToken->revoke();
        
        // Mark new token as used
        $newRefreshToken->markAsUsed();
        
        $response = response()->json([
            'success' => true,
            'token' => $this->tokenData($accessToken),
            'user' => $user->toApiArray()
        ]);
        
        // Set new refresh token cookie
        return $this->attachRefreshTokenCookie($response, $newRefreshToken->token);
    }

    public function revokeAllTokens(): JsonResponse
    {
        $user = Auth::user();
        RefreshToken::revokeAllForUser($user->id);
        
        return response()->json([
            'success' => true,
            'message' => 'Tüm cihazlardaki oturumlar sonlandırıldı'
        ]);
    }

    // --------------------------------------------------------
    private function tokenData(string $token): array
    {
        return [
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => config('jwt.ttl') * 60,
        ];
    }

    private function attachRefreshTokenCookie(JsonResponse $response, string $refreshToken): JsonResponse
    {
        return $response->withCookie(
            Cookie::make(
                'refresh_token',
                $refreshToken,
                60 * 24 * 30, // 30 days in minutes
                '/',
                config('session.domain'),
                config('session.secure', true), // Secure (HTTPS only)
                true, // HttpOnly
                false, // Raw
                config('session.same_site', 'lax') // SameSite
            )
        );
    }

    private function validationError(\Illuminate\Validation\Validator $v, Request $request): JsonResponse
    {
        return response()->json([
            'error'     => true,
            'code'      => 'VALIDATION_ERROR',
            'message'   => 'Geçersiz veri',
            'errors'    => $v->errors(),
            'timestamp' => now()->toISOString(),
            'path'      => $request->path(),
        ], 422);
    }
}
