<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Tablolar zaten mevcut — sadece eksik olanları oluştur
    private array $existing = [
        'badges','user_badges','class_rooms','class_students',
        'assignments','payment_logs','xp_logs',
    ];

    public function up(): void
    {
        // Rozet tanımları — zaten var, atla
        // user_badges — zaten var

        // xp_logs — zaten var
        // class_rooms — zaten var
        // class_students — zaten var
        // assignments — zaten var

        // assignment_completions — YENİ
        if (!Schema::hasTable('assignment_completions')) {
            Schema::create('assignment_completions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->constrained()->onDelete('cascade');
                $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
                $table->integer('completed_count')->default(0);
                $table->boolean('is_done')->default(false);
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
                $table->unique(['assignment_id','student_id']);
            });
        }

        // parent_students — YENİ
        if (!Schema::hasTable('parent_students')) {
            Schema::create('parent_students', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parent_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
                $table->string('relation')->default('parent');
                $table->enum('status', ['pending','approved','rejected'])->default('pending');
                $table->string('invite_code', 10)->nullable();
                $table->timestamps();
                $table->unique(['parent_id','student_id']);
            });
        }

        // live_sessions — YENİ
        if (!Schema::hasTable('live_sessions')) {
            Schema::create('live_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('class_room_id')->nullable()->constrained()->nullOnDelete();
                $table->string('title');
                $table->string('daily_room_url')->nullable();
                $table->string('daily_room_name')->nullable();
                $table->timestamp('scheduled_at')->nullable();
                $table->integer('duration_minutes')->default(60);
                $table->enum('status', ['scheduled','live','ended'])->default('scheduled');
                $table->timestamps();
            });
        }

        // announcements — YENİ
        if (!Schema::hasTable('announcements')) {
            Schema::create('announcements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
                $table->string('title');
                $table->text('body');
                $table->enum('target_role', ['all','student','teacher','parent'])->default('all');
                $table->foreignId('class_room_id')->nullable()->constrained()->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        }

        // class_rooms tablosuna join_code yoksa ekle
        if (Schema::hasTable('class_rooms') && !Schema::hasColumn('class_rooms', 'join_code')) {
            Schema::table('class_rooms', function (Blueprint $table) {
                $table->string('join_code', 10)->nullable()->after('name');
            });
        }

        // assignments tablosuna class_room_id yoksa ekle
        if (Schema::hasTable('assignments') && !Schema::hasColumn('assignments', 'class_room_id')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->foreignId('class_room_id')->nullable()->constrained()->nullOnDelete()->after('teacher_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('live_sessions');
        Schema::dropIfExists('parent_students');
        Schema::dropIfExists('assignment_completions');
    }
};
