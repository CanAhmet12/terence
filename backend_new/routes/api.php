<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| Terence Eğitim Platformu — API Routes
|--------------------------------------------------------------------------
*/

// ─── Auth (herkese açık) ────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register',              [AuthController::class, 'register']);
    Route::post('login',                 [AuthController::class, 'login']);
    Route::post('forgot-password',       [AuthController::class, 'forgotPassword']);
    Route::post('reset-password',        [AuthController::class, 'resetPassword']);
    Route::post('verify-email',          [AuthController::class, 'verifyEmailCode']);
    Route::post('resend-verification',   [AuthController::class, 'resendVerification']);
});

// PayTR callback (webhook — imzasız, ama hash kontrolü controller'da yapılır)
Route::post('payment/callback',          [PaymentController::class, 'callback']);

// ─── Paket listesi (giriş gerektirmez) ─────────────────────────────────
Route::get('packages',                   [PaymentController::class, 'packages']);

// ─── Giriş gerektiren rotalar ───────────────────────────────────────────
Route::middleware('auth:api')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('me',                 [AuthController::class, 'me']);
        Route::post('refresh',           [AuthController::class, 'refresh']);
        Route::post('logout',            [AuthController::class, 'logout']);
    });

    // Profil
    Route::prefix('user')->group(function () {
        Route::patch('profile',          [AuthController::class, 'updateProfile']);
        Route::post('photo',             [AuthController::class, 'uploadProfilePhoto']);
        Route::post('change-password',   [AuthController::class, 'changePassword']);
        Route::post('goal',              [AuthController::class, 'updateGoal']);
    });

    // ─── Kurslar ──────────────────────────────────────────────────────
    Route::prefix('courses')->group(function () {
        Route::get('/',                  [CourseController::class, 'index']);
        Route::get('{id}',               [CourseController::class, 'show']);
        Route::post('{id}/enroll',       [CourseController::class, 'enroll']);
        Route::get('{id}/progress',      [CourseController::class, 'progress']);
    });
    Route::post('progress',              [CourseController::class, 'updateProgress']);

    // ─── Soru Bankası ─────────────────────────────────────────────────
    Route::prefix('questions')->group(function () {
        Route::get('/',                  [QuestionController::class, 'index']);
        Route::get('similar',            [QuestionController::class, 'similar']);
        Route::post('answer',            [QuestionController::class, 'answer']);
        Route::get('weak',               [QuestionController::class, 'weakAchievements']);
    });
    Route::get('kazanimlar',             [QuestionController::class, 'kazanimlar']);

    // ─── Deneme/Sınav ─────────────────────────────────────────────────
    Route::prefix('exams')->group(function () {
        Route::post('start',             [ExamController::class, 'start']);
        Route::post('{id}/answer',       [ExamController::class, 'answer']);
        Route::post('{id}/finish',       [ExamController::class, 'finish']);
        Route::get('{id}/result',        [ExamController::class, 'result']);
        Route::get('history',            [ExamController::class, 'history']);
    });

    // ─── Günlük Plan ──────────────────────────────────────────────────
    Route::prefix('plan')->group(function () {
        Route::get('/',                  [PlanController::class, 'index']);
        Route::get('today',              [PlanController::class, 'today']);
        Route::get('stats',              [PlanController::class, 'stats']);
        Route::post('tasks',             [PlanController::class, 'addTask']);
        Route::patch('tasks/{id}/complete', [PlanController::class, 'completeTask']);
        Route::delete('tasks/{id}',      [PlanController::class, 'deleteTask']);
        Route::post('study-session/start', [PlanController::class, 'startStudySession']);
        Route::post('study-session/{id}/end', [PlanController::class, 'endStudySession']);
    });

    // ─── Ödeme / Abonelik ─────────────────────────────────────────────
    Route::prefix('payment')->group(function () {
        Route::post('initiate',          [PaymentController::class, 'initiate']);
    });
    Route::get('subscription/status',   [PaymentController::class, 'status']);

    // ─── Öğretmen ─────────────────────────────────────────────────────
    Route::middleware('role:teacher,admin')->prefix('teacher')->group(function () {
        Route::get('stats',              [TeacherController::class, 'stats']);
        Route::get('classes',            [TeacherController::class, 'classes']);
        Route::post('classes',           [TeacherController::class, 'createClass']);
        Route::get('classes/{id}/students', [TeacherController::class, 'classStudents']);
        Route::get('students/risk',      [TeacherController::class, 'riskStudents']);
        Route::get('assignments',        [TeacherController::class, 'assignments']);
        Route::post('assignments',       [TeacherController::class, 'createAssignment']);
        Route::get('live-sessions',      [TeacherController::class, 'liveSessions']);
        Route::post('live-sessions',     [TeacherController::class, 'createLiveSession']);
    });

    // ─── Veli ─────────────────────────────────────────────────────────
    Route::middleware('role:parent,admin')->prefix('parent')->group(function () {
        Route::get('children',           [ParentController::class, 'children']);
        Route::get('children/{id}/summary', [ParentController::class, 'childSummary']);
        Route::post('link',              [ParentController::class, 'linkChild']);
    });

    // Öğrenci: veli bağlantı kodu üret
    Route::post('student/generate-parent-code', [ParentController::class, 'generateParentCode']);

    // ─── Admin ────────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('stats',              [AdminController::class, 'stats']);
        Route::get('users',              [AdminController::class, 'users']);
        Route::patch('users/{id}',       [AdminController::class, 'updateUser']);
        Route::delete('users/{id}',      [AdminController::class, 'deleteUser']);
        Route::post('users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);
        Route::get('content',            [AdminController::class, 'content']);
        Route::delete('content/{id}',    [AdminController::class, 'deleteContent']);
        Route::get('reports',            [AdminController::class, 'reports']);
        Route::get('audit-logs',         [AdminController::class, 'auditLogs']);
        Route::post('settings',          [AdminController::class, 'updateSettings']);
    });
});
