<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add onboarding_completed flag
            // Default to true for existing users (assume they completed onboarding)
            // Set to false for students with null grade/target_exam
            $table->boolean('onboarding_completed')->default(true)->after('target_exam');
        });

        // Mark students with incomplete profiles as needing onboarding
        DB::statement("
            UPDATE users 
            SET onboarding_completed = FALSE 
            WHERE role = 'student' 
            AND (grade IS NULL OR target_exam IS NULL)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('onboarding_completed');
        });
    }
};
