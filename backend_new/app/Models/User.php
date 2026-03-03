<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'phone', 'bio',
        'profile_photo_url', 'verified_at', 'email_verified_at',
        'fcm_tokens', 'suspended_at', 'suspended_until',
        'suspension_reason', 'last_login_at', 'teacher_status',
        'admin_notes', 'approved_by', 'approved_at', 'rejection_reason',
        'status', 'email_notifications', 'push_notifications',
        'lesson_reminders', 'marketing_emails', 'suspended_reason',
        'suspended_by',
        // Terence platform alanları
        'grade', 'subscription_plan', 'subscription_expires_at',
        'target_exam', 'target_school', 'target_department',
        'target_net', 'current_net', 'xp_points', 'level',
        'daily_reminder_time',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at'        => 'datetime',
            'verified_at'              => 'datetime',
            'suspended_at'             => 'datetime',
            'suspended_until'          => 'datetime',
            'last_login_at'            => 'datetime',
            'approved_at'              => 'datetime',
            'subscription_expires_at'  => 'datetime',
            'password'                 => 'hashed',
            'fcm_tokens'               => 'array',
        ];
    }

    // JWT
    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return []; }

    // Role helpers
    public function isStudent(): bool  { return $this->role === 'student'; }
    public function isTeacher(): bool  { return $this->role === 'teacher'; }
    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isParent(): bool   { return $this->role === 'parent'; }

    public function isSuspended(): bool
    {
        if (!$this->suspended_at) return false;
        if ($this->suspended_until?->isPast()) {
            $this->update(['suspended_at' => null, 'suspended_until' => null]);
            return false;
        }
        return true;
    }

    // API response formatı
    public function toApiArray(): array
    {
        $data = [
            'id'                  => $this->id,
            'name'                => $this->name,
            'email'               => $this->email,
            'role'                => $this->role,
            'phone'               => $this->phone,
            'bio'                 => $this->bio,
            'profile_photo_url'   => $this->profile_photo_url,
            'email_verified_at'   => $this->email_verified_at,
            'subscription_plan'   => $this->subscription_plan ?? 'free',
            'subscription_expires_at' => $this->subscription_expires_at,
            'xp_points'           => $this->xp_points ?? 0,
            'level'               => $this->level ?? 1,
            'last_login_at'       => $this->last_login_at,
            'created_at'          => $this->created_at,
        ];

        if ($this->isStudent()) {
            $data['goal'] = [
                'exam_type'         => $this->target_exam,
                'grade'             => $this->grade,
                'target_school'     => $this->target_school,
                'target_department' => $this->target_department,
                'target_net'        => $this->target_net,
                'current_net'       => $this->current_net ?? 0,
            ];
        }

        return $data;
    }

    // Relations
    public function enrollments()    { return $this->hasMany(CourseEnrollment::class); }
    public function examSessions()   { return $this->hasMany(ExamSession::class); }
    public function dailyPlans()     { return $this->hasMany(DailyPlan::class); }
    public function studySessions()  { return $this->hasMany(StudySession::class); }
    public function subscriptions()  { return $this->hasMany(Subscription::class); }
    public function badges()         { return $this->belongsToMany(Badge::class, 'user_badges')->withPivot('earned_at'); }
    public function notifications()  { return $this->hasMany(Notification::class); }
    public function auditLogs()      { return $this->hasMany(AuditLog::class); }

    // Öğretmen için
    public function classRooms()     { return $this->hasMany(ClassRoom::class, 'teacher_id'); }

    // Veli için
    public function children()
    {
        return $this->belongsToMany(User::class, 'parent_students', 'parent_id', 'student_id')
            ->withPivot('status', 'relation');
    }

    // Öğrenci için - veliler
    public function parents()
    {
        return $this->belongsToMany(User::class, 'parent_students', 'student_id', 'parent_id')
            ->withPivot('status', 'relation');
    }
}
