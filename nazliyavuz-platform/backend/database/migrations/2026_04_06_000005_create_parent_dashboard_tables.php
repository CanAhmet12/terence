<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Study sessions table - Track all study activities
        Schema::create('study_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_minutes')->default(0);
            $table->string('activity_type'); // video_watch, question_solve, exam, reading
            $table->foreignId('related_id')->nullable(); // course_id, question_id, exam_id, etc.
            $table->string('related_type')->nullable(); // course, question, exam
            $table->json('metadata')->nullable(); // Additional tracking data
            $table->timestamps();
            
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'activity_type']);
        });

        // Parent notifications table
        Schema::create('parent_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // low_performance, streak_broken, achievement, exam_result
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index(['parent_id', 'is_read', 'created_at']);
            $table->index(['student_id', 'type']);
        });

        // Parent settings table
        Schema::create('parent_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->onDelete('cascade');
            
            // Notification preferences
            $table->boolean('notify_low_performance')->default(true);
            $table->boolean('notify_streak_broken')->default(true);
            $table->boolean('notify_achievements')->default(true);
            $table->boolean('notify_exam_results')->default(true);
            $table->boolean('notify_weekly_report')->default(true);
            
            // Report preferences
            $table->enum('report_frequency', ['daily', 'weekly', 'monthly'])->default('weekly');
            $table->time('report_time')->default('20:00:00');
            $table->boolean('email_reports')->default(true);
            $table->boolean('sms_reports')->default(false);
            
            // Alert thresholds
            $table->integer('accuracy_threshold')->default(60); // Alert if below
            $table->integer('study_time_threshold')->default(30); // Minutes per day
            $table->integer('streak_broken_threshold')->default(3); // Days
            
            $table->timestamps();
            
            $table->unique('parent_id');
        });

        // Performance alerts table
        Schema::create('performance_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('parent_id')->constrained('users')->onDelete('cascade');
            $table->string('alert_type'); // accuracy_drop, inactivity, streak_broken, exam_fail
            $table->string('severity'); // low, medium, high, critical
            $table->text('message');
            $table->json('details')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            
            $table->index(['parent_id', 'is_resolved', 'severity']);
            $table->index(['student_id', 'alert_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_alerts');
        Schema::dropIfExists('parent_settings');
        Schema::dropIfExists('parent_notifications');
        Schema::dropIfExists('study_sessions');
    }
};
