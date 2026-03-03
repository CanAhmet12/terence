<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Deneme/sınav oturumu
        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->enum('exam_type', ['LGS','TYT','AYT','TYT-AYT','KPSS','Mini'])->default('TYT');
            $table->enum('status', ['pending','in_progress','completed','abandoned'])->default('pending');
            $table->integer('duration_minutes')->default(135);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->integer('time_spent_seconds')->nullable();
            $table->integer('total_questions')->default(0);
            $table->integer('correct_count')->default(0);
            $table->integer('wrong_count')->default(0);
            $table->integer('empty_count')->default(0);
            $table->decimal('net_score', 6, 2)->default(0);
            $table->json('subject_breakdown')->nullable()->comment('{"Matematik": {"correct":10,"wrong":2,"empty":3,"net":9.5}}');
            $table->json('percentile_data')->nullable()->comment('Yüzdelik dilim bilgisi');
            $table->timestamps();
            $table->index(['user_id','exam_type']);
            $table->index(['user_id','status']);
        });

        // Deneme soru eşleşmesi
        Schema::create('exam_session_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('question_id')->constrained()->onDelete('cascade');
            $table->integer('sort_order')->default(0);
            $table->string('section')->nullable()->comment('Türkçe, Matematik vs.');
            $table->unique(['exam_session_id','question_id']);
        });

        // Deneme cevapları
        Schema::create('exam_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('question_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('selected_option', 1)->nullable()->comment('null = boş');
            $table->boolean('is_correct')->nullable();
            $table->boolean('is_flagged')->default(false);
            $table->integer('time_spent_seconds')->default(0);
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();
            $table->unique(['exam_session_id','question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_answers');
        Schema::dropIfExists('exam_session_questions');
        Schema::dropIfExists('exam_sessions');
    }
};
