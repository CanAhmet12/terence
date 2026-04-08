<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ContentPageController;
use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PushNotificationController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\PerformanceDashboardController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\FileSharingController;
use App\Http\Controllers\FileUploadController;
use App\Http\Controllers\VideoCallController;
use App\Http\Controllers\TeacherExceptionController;
use App\Http\Controllers\ContactController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->group(function () {
    
    // Health check (public)
    Route::get('/health', [App\Http\Controllers\HealthCheckController::class, 'detailed']);
    Route::get('/health/basic', [App\Http\Controllers\HealthCheckController::class, 'basic']);
    
    // ============================================================
    // PUBLIC AUTH ROUTES (No authentication required)
    // ============================================================
    Route::post('/auth/login', [\App\Http\Controllers\Api\AuthController::class, 'login'])->middleware('auth_rate_limit');
    Route::post('/auth/register', [\App\Http\Controllers\Api\AuthController::class, 'register'])->middleware('auth_rate_limit');
    Route::post('/auth/refresh', [\App\Http\Controllers\Api\AuthController::class, 'refresh']);
    Route::post('/auth/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::post('/auth/forgot-password', [\App\Http\Controllers\Api\AuthController::class, 'forgotPassword'])->middleware('auth_rate_limit');
    Route::post('/auth/reset-password', [\App\Http\Controllers\Api\AuthController::class, 'resetPassword'])->middleware('auth_rate_limit');
    Route::post('/auth/verify-email', [\App\Http\Controllers\Api\AuthController::class, 'verifyEmail']);
    Route::post('/auth/resend-verification', [\App\Http\Controllers\Api\AuthController::class, 'resendVerification'])->middleware('auth_rate_limit');
    Route::post('/auth/verify-email-code', [\App\Http\Controllers\Api\AuthController::class, 'verifyEmailCode'])->middleware('auth_rate_limit');
    
    // Social Authentication (public)
    Route::post('/auth/social/google', [App\Http\Controllers\SocialAuthController::class, 'googleAuth'])->middleware('auth_rate_limit');
    Route::post('/auth/social/facebook', [App\Http\Controllers\SocialAuthController::class, 'facebookAuth'])->middleware('auth_rate_limit');
    Route::post('/auth/social/apple', [App\Http\Controllers\SocialAuthController::class, 'appleAuth'])->middleware('auth_rate_limit');
    
    // Mail status check (public)
    Route::get('/auth/mail-status', [\App\Http\Controllers\Api\AuthController::class, 'getMailStatus']);
    
    // Categories (public)
    Route::get('/categories', [CategoryController::class, 'index'])->middleware('advanced_cache:categories,1800');
    Route::get('/categories/{category}', [CategoryController::class, 'show'])->middleware('advanced_cache:category,1800');
    Route::get('/categories/fallback/{slug}', [CategoryController::class, 'showWithFallback'])->middleware('advanced_cache:category,1800');
    
    // Search
    Route::get('/search/teachers', [SearchController::class, 'searchTeachers']);
    Route::get('/search/suggestions', [SearchController::class, 'getSuggestions']);
    Route::get('/search/popular', [SearchController::class, 'getPopularSearches']);
    Route::get('/search/filters', [SearchController::class, 'getFilters']);
    
    // Teachers (public)
    Route::get('/teachers', [TeacherController::class, 'index']);
    Route::get('/teachers/featured', [TeacherController::class, 'featured']);
    Route::get('/teachers/statistics', [TeacherController::class, 'statistics']);
    Route::get('/teachers/{teacher}', [TeacherController::class, 'show']);
    Route::get('/teachers/{teacher}/reviews', [TeacherController::class, 'reviews']);
    Route::get('/teachers/{teacher}/lessons', [TeacherController::class, 'getTeacherLessons']);
    
    // Ratings (public)
    Route::get('/teachers/{teacher}/ratings', [RatingController::class, 'getTeacherRatings']);
    
    // Content pages (public)
    Route::get('/content-pages', [ContentPageController::class, 'index']);
    Route::get('/content-pages/{slug}', [ContentPageController::class, 'show']);
    
    // Contact form (public)
    Route::post('/contact', [ContactController::class, 'store'])->middleware(['throttle:5,1']);
    
    // Payment callback (public)
    Route::post('/payments/callback', [PaymentController::class, 'handleCallback']);
    
    // Protected routes
    Route::middleware(['auth:api', 'rate_limit:api,60,1', 'update_user_activity'])->group(function () {
        
        // User profile
        Route::get('/user', [UserController::class, 'profile']);
        Route::put('/user', [UserController::class, 'update']);
        Route::post('/user/change-password', [UserController::class, 'changePassword']);
        Route::get('/user/statistics', [UserController::class, 'getStatistics']);
        Route::get('/user/activity-history', [UserController::class, 'getActivityHistory']);
        Route::delete('/user/account', [UserController::class, 'deleteAccount']);
        Route::get('/user/export-data', [UserController::class, 'exportData']);
        Route::get('/user/notification-preferences', [UserController::class, 'getNotificationPreferences']);
        Route::put('/user/notification-preferences', [UserController::class, 'updateNotificationPreferences']);
        
        // User activity endpoints
        Route::post('/user/activity', [UserController::class, 'updateActivity']);
        Route::post('/user/online-status', [UserController::class, 'updateOnlineStatus']);
        
        // Social account linking
        Route::post('/auth/social/link', [App\Http\Controllers\SocialAuthController::class, 'linkSocialAccount']);
        Route::get('/auth/social/accounts', [App\Http\Controllers\SocialAuthController::class, 'getLinkedAccounts']);
        Route::delete('/auth/social/unlink/{provider}', [App\Http\Controllers\SocialAuthController::class, 'unlinkSocialAccount']);
        
        // Teacher profile management
        Route::middleware('role:teacher')->group(function () {
            Route::post('/teacher/profile', [TeacherController::class, 'store']);
            Route::put('/teacher/profile', [TeacherController::class, 'update']);
            Route::get('/teacher/students', [TeacherController::class, 'getStudents']);
            Route::get('/teacher/lessons', [TeacherController::class, 'getLessons']);
            Route::get('/teacher/statistics', [TeacherController::class, 'getStatistics']);
            Route::get('/teacher/reservations', [ReservationController::class, 'teacherReservations']);
            Route::put('/reservations/{reservation}/status', [ReservationController::class, 'updateStatus']);
        });
        
        // Reservations (accessible by both students and teachers)
        Route::get('/reservations', [ReservationController::class, 'index'])->middleware('advanced_cache:reservations,300');
        Route::get('/reservations/statistics', [ReservationController::class, 'getStatistics'])->middleware('advanced_cache:statistics,600');
        Route::post('/reservations', [ReservationController::class, 'store']);
        Route::put('/reservations/{reservation}', [ReservationController::class, 'update']);
        Route::put('/reservations/{reservation}/status', [ReservationController::class, 'updateStatus']);
        Route::post('/reservations/{reservation}/complete', [ReservationController::class, 'complete']);
        Route::post('/reservations/{reservation}/reschedule-request', [ReservationController::class, 'requestReschedule']);
        Route::post('/reservations/{reservation}/reschedule-handle', [ReservationController::class, 'handleRescheduleRequest']);
        Route::post('/reservations/{reservation}/rating', [ReservationController::class, 'submitRating']);
        Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);
        
        // Lessons (accessible by both students and teachers)
        Route::get('/lessons', [LessonController::class, 'getUserLessons']);
        Route::get('/lessons/{lesson}', [LessonController::class, 'show']);
        Route::put('/lessons/notes', [LessonController::class, 'updateNotes']);
        Route::post('/lessons/rate', [LessonController::class, 'rateLesson']);
        
        // Student routes
        Route::middleware('role:student')->group(function () {
            
            // Student specific reservations
            Route::get('/student/reservations', [ReservationController::class, 'studentReservations']);
            
            // Student specific lessons
            Route::get('/student/lessons', [LessonController::class, 'getStudentLessons']);
            
            // Favorites
            Route::get('/favorites', [TeacherController::class, 'favorites']);
            Route::post('/favorites/{teacher}', [TeacherController::class, 'addToFavorites']);
            Route::delete('/favorites/{teacher}', [TeacherController::class, 'removeFromFavorites']);
        });
        
        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        
        // Payments
        Route::post('/payments/create', [PaymentController::class, 'createPayment']);
        Route::post('/payments/confirm', [PaymentController::class, 'confirmPayment']);
        Route::get('/payments/history', [PaymentController::class, 'getPaymentHistory']);
        
        // File sharing
        Route::get('/files/shared', [App\Http\Controllers\FileSharingController::class, 'getSharedFiles']);
        Route::post('/files/upload-shared', [App\Http\Controllers\FileSharingController::class, 'uploadSharedFile']);
        Route::get('/files/download/{file}', [App\Http\Controllers\FileSharingController::class, 'downloadSharedFile']);
        
        // Video calls
        Route::post('/video-call/start', [VideoCallController::class, 'startCall']);
        Route::post('/video-call/answer', [VideoCallController::class, 'answerCall']);
        Route::post('/video-call/reject', [VideoCallController::class, 'rejectCall']);
        Route::post('/video-call/end', [VideoCallController::class, 'endCall']);
        Route::post('/video-call/toggle-mute', [VideoCallController::class, 'toggleMute']);
        Route::post('/video-call/toggle-video', [VideoCallController::class, 'toggleVideo']);
        Route::get('/video-call/history', [VideoCallController::class, 'getCallHistory']);
        Route::get('/video-call/statistics', [VideoCallController::class, 'getCallStatistics']);
        Route::post('/video-call/set-availability', [VideoCallController::class, 'setAvailabilityStatus']);
        Route::get('/video-call/availability/{userId}', [VideoCallController::class, 'checkUserAvailability']);
        
        // WebRTC Signaling (PAKET 1 - İyileştirme)
        Route::post('/video-call/send-offer', [VideoCallController::class, 'sendOffer']);
        Route::post('/video-call/send-answer', [VideoCallController::class, 'sendAnswer']);
        Route::post('/video-call/send-ice-candidate', [VideoCallController::class, 'sendIceCandidate']);
        
        // Lessons
        Route::get('/lessons', [App\Http\Controllers\LessonController::class, 'getUserLessons']);
        Route::get('/lessons/statistics', [App\Http\Controllers\LessonController::class, 'getLessonStatistics']);
        Route::get('/lessons/upcoming', [App\Http\Controllers\LessonController::class, 'getUpcomingLessons']);
        Route::post('/lessons/start', [App\Http\Controllers\LessonController::class, 'startLesson']);
        Route::post('/lessons/end', [App\Http\Controllers\LessonController::class, 'endLesson']);
        Route::put('/lessons/notes', [App\Http\Controllers\LessonController::class, 'updateLessonNotes']);
        Route::post('/lessons/rate', [App\Http\Controllers\LessonController::class, 'rateLesson']);
        Route::get('/lessons/status/{reservation}', [App\Http\Controllers\LessonController::class, 'getLessonStatus']);
        Route::delete('/files/{file}', [App\Http\Controllers\FileSharingController::class, 'deleteSharedFile']);
        
        // Assignments
        Route::get('/assignments', [App\Http\Controllers\AssignmentController::class, 'index']);
        Route::get('/assignments/student', [App\Http\Controllers\AssignmentController::class, 'getStudentAssignments']);
        Route::get('/assignments/teacher', [App\Http\Controllers\AssignmentController::class, 'getTeacherAssignments']);
        Route::get('/assignments/student/statistics', [App\Http\Controllers\AssignmentController::class, 'getStudentAssignmentStatistics']);
        Route::post('/assignments', [App\Http\Controllers\AssignmentController::class, 'store']);
        Route::put('/assignments/{assignment}', [App\Http\Controllers\AssignmentController::class, 'update']);
        Route::delete('/assignments/{assignment}', [App\Http\Controllers\AssignmentController::class, 'destroy']);
        Route::post('/assignments/{assignment}/submit', [App\Http\Controllers\AssignmentController::class, 'submit']);
        Route::post('/assignments/{assignment}/grade', [App\Http\Controllers\AssignmentController::class, 'grade']);
        Route::get('/assignments/{assignment}/download', [App\Http\Controllers\AssignmentController::class, 'downloadSubmission']);
        Route::post('/assignments/{assignment}/request-resubmission', [App\Http\Controllers\AssignmentController::class, 'requestResubmission']);
        Route::post('/assignments/{assignment}/extend-deadline', [App\Http\Controllers\AssignmentController::class, 'extendDeadline']);
        
        // Video call signaling
        Route::post('/chat/signaling', [ChatController::class, 'sendSignalingMessage']);
        
        // Analytics routes
        Route::post('/analytics/track', [App\Http\Controllers\AnalyticsController::class, 'track']);
        Route::get('/analytics/data', [App\Http\Controllers\AnalyticsController::class, 'getAnalyticsData']);
        Route::get('/analytics/user/{userId}/summary', [App\Http\Controllers\AnalyticsController::class, 'getUserAnalyticsSummary']);
        Route::get('/analytics/dashboard', [App\Http\Controllers\AnalyticsController::class, 'getDashboardAnalytics']);
        Route::get('/analytics/performance', [App\Http\Controllers\AnalyticsController::class, 'getPerformanceMetrics']);
        
        
        // File upload
        Route::post('/upload/profile-photo', [App\Http\Controllers\FileUploadController::class, 'uploadProfilePhoto']);
        Route::delete('/upload/profile-photo', [App\Http\Controllers\FileUploadController::class, 'deleteProfilePhoto']);
        Route::post('/upload/document', [App\Http\Controllers\FileUploadController::class, 'uploadDocument']);
        Route::post('/upload/presigned-url', [App\Http\Controllers\FileUploadController::class, 'generatePresignedUrl']);
        
        // Teacher availability management
        Route::get('/teacher/availabilities', [AvailabilityController::class, 'getCurrentTeacherAvailabilities']);
        Route::post('/teacher/availabilities', [AvailabilityController::class, 'store']);
        Route::put('/teacher/availabilities/{availability}', [AvailabilityController::class, 'update']);
        Route::delete('/teacher/availabilities/{availability}', [AvailabilityController::class, 'destroy']);
        
        // Teacher exceptions management (izin, tatil, özel günler)
        Route::get('/teacher/exceptions', [TeacherExceptionController::class, 'index']);
        Route::post('/teacher/exceptions', [TeacherExceptionController::class, 'store']);
        Route::put('/teacher/exceptions/{id}', [TeacherExceptionController::class, 'update']);
        Route::delete('/teacher/exceptions/{id}', [TeacherExceptionController::class, 'destroy']);
        Route::post('/teacher/exceptions/bulk-unavailable', [TeacherExceptionController::class, 'addBulkUnavailable']);
        
            // Push notification routes
            Route::post('/notifications/register-token', [PushNotificationController::class, 'registerToken']);
            Route::post('/notifications/unregister-token', [PushNotificationController::class, 'unregisterToken']);
            Route::post('/notifications/test', [PushNotificationController::class, 'sendTestNotification']);
            Route::get('/notifications/settings', [PushNotificationController::class, 'getNotificationSettings']);
            Route::put('/notifications/settings', [PushNotificationController::class, 'updateNotificationSettings']);
            
            // Chat routes
            Route::get('/chats', [ChatController::class, 'index']);
            Route::get('/chats/unread-count', [ChatController::class, 'getUnreadCount']);
            Route::post('/chats/get-or-create', [ChatController::class, 'getOrCreateChat']);
            Route::post('/chats/messages', [ChatController::class, 'sendMessage']);
            Route::put('/chats/mark-read', [ChatController::class, 'markAsRead']);
            Route::get('/chats/{chatId}/messages', [ChatController::class, 'getMessages']);
            
            // Advanced chat features
            Route::post('/chat/typing', [ChatController::class, 'sendTypingIndicator']);
            Route::post('/chat/messages/{messageId}/reaction', [ChatController::class, 'sendMessageReaction']);
            Route::get('/chat/messages/{messageId}/reactions', [ChatController::class, 'getMessageReactions']);
            Route::delete('/chat/messages/{messageId}', [ChatController::class, 'deleteMessage']);
            Route::post('/chat/upload-file', [ChatController::class, 'uploadMessageFile']);
            Route::post('/chat/voice-message', [ChatController::class, 'sendVoiceMessage']);
            Route::post('/chat/video-call', [ChatController::class, 'sendVideoCallInvitation']);
            Route::post('/chat/video-call-response', [ChatController::class, 'respondToVideoCall']);
            Route::get('/chat/search-messages', [ChatController::class, 'searchMessages']);
            Route::get('/chat/statistics', [ChatController::class, 'getChatStatistics']);
            
            // Advanced message features
            Route::post('/chat/messages/{messageId}/pin', [ChatController::class, 'pinMessage']);
            Route::post('/chat/messages/{messageId}/unpin', [ChatController::class, 'unpinMessage']);
            Route::put('/chat/messages/{messageId}/edit', [ChatController::class, 'editMessage']);
            Route::post('/chat/messages/{messageId}/forward', [ChatController::class, 'forwardMessage']);
            Route::post('/chat/messages/{messageId}/reply', [ChatController::class, 'replyToMessage']);
            Route::post('/chat/messages/{messageId}/thread', [ChatController::class, 'createThread']);
            Route::get('/chat/threads/{threadId}', [ChatController::class, 'getThread']);
            Route::post('/chat/messages/{messageId}/translate', [ChatController::class, 'translateMessage']);
            Route::get('/chat/pinned-messages', [ChatController::class, 'getPinnedMessages']);
        
        // Admin routes
        Route::middleware(['role:admin', 'admin.security', 'throttle:60,1'])->group(function () {
            // Dashboard ve Analytics
            Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
            Route::get('/admin/analytics', [AdminController::class, 'getAnalytics']);
            Route::get('/admin/analytics/real-time', [AdminController::class, 'getRealTimeAnalytics']);
            Route::post('/admin/analytics/clear-cache', [AdminController::class, 'clearAnalyticsCache']);
            
            // Kullanıcı Yönetimi
            Route::get('/admin/users', [AdminController::class, 'getUsers']);
            Route::get('/admin/users/search', [AdminController::class, 'searchUsers']);
            Route::put('/admin/users/{user}/status', [AdminController::class, 'updateUserStatus']);
            Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
            Route::delete('/admin/users', [AdminController::class, 'deleteMultipleUsers']);
            Route::delete('/admin/users/by-name', [AdminController::class, 'deleteUsersByName']);
            Route::post('/admin/users/{userId}/suspend', [AdminController::class, 'suspendUser'])->middleware('throttle:10,1');
            Route::post('/admin/users/{userId}/unsuspend', [AdminController::class, 'unsuspendUser'])->middleware('throttle:10,1');
            
            // Öğretmen Onay Sistemi
            Route::get('/admin/teachers/pending', [AdminController::class, 'getPendingTeachers']);
            Route::post('/admin/teachers/{user}/approve', [AdminController::class, 'approveTeacher']);
            Route::post('/admin/teachers/{user}/reject', [AdminController::class, 'rejectTeacher']);
            
            // Rezervasyon Yönetimi
            Route::get('/admin/reservations', [AdminController::class, 'getReservations']);
            
            // Kategori Yönetimi
            Route::get('/admin/categories', [AdminController::class, 'getCategories']);
            
            // Bildirim Yönetimi
            Route::post('/admin/notifications/send', [AdminController::class, 'sendNotification']);
            Route::post('/admin/notifications/bulk', [AdminController::class, 'sendBulkNotification']);
            Route::get('/admin/notifications/stats', [AdminController::class, 'getNotificationStats']);
            Route::get('/admin/notifications/analytics', [AdminController::class, 'getNotificationAnalytics']);
            Route::post('/admin/notifications/mark-read', [AdminController::class, 'markNotificationsAsRead']);
            Route::delete('/admin/notifications/cleanup', [AdminController::class, 'cleanupOldNotifications']);
            
            // Raporlama ve Analitik
            Route::post('/admin/reports/generate', [AdminController::class, 'generateSystemReport']);
            Route::post('/admin/reports/export-csv', [AdminController::class, 'exportReportToCsv']);
            
            // Yedekleme Sistemi
            Route::post('/admin/backups/database', [AdminController::class, 'createDatabaseBackup']);
            Route::post('/admin/backups/filesystem', [AdminController::class, 'createFilesystemBackup']);
            Route::post('/admin/backups/full', [AdminController::class, 'createFullBackup']);
            Route::get('/admin/backups', [AdminController::class, 'listBackups']);
            Route::get('/admin/backups/stats', [AdminController::class, 'getBackupStats']);
            Route::post('/admin/backups/restore', [AdminController::class, 'restoreFromBackup']);
            Route::delete('/admin/backups/delete', [AdminController::class, 'deleteBackup']);
            Route::post('/admin/categories', [AdminController::class, 'createCategory']);
            
            // Bildirim Sistemi
            Route::post('/admin/notifications/send', [AdminController::class, 'sendNotification']);
            
            // Audit Logs
            Route::get('/admin/audit-logs', [AdminController::class, 'getAuditLogs']);
            Route::post('/admin/teachers/{user}/reject', [AdminController::class, 'rejectTeacher']);
            Route::put('/admin/categories/{category}', [CategoryController::class, 'update']);
            Route::delete('/admin/categories/{category}', [CategoryController::class, 'destroy']);
            
            // Content pages management
            Route::get('/admin/content-pages', [ContentPageController::class, 'index']);
            Route::post('/admin/content-pages', [ContentPageController::class, 'store']);
            Route::put('/admin/content-pages/{page}', [ContentPageController::class, 'update']);
            Route::delete('/admin/content-pages/{page}', [ContentPageController::class, 'destroy']);
            
            // Performance Dashboard routes
            Route::get('/performance/dashboard', [PerformanceDashboardController::class, 'dashboard']);
            Route::get('/performance/trends', [PerformanceDashboardController::class, 'trends']);
            Route::get('/performance/recommendations', [PerformanceDashboardController::class, 'recommendations']);
            Route::get('/performance/export', [PerformanceDashboardController::class, 'export']);
        });
    });
    
    // Public routes (no authentication required) - inside v1 prefix
    Route::middleware('cache_response:600')->group(function () {
        Route::get('/teachers/{teacher}/availabilities', [AvailabilityController::class, 'index']);
        Route::get('/teachers/{teacher}/available-slots', [AvailabilityController::class, 'getAvailableSlots']);
        
        // Search routes
        Route::get('/search', [SearchController::class, 'search']);
        Route::get('/search/suggestions', [SearchController::class, 'suggestions']);
        Route::get('/search/popular', [SearchController::class, 'popularSearches']);
        Route::get('/search/filters', [SearchController::class, 'filters']);
        Route::get('/search/trending', [SearchController::class, 'trending']);
    });
    
    // PayTR callback (public route - inside v1 prefix)
    Route::post('/payments/callback', [PaymentController::class, 'handleCallback']);
});



