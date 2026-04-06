<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Badges table
        if (!Schema::hasTable('badges')) {
            Schema::create('badges', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->text('description');
                $table->string('category'); // achievement, streak, social, special
                $table->string('tier'); // bronze, silver, gold, platinum
                $table->string('icon_url')->nullable();
                $table->json('requirements'); // Conditions to earn
                $table->integer('points')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // User badges table
        if (!Schema::hasTable('user_badges')) {
            Schema::create('user_badges', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('badge_id')->constrained('badges')->onDelete('cascade');
                $table->timestamp('earned_at');
                $table->integer('progress')->default(100); // For tracking partial progress
                $table->json('metadata')->nullable(); // Extra info about earning
                $table->timestamps();
                
                $table->unique(['user_id', 'badge_id']);
                $table->index(['user_id', 'earned_at']);
            });
        }

        // Achievements table (different from badges - more granular)
        if (!Schema::hasTable('achievements')) {
            Schema::create('achievements', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->text('description');
                $table->string('type'); // question_streak, exam_completion, study_time, etc.
                $table->json('criteria');
                $table->integer('xp_reward')->default(0);
                $table->integer('points_reward')->default(0);
                $table->boolean('is_repeatable')->default(false);
                $table->timestamps();
            });
        }

        // User achievements table
        if (!Schema::hasTable('user_achievements')) {
            Schema::create('user_achievements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('achievement_id')->constrained('achievements')->onDelete('cascade');
                $table->timestamp('achieved_at');
                $table->integer('times_achieved')->default(1); // For repeatable achievements
                $table->json('metadata')->nullable();
                $table->timestamps();
                
                $table->index(['user_id', 'achieved_at']);
            });
        }

        // Leaderboards table
        if (!Schema::hasTable('leaderboards')) {
            Schema::create('leaderboards', function (Blueprint $table) {
                $table->id();
                $table->string('type'); // global, subject, grade, monthly, weekly
                $table->string('subject')->nullable();
                $table->string('grade')->nullable();
                $table->date('period_start');
                $table->date('period_end');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                
                $table->index(['type', 'is_active']);
            });
        }

        // Leaderboard entries table
        if (!Schema::hasTable('leaderboard_entries')) {
            Schema::create('leaderboard_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('leaderboard_id')->constrained('leaderboards')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->integer('rank');
                $table->integer('score');
                $table->integer('questions_solved')->default(0);
                $table->integer('exams_completed')->default(0);
                $table->integer('study_minutes')->default(0);
                $table->decimal('accuracy_rate', 5, 2)->default(0);
                $table->timestamps();
                
                $table->unique(['leaderboard_id', 'user_id']);
                $table->index(['leaderboard_id', 'rank']);
            });
        }

        // Streaks table
        if (!Schema::hasTable('streaks')) {
            Schema::create('streaks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('type'); // daily_login, question_solving, study_time
                $table->integer('current_count')->default(0);
                $table->integer('longest_count')->default(0);
                $table->date('last_activity_date')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                
                $table->unique(['user_id', 'type']);
                $table->index(['user_id', 'is_active']);
            });
        }

        // Daily rewards table
        if (!Schema::hasTable('daily_rewards')) {
            Schema::create('daily_rewards', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->date('claim_date');
                $table->integer('day_number'); // Day 1, 2, 3... of streak
                $table->string('reward_type'); // xp, points, badge, etc.
                $table->integer('reward_amount');
                $table->json('reward_details')->nullable();
                $table->timestamps();
                
                $table->unique(['user_id', 'claim_date']);
                $table->index(['user_id', 'claim_date']);
            });
        }

        // User XP and levels
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'xp')) {
                $table->integer('xp')->default(0);
            }
            if (!Schema::hasColumn('users', 'level')) {
                $table->integer('level')->default(1);
            }
            if (!Schema::hasColumn('users', 'gamification_points')) {
                $table->integer('gamification_points')->default(0);
            }
            if (!Schema::hasColumn('users', 'total_study_minutes')) {
                $table->integer('total_study_minutes')->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_rewards');
        Schema::dropIfExists('streaks');
        Schema::dropIfExists('leaderboard_entries');
        Schema::dropIfExists('leaderboards');
        Schema::dropIfExists('user_achievements');
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['xp', 'level', 'gamification_points', 'total_study_minutes']);
        });
    }
};
