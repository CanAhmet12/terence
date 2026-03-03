<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\EmailVerification;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
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
        ]);

        if ($v->fails()) {
            return $this->validationError($v, $request);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'phone'    => $request->phone,
            'grade'    => $request->grade,
        ]);

        // Email doğrulama kodu gönder
        try {
            $verification = EmailVerification::createForUser($user);
            $this->mailService->sendEmailVerification($user, $verification->token, $verification->verification_code);
        } catch (\Exception $e) {
            Log::warning('Email verification send failed: ' . $e->getMessage());
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Kayıt başarılı',
            'user'    => $user->toApiArray(),
            'token'   => $this->tokenData($token),
            'verification_required' => $user->email_verified_at === null,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($v->fails()) {
            return $this->validationError($v, $request);
        }

        if (!$token = JWTAuth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'error'   => true,
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'E-posta veya şifre hatalı',
            ], 401);
        }

        $user = Auth::user();
        $user->update(['last_login_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Giriş başarılı',
            'user'    => $user->toApiArray(),
            'token'   => $this->tokenData($token),
            'verification_required' => $user->email_verified_at === null,
        ]);
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
        return response()->json(['success' => true, 'message' => 'Şifre başarıyla değiştirildi']);
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

    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception) {}
        return response()->json(['success' => true, 'message' => 'Çıkış yapıldı']);
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json(['success' => true, 'token' => $this->tokenData($token)]);
        } catch (JWTException) {
            return response()->json(['error' => true, 'code' => 'TOKEN_EXPIRED', 'message' => 'Token yenilenemedi'], 401);
        }
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
