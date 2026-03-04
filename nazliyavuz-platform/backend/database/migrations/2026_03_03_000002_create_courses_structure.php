<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kurs hiyerarşisi: courses > units > topics > content_items
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->enum('subject', ['Matematik','Fizik','Kimya','Biyoloji','Türkçe','Edebiyat','Tarih','Coğrafya','İngilizce','Felsefe','Din','Geometri','Diğer']);
            $table->enum('exam_type', ['LGS','TYT','AYT','TYT-AYT','KPSS','Genel'])->default('Genel');
            $table->tinyInteger('grade')->nullable()->comment('1-12, null = tüm sınıflar');
            $table->enum('level', ['beginner','intermediate','advanced'])->default('intermediate');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_free')->default(false);
            $table->integer('sort_order')->default(0);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Konu içerikleri: video, pdf, quiz
        Schema::create('content_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('topic_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['video','pdf','quiz','text']);
            $table->string('title');
            $table->string('url')->nullable()->comment('Video/PDF URL (S3/CDN)');
            $table->integer('duration_seconds')->nullable()->comment('Video süresi');
            $table->bigInteger('size_bytes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_free')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Öğrenci ilerleme takibi
        Schema::create('student_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('content_item_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['not_started','in_progress','completed'])->default('not_started');
            $table->integer('watch_seconds')->default(0)->comment('İzlenen süre');
            $table->boolean('marked_understood')->default(false);
            $table->boolean('needs_repeat')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id','content_item_id']);
        });

        // Kurs kayıtları (enrollment)
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->decimal('completion_percentage', 5, 2)->default(0);
            $table->timestamps();
            $table->unique(['user_id','course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('student_progress');
        Schema::dropIfExists('content_items');
        Schema::dropIfExists('topics');
        Schema::dropIfExists('units');
        Schema::dropIfExists('courses');
    }
};
