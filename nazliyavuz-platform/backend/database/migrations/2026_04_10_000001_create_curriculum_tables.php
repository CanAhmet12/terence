<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Müfredat dersleri — sınıf ve sınav tipine göre dersler
        Schema::create('curriculum_subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name');                         // "Matematik"
            $table->string('slug')->unique();               // "matematik"
            $table->string('icon')->default('📚');         // emoji ikon
            $table->string('color')->default('#6366f1');   // HEX renk
            // grade: 5-12 arası sınıf ya da 'all' (tüm sınıflar için)
            $table->string('grade')->default('all');
            // exam_type: TYT, AYT, TYT-AYT, LGS, KPSS, Genel, all
            $table->string('exam_type')->default('all');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['grade', 'exam_type']);
        });

        // Müfredat üniteleri — bir dersin bölümleri
        Schema::create('curriculum_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('curriculum_subjects')->cascadeOnDelete();
            $table->string('title');                        // "Sayılar ve Cebir"
            $table->text('description')->nullable();
            $table->string('meb_code')->nullable();         // MEB ünite kodu (ör: MAT.9.1)
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['subject_id', 'sort_order']);
        });

        // Müfredat konuları — bir ünitenin konuları
        Schema::create('curriculum_topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained('curriculum_units')->cascadeOnDelete();
            $table->string('title');                        // "Doğal Sayılar"
            $table->text('description')->nullable();
            $table->string('meb_code')->nullable();         // MEB konu kodu
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            // Mevcut courses → topics ile bağlantı (içerik eklenince doldurulur)
            $table->foreignId('linked_topic_id')->nullable()->constrained('topics')->nullOnDelete();
            $table->timestamps();

            $table->index(['unit_id', 'sort_order']);
        });

        // Öğrenci müfredat konu ilerlemesi
        Schema::create('curriculum_topic_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('topic_id')->constrained('curriculum_topics')->cascadeOnDelete();
            $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'topic_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_topic_progress');
        Schema::dropIfExists('curriculum_topics');
        Schema::dropIfExists('curriculum_units');
        Schema::dropIfExists('curriculum_subjects');
    }
};
