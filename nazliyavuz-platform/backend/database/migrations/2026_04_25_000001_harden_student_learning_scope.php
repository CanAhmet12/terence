<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // REMOVED: Blind grade assignment is unsafe and has been replaced
        // with manual review process and onboarding_completed flag.
        // See migration: 2026_05_06_000001_add_onboarding_completed_to_users_table.php
        
        // DB::table('users')
        //     ->where('role', 'student')
        //     ->whereNull('grade')
        //     ->update([
        //         'grade' => DB::raw("
        //             CASE
        //                 WHEN target_exam = 'LGS' THEN 8
        //                 ELSE 12
        //             END
        //         "),
        //     ]);

        // if (Schema::hasColumn('users', 'target_exam')) {
        //     DB::table('users')
        //         ->where('role', 'student')
        //         ->whereNull('target_exam')
        //         ->update(['target_exam' => 'TYT']);
        // }

        // REMOVED: Try-catch wrapper prevents proper constraint enforcement
        // Replaced with version-aware constraint in migration:
        // 2026_05_06_000002_add_student_grade_constraint.php
        
        // try {
        //     DB::statement(
        //         "ALTER TABLE users ADD CONSTRAINT chk_students_grade_required CHECK (role <> 'student' OR grade IS NOT NULL)"
        //     );
        // } catch (\Throwable) {
        //     // no-op: fallback to application + middleware enforcement
        // }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'grade')) {
                $table->index(['role', 'grade'], 'users_role_grade_index');
            }
            if (Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'target_exam')) {
                $table->index(['role', 'target_exam'], 'users_role_target_exam_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_grade_index');
            $table->dropIndex('users_role_target_exam_index');
        });

        try {
            DB::statement("ALTER TABLE users DROP CHECK chk_students_grade_required");
        } catch (\Throwable) {
            // no-op
        }
    }
};
