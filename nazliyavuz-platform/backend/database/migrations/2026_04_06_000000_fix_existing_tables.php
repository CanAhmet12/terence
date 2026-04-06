<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add missing columns to existing tables
        
        // Badges table - add code column
        if (Schema::hasTable('badges') && !Schema::hasColumn('badges', 'code')) {
            Schema::table('badges', function (Blueprint $table) {
                $table->string('code')->unique()->after('id');
            });
            
            // Generate codes for existing badges
            DB::statement("UPDATE badges SET code = CONCAT('badge_', id) WHERE code IS NULL OR code = ''");
        }
        
        // Badges - add tier and points columns
        if (Schema::hasTable('badges')) {
            if (!Schema::hasColumn('badges', 'tier')) {
                Schema::table('badges', function (Blueprint $table) {
                    $table->enum('tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze')->after('category');
                });
            }
            if (!Schema::hasColumn('badges', 'points')) {
                Schema::table('badges', function (Blueprint $table) {
                    $table->integer('points')->default(10)->after('xp_reward');
                });
            }
            if (!Schema::hasColumn('badges', 'requirements')) {
                Schema::table('badges', function (Blueprint $table) {
                    $table->json('requirements')->nullable()->after('condition_value');
                });
            }
        }
        
        // Course enrollments - rename completion_percentage to progress_percentage for consistency
        if (Schema::hasTable('course_enrollments') && Schema::hasColumn('course_enrollments', 'completion_percentage')) {
            Schema::table('course_enrollments', function (Blueprint $table) {
                $table->renameColumn('completion_percentage', 'progress_percentage');
            });
        }
        
        // Add completed_at column if not exists
        if (Schema::hasTable('course_enrollments') && !Schema::hasColumn('course_enrollments', 'completed_at')) {
            Schema::table('course_enrollments', function (Blueprint $table) {
                $table->timestamp('completed_at')->nullable()->after('progress_percentage');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('badges')) {
            Schema::table('badges', function (Blueprint $table) {
                $table->dropColumn(['code', 'tier', 'points', 'requirements']);
            });
        }
        
        if (Schema::hasTable('course_enrollments')) {
            if (Schema::hasColumn('course_enrollments', 'progress_percentage')) {
                Schema::table('course_enrollments', function (Blueprint $table) {
                    $table->renameColumn('progress_percentage', 'completion_percentage');
                });
            }
            Schema::table('course_enrollments', function (Blueprint $table) {
                $table->dropColumn('completed_at');
            });
        }
    }
};
