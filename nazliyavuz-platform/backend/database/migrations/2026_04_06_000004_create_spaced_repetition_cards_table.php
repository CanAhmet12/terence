<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spaced_repetition_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            
            // SM-2 Algorithm fields
            $table->decimal('ease_factor', 3, 2)->default(2.50); // Initial: 2.5
            $table->integer('interval_days')->default(1);
            $table->integer('repetitions')->default(0);
            
            // Review tracking
            $table->date('last_review_date')->nullable();
            $table->date('next_review_date');
            $table->integer('last_quality')->default(0); // 0-5 scale
            
            // Statistics
            $table->integer('total_reviews')->default(0);
            $table->integer('total_correct')->default(0);
            $table->integer('current_streak')->default(0);
            $table->integer('longest_streak')->default(0);
            
            // State
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable(); // Extra info (topic, difficulty, etc.)
            
            $table->timestamps();
            
            // Indexes
            $table->unique(['user_id', 'question_id']);
            $table->index(['user_id', 'next_review_date', 'is_active']);
            $table->index(['user_id', 'ease_factor']);
        });

        // Achievement codes for spaced repetition
        Schema::table('achievements', function (Blueprint $table) {
            if (!Schema::hasColumn('achievements', 'category')) {
                $table->string('category')->nullable()->after('type');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spaced_repetition_cards');
        
        Schema::table('achievements', function (Blueprint $table) {
            if (Schema::hasColumn('achievements', 'category')) {
                $table->dropColumn('category');
            }
        });
    }
};
