<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // AI Coach mesaj geçmişi
        if (!Schema::hasTable('ai_coach_messages')) {
            Schema::create('ai_coach_messages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->enum('role', ['user', 'assistant', 'system'])->default('user');
                $table->text('content');
                $table->timestamps();
                $table->index(['user_id', 'created_at']);
            });
        }

        // Kupon tablosu
        if (!Schema::hasTable('coupons')) {
            Schema::create('coupons', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->enum('type', ['percent', 'fixed'])->default('percent');
                $table->decimal('value', 8, 2);
                $table->integer('max_uses')->nullable();
                $table->integer('used_count')->default(0);
                $table->timestamp('expires_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_coach_messages');
        Schema::dropIfExists('coupons');
    }
};
