<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Günlük plan başlıkları
        Schema::create('daily_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('plan_date');
            $table->enum('status', ['pending','active','completed','partially'])->default('pending');
            $table->integer('total_tasks')->default(0);
            $table->integer('completed_tasks')->default(0);
            $table->integer('study_minutes_actual')->default(0);
            $table->integer('study_minutes_planned')->default(0);
            $table->boolean('is_auto_generated')->default(false);
            $table->timestamps();
            $table->unique(['user_id','plan_date']);
        });

        // Plan görevleri
        Schema::create('plan_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_plan_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->enum('type', ['video','question','exam','read','repeat','custom'])->default('custom');
            $table->string('subject')->nullable();
            $table->string('kazanim_code', 30)->nullable();
            $table->integer('target_count')->nullable()->comment('Hedef soru sayısı');
            $table->integer('actual_count')->default(0)->comment('Yapılan soru sayısı');
            $table->integer('planned_minutes')->default(30);
            $table->integer('actual_minutes')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->boolean('is_ai_suggested')->default(false);
            $table->string('priority', 10)->default('normal')->comment('low,normal,high');
            $table->nullableMorphs('taskable');
            $table->timestamp('completed_at')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->index(['user_id','is_completed']);
        });

        // Çalışma seansları (zaman takibi)
        Schema::create('study_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('subject')->nullable();
            $table->foreignId('plan_task_id')->nullable()->constrained('plan_tasks')->nullOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->string('device_type')->nullable()->comment('web,mobile');
            $table->timestamps();
            $table->index(['user_id','started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_sessions');
        Schema::dropIfExists('plan_tasks');
        Schema::dropIfExists('daily_plans');
    }
};