// ============================================================
// TERENCE EGITIM PLATFORMU - PUBLIC ROUTES
// ============================================================
Route::get('/packages', [\App\Http\Controllers\Api\PaymentController::class, 'packages']);
// REMOVED: Duplicate auth routes below have been consolidated into /api/v1 prefix above
// Old routes were:
// - POST /api/auth/login (duplicated in v1)
// - POST /api/auth/register (duplicated in v1)
// - POST /api/auth/refresh (duplicated in v1)
// - POST /api/auth/logout (duplicated in v1)
// - POST /api/auth/forgot-password (duplicated in v1)
// - POST /api/auth/reset-password (duplicated in v1)
// - POST /api/auth/verify-email (duplicated in v1)
// - POST /api/auth/resend-verification (duplicated in v1)
// - GET /api/auth/me (duplicated in v1)
// All auth endpoints now use /api prefix managed by Terence API below

// Payment callback (public) - Keep outside auth
Route::post('/payment/callback', [\App\Http\Controllers\Api\PaymentController::class, 'callback']);

// ============================================================
// TERENCE EÄÄ°TÄ°M PLATFORMU - API ROUTES
// ============================================================
Route::middleware(['auth:api'])->group(function () {

    // â”€â”€ Auth (Education) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::get('/auth/me', [\App\Http\Controllers\Api\AuthController::class, 'me']);
    Route::patch('/user/profile', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
    Route::post('/user/goal', [\App\Http\Controllers\Api\AuthController::class, 'updateGoal']);
    Route::post('/user/change-password', [\App\Http\Controllers\Api\AuthController::class, 'changePassword']);
    Route::post('/user/photo', [\App\Http\Controllers\Api\AuthController::class, 'uploadProfilePhoto']);

    // â”€â”€ Kurslar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::post('/courses/{id}/enroll', [\App\Http\Controllers\Api\CourseController::class, 'enroll']);
    Route::get('/courses/{id}/progress', [\App\Http\Controllers\Api\CourseController::class, 'progress']);
    Route::get('/courses/{id}', [\App\Http\Controllers\Api\CourseController::class, 'show']);
    Route::get('/courses', [\App\Http\Controllers\Api\CourseController::class, 'index']);
    Route::post('/progress', [\App\Http\Controllers\Api\CourseController::class, 'updateProgress']);

    // â”€â”€ Soru BankasÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ── Soru Bankası ─────────────────────────────────────────────────────────
    Route::get('/questions', [\App\Http\Controllers\Api\QuestionController::class, 'index']);
    Route::post('/questions/answer', [\App\Http\Controllers\Api\QuestionController::class, 'answer']);
    Route::get('/questions/similar', [\App\Http\Controllers\Api\QuestionController::class, 'similar']);
    Route::get('/questions/weak', [\App\Http\Controllers\Api\QuestionController::class, 'weakAchievements']);

    // â”€â”€ Deneme SÄ±navÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::post('/exams/start', [\App\Http\Controllers\Api\ExamController::class, 'start']);
    Route::get('/exams/history', [\App\Http\Controllers\Api\ExamController::class, 'history']);
    Route::post('/exams/{id}/answer', [\App\Http\Controllers\Api\ExamController::class, 'answer']);
    Route::post('/exams/{id}/finish', [\App\Http\Controllers\Api\ExamController::class, 'finish']);
    Route::get('/exams/{id}/result', [\App\Http\Controllers\Api\ExamController::class, 'result']);

    // â”€â”€ GÃ¼nlÃ¼k Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::get('/plan/today', [\App\Http\Controllers\Api\PlanController::class, 'today']);
    Route::get('/plan', [\App\Http\Controllers\Api\PlanController::class, 'index']);
    Route::get('/plan/stats', [\App\Http\Controllers\Api\PlanController::class, 'stats']);
    Route::post('/plan/tasks', [\App\Http\Controllers\Api\PlanController::class, 'addTask']);
    Route::patch('/plan/tasks/{id}/complete', [\App\Http\Controllers\Api\PlanController::class, 'completeTask']);
    Route::delete('/plan/tasks/{id}', [\App\Http\Controllers\Api\PlanController::class, 'deleteTask']);
    Route::post('/plan/study-session/start', [\App\Http\Controllers\Api\PlanController::class, 'startStudySession']);
    Route::post('/plan/study-session/{id}/end', [\App\Http\Controllers\Api\PlanController::class, 'endStudySession']);

    // â”€â”€ Abonelik / Ã–deme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::post('/payment/initiate', [\App\Http\Controllers\Api\PaymentController::class, 'initiate']);
    Route::get('/subscription/status', [\App\Http\Controllers\Api\PaymentController::class, 'status']);

    // â”€â”€ Ã–ÄŸrenci Gamification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::get('/student/badges', [\App\Http\Controllers\Api\StudentController::class, 'badges']);
    Route::get('/student/leaderboard', [\App\Http\Controllers\Api\StudentController::class, 'leaderboard']);
    Route::get('/student/upcoming-lessons', [\App\Http\Controllers\Api\StudentController::class, 'upcomingLessons']);
    Route::post('/student/generate-parent-code', [\App\Http\Controllers\Api\ParentController::class, 'generateParentCode']);

    // â”€â”€ Bildirimler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationApiController::class, 'index']);
    Route::put('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationApiController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [\App\Http\Controllers\Api\NotificationApiController::class, 'markAllRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationApiController::class, 'markAllRead']);
    Route::delete('/notifications/{id}', [\App\Http\Controllers\Api\NotificationApiController::class, 'destroy']);

    // -- Push Token
    Route::post('/push-token', [\App\Http\Controllers\Api\StudentController::class, 'registerPushToken']);

    // -- Student Goal Engine
    Route::get('/student/goal-engine', [\App\Http\Controllers\Api\StudentController::class, 'goalEngine']);
    Route::get('/student/report', [\App\Http\Controllers\Api\StudentController::class, 'report']);

    // -- AI Endpoints
    Route::post('/ai/generate-question', [\App\Http\Controllers\Api\AiController::class, 'generateQuestion']);
    Route::post('/ai/summarize', [\App\Http\Controllers\Api\AiController::class, 'summarize']);
    Route::post('/ai/personal-test', [\App\Http\Controllers\Api\AiController::class, 'personalTest']);
    Route::get('/ai/hard-achievements', [\App\Http\Controllers\Api\AiController::class, 'hardAchievements']);
    Route::post('/ai/ask-coach', [\App\Http\Controllers\Api\AiController::class, 'askCoach']);
    Route::get('/ai/coach/history', [\App\Http\Controllers\Api\AiController::class, 'coachHistory']);
    Route::delete('/ai/coach/history', [\App\Http\Controllers\Api\AiController::class, 'clearCoachHistory']);

    // -- Kupon
    Route::post('/payment/apply-coupon', [\App\Http\Controllers\Api\PaymentController::class, 'applyCoupon']);

    // â”€â”€ Ã–ÄŸretmen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::middleware('role:teacher,admin')->group(function () {
        Route::get('/teacher/stats', [\App\Http\Controllers\Api\TeacherController::class, 'stats']);
        Route::get('/teacher/classes', [\App\Http\Controllers\Api\TeacherController::class, 'classes']);
        Route::post('/teacher/classes', [\App\Http\Controllers\Api\TeacherController::class, 'createClass']);
        Route::get('/teacher/classes/{id}/students', [\App\Http\Controllers\Api\TeacherController::class, 'classStudents']);
        Route::get('/teacher/students/risk', [\App\Http\Controllers\Api\TeacherController::class, 'riskStudents']);
        Route::get('/teacher/assignments', [\App\Http\Controllers\Api\TeacherController::class, 'assignments']);
        Route::post('/teacher/assignments', [\App\Http\Controllers\Api\TeacherController::class, 'createAssignment']);
        Route::patch('/teacher/assignments/{id}', [\App\Http\Controllers\Api\TeacherController::class, 'updateAssignment']);
        Route::delete('/teacher/assignments/{id}', [\App\Http\Controllers\Api\TeacherController::class, 'deleteAssignment']);
        Route::get('/teacher/live-sessions', [\App\Http\Controllers\Api\TeacherController::class, 'liveSessions']);
        Route::post('/teacher/live-sessions', [\App\Http\Controllers\Api\TeacherController::class, 'createLiveSession']);
        Route::get('/teacher/analytics/{type}', [\App\Http\Controllers\Api\TeacherController::class, 'analytics']);
        Route::get('/teacher/messages', [\App\Http\Controllers\Api\TeacherController::class, 'messages']);
        Route::post('/teacher/messages', [\App\Http\Controllers\Api\TeacherController::class, 'sendMessage']);
    });

    // â”€â”€ Veli â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::middleware('role:parent,admin')->group(function () {
        Route::get('/parent/children', [\App\Http\Controllers\Api\ParentController::class, 'children']);
        Route::get('/parent/children/{id}/summary', [\App\Http\Controllers\Api\ParentController::class, 'childSummary']);
        Route::post('/parent/link', [\App\Http\Controllers\Api\ParentController::class, 'linkChild']);
        Route::get('/parent/child-report', [\App\Http\Controllers\Api\ParentController::class, 'childReport']);
        Route::get('/parent/notification-settings', [\App\Http\Controllers\Api\ParentController::class, 'getNotificationSettings']);
        Route::patch('/parent/notification-settings', [\App\Http\Controllers\Api\ParentController::class, 'updateNotificationSettings']);
    });

    // â”€â”€ Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/stats', [\App\Http\Controllers\Api\AdminController::class, 'stats']);
        Route::get('/admin/users', [\App\Http\Controllers\Api\AdminController::class, 'users']);
        Route::patch('/admin/users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteUser']);
        Route::post('/admin/users/{id}/toggle-status', [\App\Http\Controllers\Api\AdminController::class, 'toggleUserStatus']);
        Route::get('/admin/content', [\App\Http\Controllers\Api\AdminController::class, 'content']);
        Route::delete('/admin/content/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteContent']);
        Route::get('/admin/reports', [\App\Http\Controllers\Api\AdminController::class, 'reports']);
        Route::get('/admin/audit-logs', [\App\Http\Controllers\Api\AdminController::class, 'auditLogs']);
        Route::get('/admin/questions', [\App\Http\Controllers\Api\AdminController::class, 'questions']);
        Route::post('/admin/questions', [\App\Http\Controllers\Api\AdminController::class, 'createQuestion']);
        Route::delete('/admin/questions/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteQuestion']);
        Route::get('/admin/teachers/pending', [\App\Http\Controllers\Api\AdminController::class, 'pendingTeachers']);
        Route::post('/admin/teachers/{id}/approve', [\App\Http\Controllers\Api\AdminController::class, 'approveTeacher']);
        Route::post('/admin/teachers/{id}/reject', [\App\Http\Controllers\Api\AdminController::class, 'rejectTeacher']);
        Route::get('/admin/coupons', [\App\Http\Controllers\Api\AdminController::class, 'coupons']);
        Route::post('/admin/coupons', [\App\Http\Controllers\Api\AdminController::class, 'createCoupon']);
        Route::patch('/admin/coupons/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateCoupon']);
        Route::delete('/admin/coupons/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteCoupon']);
        Route::post('/admin/settings', [\App\Http\Controllers\Api\AdminController::class, 'updateSettings']);
    });
});

// Payment callback (public)
Route::post('/payment/callback', [\App\Http\Controllers\Api\PaymentController::class, 'callback']);
